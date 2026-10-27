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

import { Database } from 'lucide-react'

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024
    }
    return true
  })

  return (
    <div className="flex min-h-screen relative overflow-hidden bg-slate-50/50">
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
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/60 bg-white/70 backdrop-blur-md z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
              aria-label="Toggle navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <div className="p-1 rounded-md bg-slate-900 text-white">
                <Database className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 text-sm">QueryWise</span>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6">
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
