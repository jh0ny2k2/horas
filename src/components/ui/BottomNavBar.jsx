import { useLocation, useNavigate } from 'react-router-dom'
import { navItems, isSectionActive } from '../../lib/navItems'

const sideItems = navItems.filter(item => item.path !== '/register' && item.path !== '/settings')

export default function BottomNavBar() {
  const location = useLocation()
  const navigate = useNavigate()

  const renderItem = (item) => {
    const isActive = isSectionActive(item.path, location.pathname)
    return (
      <button
        key={item.path}
        onClick={() => navigate(item.path)}
        className="flex flex-col items-center gap-0.5 min-w-0 flex-1 pt-1"
        aria-label={item.label}
      >
        <span
          className={`relative flex items-center justify-center w-11 h-9 rounded-2xl transition-colors duration-200 ${
            isActive
              ? 'text-brand-600 dark:text-brand-300'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <span
            className={`absolute inset-0 rounded-2xl transition-all duration-200 ${
              isActive
                ? 'bg-brand-600/10 dark:bg-brand-500/15 opacity-100'
                : 'opacity-0'
            }`}
          />
          <svg
            className="w-5 h-5 relative"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={isActive ? 2.2 : 1.6}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
          </svg>
          <span
            className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-brand-500 dark:bg-brand-400 transition-opacity duration-200 ${
              isActive ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </span>
        <span
          className={`text-[10px] leading-tight ${
            isActive
              ? 'text-brand-700 dark:text-brand-300 font-bold'
              : 'text-slate-400 dark:text-slate-500 font-medium'
          }`}
        >
          {item.label}
        </span>
      </button>
    )
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-bottom">
      <div className="px-4 pb-3">
        <div className="max-w-lg mx-auto relative">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2rem] border border-slate-200/70 dark:border-slate-800 shadow-premium-lg px-1 pt-4 pb-1.5">
            <div className="grid grid-cols-5 items-end">
              {sideItems.slice(0, 2).map(renderItem)}
              <div />
              {sideItems.slice(2).map(renderItem)}
            </div>
          </div>

          <button
            onClick={() => navigate('/register')}
            aria-label="Registrar horas"
            className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[10px] flex flex-col items-center gap-0.5 group"
          >
            <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-brand-600 to-accent-600 text-white shadow-xl shadow-brand-600/40 ring-4 ring-ivory dark:ring-slate-950 group-hover:brightness-110 group-hover:scale-105 active:scale-95 transition-all duration-200">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </span>
            <span className="text-[10px] font-bold text-brand-700 dark:text-brand-300 bg-ivory/80 dark:bg-slate-900/80 rounded-full px-2 py-0.5 shadow-sm">
              Registrar
            </span>
          </button>
        </div>
      </div>
    </nav>
  )
}
