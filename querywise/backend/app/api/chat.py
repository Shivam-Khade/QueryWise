import os
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
try:
    import google.generativeai as genai
except ImportError:
    genai = None

from app.database import get_db, get_target_connection
from app.models.models import ChatConversation
from app.schemas.schemas import ChatGenerateRequest, ChatGenerateResponse, ChatConversationOut, ExecuteQueryRequest, ExecuteQueryResponse
from app.services.db_explorer import get_full_schema
from app.services.query_validator import validate_query, QueryValidationError

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Initialize Gemini Client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY and genai:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
    except Exception:
        genai = None
else:
    genai = None

_SCHEMA_CONTEXT_CACHE = None

def generate_schema_context() -> str:
    global _SCHEMA_CONTEXT_CACHE
    if _SCHEMA_CONTEXT_CACHE:
        return _SCHEMA_CONTEXT_CACHE
    try:
        schema = get_full_schema()
        context = "Database Schema:\n"
        for table in schema:
            context += f"Table: {table['table_name']}\n"
            context += "Columns: " + ", ".join([f"{col['column_name']} ({col['data_type']})" for col in table['columns']]) + "\n"
            if table['primary_keys']:
                context += "Primary Keys: " + ", ".join(table['primary_keys']) + "\n"
            if table['foreign_keys']:
                for fk in table['foreign_keys']:
                    context += f"Foreign Key: {fk['column_name']} references {fk['referenced_table']}({fk['referenced_column']})\n"
            context += "\n"
        if context.strip() != "Database Schema:":
            _SCHEMA_CONTEXT_CACHE = context
        return context
    except Exception:
        return "Database Schema: 12 tables (departments, employees, customers, addresses, categories, suppliers, products, orders, order_items, payments, shipments, reviews)."


@router.post("/generate", response_model=ChatGenerateResponse)
def generate_sql(payload: ChatGenerateRequest, db: Session = Depends(get_db)):
    if not genai:
        raise HTTPException(status_code=500, detail="Gemini API key is missing or invalid.")

    schema_context = generate_schema_context()

    system_prompt = f"""You are a PostgreSQL expert AI and Data Analyst. Your job is to translate user natural language queries into read-only SELECT SQL queries based on the provided database schema.

CRITICAL RULE: If the user's prompt is a greeting (e.g., "yo", "hello"), conversational, or completely unrelated to querying the provided database schema, you MUST NOT generate a random query. Instead, return the following JSON exactly:
{{
  "sql": "SELECT 'Please provide a technical database query' AS status;",
  "explanation": "I am a specialized SQL generation assistant. Please ask a technical question related to the database schema.",
  "chart": "table"
}}

Otherwise, you MUST output ONLY a valid JSON object with exactly 3 keys:
- "sql": A valid PostgreSQL SELECT query.
- "explanation": A brief explanation of the query.
- "chart": The best visualization type ("bar", "line", "pie", or "table"). Use 'bar' for categories (like counts), 'line' for dates/time, 'pie' for percentages, and 'table' for lists.

Do NOT use markdown ```json``` code blocks. Return ONLY raw JSON.

Here is the schema:
{schema_context}
"""

    try:
        try:
            model = genai.GenerativeModel(
                model_name="gemini-2.5-flash",
                system_instruction=system_prompt,
            )
            response = model.generate_content(
                payload.prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.0,
                ),
            )
        except Exception:
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=system_prompt,
            )
            response = model.generate_content(
                payload.prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.0,
                ),
            )
        content = response.text.strip()
        
        # Strip markdown if Gemini ignores instructions
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

        import json
        
        try:
            parsed = json.loads(content)
            sql = parsed.get("sql", "").strip()
            explanation = parsed.get("explanation", "").strip()
            chart_type = parsed.get("chart", "table").lower()
        except json.JSONDecodeError:
            # Fallback
            sql = "SELECT 'Error parsing AI response' AS status;"
            explanation = "The AI failed to generate valid JSON."
            chart_type = "table"

        if chart_type not in ["bar", "line", "pie", "table"]:
            chart_type = "table"

        # Cleanup sql markdown if any
        if sql.startswith("```sql"):
            sql = sql[6:]
        if sql.endswith("```"):
            sql = sql[:-3]
        sql = sql.strip()

        # Save to DB
        chat_msg = ChatConversation(
            conversation_id=payload.conversation_id,
            user_id=payload.user_id,
            prompt=payload.prompt,
            generated_sql=sql,
            explanation=explanation,
            chart_type=chart_type
        )
        db.add(chat_msg)
        db.commit()

        return ChatGenerateResponse(
            success=True,
            generated_sql=sql,
            explanation=explanation,
            chart_type=chart_type
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute", response_model=ExecuteQueryResponse)
def execute_generated_query(payload: ExecuteQueryRequest):
    try:
        # Validate that it is a safe read-only SELECT
        clean_query = validate_query(payload.sql)
        
        with get_target_connection() as conn:
            with conn.cursor() as cur:
                # Add limit if not present to prevent massive payloads
                safe_query = clean_query
                if "limit" not in safe_query.lower():
                    safe_query = f"SELECT * FROM ({safe_query}) AS sub LIMIT 100"
                    
                cur.execute(safe_query)
                columns = [desc[0] for desc in cur.description]
                rows = [dict(row) for row in cur.fetchall()]
                
                return ExecuteQueryResponse(
                    success=True,
                    columns=columns,
                    rows=rows
                )
    except QueryValidationError as e:
        return ExecuteQueryResponse(success=False, columns=[], rows=[], error=str(e))
    except Exception as e:
        return ExecuteQueryResponse(success=False, columns=[], rows=[], error=str(e))


@router.get("/history/{user_id}", response_model=List[ChatConversationOut])
def get_chat_history(user_id: str, db: Session = Depends(get_db)):
    history = db.query(ChatConversation).filter(ChatConversation.user_id == user_id).order_by(ChatConversation.created_at.desc()).all()
    return history


@router.get("/conversation/{conversation_id}", response_model=List[ChatConversationOut])
def get_conversation(conversation_id: str, user_id: str, db: Session = Depends(get_db)):
    conversation = db.query(ChatConversation).filter(
        ChatConversation.conversation_id == conversation_id,
        ChatConversation.user_id == user_id
    ).order_by(ChatConversation.created_at.asc()).all()
    return conversation


@router.delete("/conversation/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(conversation_id: str, user_id: str, db: Session = Depends(get_db)):
    db.query(ChatConversation).filter(
        ChatConversation.conversation_id == conversation_id,
        ChatConversation.user_id == user_id
    ).delete()
    db.commit()
    return
