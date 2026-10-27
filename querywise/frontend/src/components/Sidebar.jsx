import { NavLink } from 'react-router-dom'
import { LayoutDashboard, SearchCode, History, Lightbulb, Database, Table2, MessageSquare, X } from 'lucide-react'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/chat', label: 'NL to SQL Chat', icon: MessageSquare },
  { to: '/analyzer', label: 'Query Analyzer', icon: SearchCode },
  { to: '/history', label: 'Query History', icon: History },
  { to: '/recommendations', label: 'Index Recommendations', icon: Lightbulb },
  { to: '/explorer', label: 'Database Explorer', icon: Table2 },
]

export default function Sidebar({ isOpen, setIsOpen }) {
  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      setIsOpen(false)
    }
  }

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col shrink-0 bg-white/95 lg:bg-white/60 backdrop-blur-2xl text-slate-800 h-screen border-r border-slate-200/60 shadow-xl lg:shadow-sm transition-all duration-300 ease-in-out ${
          isOpen
            ? 'w-64 translate-x-0 opacity-100'
            : '-translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 lg:overflow-hidden lg:border-none'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 whitespace-nowrap min-w-[16rem]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-slate-900 text-white">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 leading-tight">QueryWise</p>
              <p className="text-xs text-slate-500 leading-tight">Query Optimizer</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                    : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200/60 text-xs text-slate-500 bg-slate-50/50">
          Safe by design: read-only SELECT queries only. No schema changes made automatically.
        </div>
      </aside>
    </>
  )
}
