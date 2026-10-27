import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Plus, Trash2, Send, SearchCode, Database, Check, Copy } from 'lucide-react'
import { chatGenerate, getChatHistory, deleteChatConversation, executeChatQuery } from '../services/api.js'
import Card from '../components/Card.jsx'
import { LoadingSpinner, ErrorBanner } from '../components/Feedback.jsx'
import toast from 'react-hot-toast'
import ChartViewer from '../components/ChartViewer.jsx'

// Helper to generate a UUID v4
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getUserId() {
  let uid = localStorage.getItem('querywise_user_id');
  if (!uid) {
    uid = uuidv4();
    localStorage.setItem('querywise_user_id', uid);
  }
  return uid;
}

export default function Chat() {
  const navigate = useNavigate();
  const userId = getUserId();
  
  const [history, setHistory] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [chartTypeOverride, setChartTypeOverride] = useState(null);
  
  const inputRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    setQueryResult(null);
    setExecuting(false);
    setChartTypeOverride(null);
  }, [activeChat]);

  async function executeAndFetch(sql) {
    setExecuting(true);
    setQueryResult(null);
    try {
      const res = await executeChatQuery(sql);
      if (res.success) {
        setQueryResult({ rows: res.rows, columns: res.columns });
      }
    } catch (e) {
      console.error('Execution error:', e);
    } finally {
      setExecuting(false);
    }
  }

  async function fetchHistory() {
    try {
      const data = await getChatHistory(userId);
      setHistory(data);
      if (data.length > 0 && !activeChat) {
        setActiveChat(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleNewChat() {
    setActiveChat(null);
    setPrompt('');
    setError('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError('');
    const cid = uuidv4();
    try {
      const response = await chatGenerate(prompt, userId, cid);
      const newChat = {
        conversation_id: cid,
        user_id: userId,
        prompt: prompt,
        generated_sql: response.generated_sql,
        explanation: response.explanation,
        created_at: new Date().toISOString()
      };
      
      setActiveChat(newChat);
      setHistory(prev => [newChat, ...prev]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(conversationId, e) {
    e.stopPropagation();
    try {
      await deleteChatConversation(conversationId, userId);
      setHistory(prev => prev.filter(c => c.conversation_id !== conversationId));
      if (activeChat?.conversation_id === conversationId) {
        setActiveChat(null);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleAnalyze() {
    if (activeChat?.generated_sql) {
      navigate('/analyzer', { state: { query: activeChat.generated_sql } });
    }
  }
  
  function handleCopy(text) {
    navigator.clipboard.writeText(text);
    toast.success('SQL copied to clipboard!');
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {history.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No chat history</p>
          ) : (
            history.map(chat => (
              <div
                key={chat.conversation_id}
                onClick={() => {
                  setActiveChat(chat);
                  setPrompt('');
                }}
                className={`group cursor-pointer rounded-lg p-3 text-sm flex items-start justify-between gap-2 transition-colors ${
                  activeChat?.conversation_id === chat.conversation_id
                    ? 'bg-brand-100 text-brand-900'
                    : 'hover:bg-slate-200 text-slate-700'
                }`}
              >
                <div className="overflow-hidden flex-1">
                  <p className="truncate font-medium">{chat.prompt}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(chat.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(chat.conversation_id, e)}
                  className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-600" />
            Natural Language to SQL
          </h2>
          <p className="text-sm text-slate-500">
            Describe what you want to query in plain English. AI will generate the SQL.
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!activeChat && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-slate-500">
              <Database className="w-12 h-12 text-slate-300" />
              <div>
                <p className="text-lg font-medium text-slate-700">How can I help you query?</p>
                <p className="text-sm">Enter a prompt below to generate SQL.</p>
              </div>
            </div>
          )}

          {activeChat && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="bg-slate-100 p-4 rounded-xl rounded-tr-sm inline-block max-w-[85%] self-end float-right clear-both">
                <p className="text-sm text-slate-800">{activeChat.prompt}</p>
              </div>
              
              <div className="clear-both"></div>

              <div className="bg-white border border-slate-200 p-5 rounded-xl rounded-tl-sm shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-brand-700 font-semibold mb-2">
                  <Database className="w-5 h-5" />
                  Generated SQL
                </div>
                
                <div className="relative">
                  <pre className="code-font text-sm bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto">
                    {activeChat.generated_sql}
                  </pre>
                  <button
                    onClick={() => handleCopy(activeChat.generated_sql)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                    title="Copy SQL"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="prose prose-sm text-slate-600 mt-4">
                  <p>{activeChat.explanation}</p>
                </div>

                {executing && (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner label="Fetching data securely..." />
                  </div>
                )}

                {queryResult && !executing && (
                  <div className="mt-6 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Live Data Visualization
                        </span>
                        <select 
                          value={chartTypeOverride || activeChat.chart_type || 'table'} 
                          onChange={(e) => setChartTypeOverride(e.target.value)}
                          className="text-xs bg-slate-100 border-none rounded-md px-2 py-1 outline-none text-slate-600 font-medium cursor-pointer hover:bg-slate-200 transition-colors"
                        >
                          <option value="table">Table</option>
                          <option value="bar">Bar Chart</option>
                          <option value="pie">Pie Chart</option>
                          <option value="line">Line Chart</option>
                        </select>
                      </div>
                      <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md font-medium">
                        {queryResult.rows.length} rows
                      </span>
                    </div>
                    <ChartViewer 
                      data={queryResult.rows} 
                      columns={queryResult.columns} 
                      chartType={chartTypeOverride || activeChat.chart_type || 'table'} 
                    />
                  </div>
                )}
                
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => executeAndFetch(activeChat.generated_sql)}
                    disabled={executing || activeChat.generated_sql.includes('Please provide a technical')}
                    className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm shadow-sm shadow-brand-600/20"
                  >
                    <Database className="w-4 h-4" />
                    {executing ? 'Executing...' : 'Run & Visualize'}
                  </button>
                  <button
                    onClick={handleAnalyze}
                    className="inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium px-4 py-2 rounded-lg transition-colors text-sm border border-slate-200"
                  >
                    <SearchCode className="w-4 h-4" />
                    Analyze Performance
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex justify-center mt-8">
              <LoadingSpinner label="Generating SQL..." />
            </div>
          )}

          {error && (
            <div className="mt-4">
              <ErrorBanner message={error} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100">
          <form onSubmit={handleSubmit} className="relative max-w-5xl mx-auto">
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Show me all customers who joined last month..."
              disabled={loading}
              className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm bg-slate-50 disabled:bg-slate-100"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || loading}
              className="absolute right-2 top-2 p-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-2">
            <p className="text-[10px] text-slate-400">
              Generated queries are read-only and automatically validated against your database schema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
