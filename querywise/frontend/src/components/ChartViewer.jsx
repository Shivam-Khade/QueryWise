import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function ChartViewer({ data, columns, chartType }) {
  if (!data || data.length === 0) {
    return <div className="text-sm text-slate-500 text-center py-4">No data returned</div>;
  }

  // If there's only 1 column, or chartType is explicitly 'table', render a table
  if (columns.length < 2 || chartType === 'table') {
    return (
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-medium">
            <tr>
              {columns.map(col => <th key={col} className="px-4 py-2">{col}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50">
                {columns.map(col => (
                  <td key={col} className="px-4 py-2">{row[col]?.toString() ?? 'null'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Assume first column is X-axis (category), and rest are Y-axis (values)
  const xAxisKey = columns[0];
  const dataKeys = columns.slice(1).filter(col => typeof data[0][col] === 'number' || !isNaN(parseFloat(data[0][col])));

  if (dataKeys.length === 0) {
    // Fallback to table if no numeric columns found for charting
    return <ChartViewer data={data} columns={columns} chartType="table" />;
  }

  // Format data for Recharts (convert strings to numbers if possible)
  const formattedData = data.map(row => {
    const newRow = { ...row };
    dataKeys.forEach(k => {
      newRow[k] = parseFloat(row[k]) || 0;
    });
    return newRow;
  });

  const renderChart = () => {
    if (chartType === 'line') {
      return (
        <LineChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey={xAxisKey} tick={{fontSize: 12}} tickLine={false} axisLine={false} />
          <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          {dataKeys.map((k, i) => (
            <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
          ))}
        </LineChart>
      );
    }
    
    if (chartType === 'pie') {
      const pieDataKey = dataKeys[0]; // Pie chart only uses one value dimension
      return (
        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Pie
            data={formattedData}
            dataKey={pieDataKey}
            nameKey={xAxisKey}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
              const RADIAN = Math.PI / 180;
              const radius = 25 + innerRadius + (outerRadius - innerRadius);
              const x = cx + radius * Math.cos(-midAngle * RADIAN);
              const y = cy + radius * Math.sin(-midAngle * RADIAN);
              return (
                <text x={x} y={y} fill="#64748b" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12">
                  {formattedData[index][xAxisKey]}
                </text>
              );
            }}
          >
            {formattedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      );
    }

    // Default to Bar chart
    return (
      <BarChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey={xAxisKey} tick={{fontSize: 12}} tickLine={false} axisLine={false} />
        <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        {dataKeys.map((k, i) => (
          <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    );
  };

  return (
    <div className="h-72 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
