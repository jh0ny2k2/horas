import { useLocation, useNavigate } from 'react-router-dom'
import { navItems, isSectionActive } from '../../lib/navItems'

export default function NavRail() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="flex flex-col items-center gap-1.5 py-4 w-20">
      {navItems.map((item) => {
        const isActive = isSectionActive(item.path, location.pathname)
        const isPrimary = item.path === '/register'

        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex flex-col items-center gap-1.5 py-2 rounded-2xl transition-all duration-200 group ${
              isPrimary ? 'mt-1 mb-2' : ''
            }`}
            aria-label={item.label}
          >
            <span
              className={`flex items-center justify-center w-14 h-11 rounded-2xl transition-all duration-200 ${
                isPrimary || isActive
                  ? 'bg-gradient-to-br from-brand-600 to-accent-600 text-white shadow-lg shadow-brand-600/30 group-hover:brightness-110 group-hover:scale-105'
                  : 'text-slate-400 hover:text-brand-600 dark:text-slate-500 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10'
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={isPrimary || isActive ? 2.2 : 1.6}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
            </span>
            <span
              className={`text-[10px] font-medium leading-tight ${
                isPrimary
                  ? 'text-brand-700 dark:text-brand-300 font-bold'
                  : isActive
                    ? 'text-brand-700 dark:text-brand-300 font-semibold'
                    : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
