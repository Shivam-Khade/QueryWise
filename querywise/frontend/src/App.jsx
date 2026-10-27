import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Chat from './pages/Chat.jsx'
import QueryAnalyzer from './pages/QueryAnalyzer.jsx'
import QueryHistory from './pages/QueryHistory.jsx'
import IndexRecommendations from './pages/IndexRecommendations.jsx'
import QueryDetails from './pages/QueryDetails.jsx'
import DatabaseExplorer from './pages/DatabaseExplorer.jsx'

import { Toaster } from 'react-hot-toast';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="flex min-h-screen relative overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <main className="flex-1 min-w-0 bg-transparent flex flex-col h-screen overflow-hidden">
        <Toaster 
          position="top-center"
          toastOptions={{
            className: 'bg-white text-slate-800 rounded-2xl shadow-lg border border-slate-100 font-medium text-sm px-4 py-3',
            style: {
              backdropFilter: 'blur(10px)',
              background: 'rgba(255, 255, 255, 0.9)',
            },
          }}
        />
        <div className="flex items-center px-4 py-3 border-b border-slate-200/60 bg-white/60 backdrop-blur-md">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          <div className="max-w-7xl mx-auto h-full">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/analyzer" element={<QueryAnalyzer />} />
              <Route path="/history" element={<QueryHistory />} />
              <Route path="/history/:id" element={<QueryDetails />} />
              <Route path="/recommendations" element={<IndexRecommendations />} />
              <Route path="/explorer" element={<DatabaseExplorer />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  )
}
