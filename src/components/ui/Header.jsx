import { useAuth } from '../../contexts/AuthContext'

export default function Header() {
  const { user, signOut } = useAuth()

  const displayName = user?.email?.split('@')[0] || 'Usuario'
  const greeting = getGreeting()

  return (
    <header className="sticky top-0 z-40 bg-ivory/80 backdrop-blur-xl border-b border-slate-200/50">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-xs text-gold font-semibold tracking-wide uppercase">Horas de Trabajo</p>
            <h1 className="text-xl font-bold text-slate-800 mt-0.5">
              {greeting}, <span className="text-gold">{displayName}</span>
            </h1>
          </div>
          <button
            onClick={signOut}
            className="btn-ghost text-slate-400 hover:text-red-400 p-2 rounded-xl transition-colors"
            title="Cerrar sesión"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
}
