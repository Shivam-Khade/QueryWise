import { NavLink } from 'react-router-dom'
import { LayoutDashboard, SearchCode, History, Lightbulb, Database, Table2, MessageSquare } from 'lucide-react'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/chat', label: 'NL to SQL Chat', icon: MessageSquare },
  { to: '/analyzer', label: 'Query Analyzer', icon: SearchCode },
  { to: '/history', label: 'Query History', icon: History },
  { to: '/recommendations', label: 'Index Recommendations', icon: Lightbulb },
  { to: '/explorer', label: 'Database Explorer', icon: Table2 },
]

export default function Sidebar({ isOpen, setIsOpen }) {
  return (
    <aside className={`flex flex-col shrink-0 bg-white/60 backdrop-blur-2xl text-slate-800 h-screen border-r border-slate-200/60 shadow-sm transition-all duration-300 ease-in-out z-20 ${isOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden border-none'}`}>
      <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-200/60 whitespace-nowrap min-w-[16rem]">
        <Database className="w-6 h-6 text-slate-900" />
        <div>
          <p className="font-semibold text-slate-900 leading-tight">QueryWise</p>
          <p className="text-xs text-slate-500 leading-tight">Query Optimizer</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                  : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-slate-200/60 text-xs text-slate-500">
        Safe by design: read-only SELECT queries only. No index is ever
        created automatically.
      </div>
    </aside>
  )
}
