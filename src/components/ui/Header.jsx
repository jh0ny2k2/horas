import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Header() {
  const { user, signOut, profile, company } = useAuth()
  const navigate = useNavigate()
  const [pendingCount, setPendingCount] = useState(0)

  const displayName = user?.email?.split('@')[0] || 'Usuario'
  const greeting = getGreeting()

  const roleLabel = profile?.role === 'company_owner'
    ? company?.name || 'Empresa'
    : profile?.role === 'employee'
      ? 'Empleado'
      : 'Persona'

  useEffect(() => {
    if (profile?.role !== 'company_owner' || !profile?.company_id) return

    loadPendingShifts()

    const channel = supabase
      .channel('pending-shifts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_shifts',
        },
        () => {
          loadPendingShifts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile])

  const loadPendingShifts = async () => {
    if (!profile?.company_id) return

    try {
      const { data: members } = await supabase
        .from('company_members')
        .select('user_id')
        .eq('company_id', profile.company_id)
        .eq('status', 'accepted')

      if (!members || members.length === 0) {
        setPendingCount(0)
        return
      }

      const userIds = members.map(m => m.user_id)

      const { count } = await supabase
        .from('work_shifts')
        .select('*', { count: 'exact', head: true })
        .eq('approved', false)
        .in('user_id', userIds)

      setPendingCount(count || 0)
    } catch {
      setPendingCount(0)
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-ivory/80 backdrop-blur-xl border-b border-slate-200/50">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-xs text-gold font-semibold tracking-wide uppercase">Workora</p>
            <h1 className="text-xl font-bold text-slate-800 mt-0.5">
              {greeting}, <span className="text-gold">{displayName}</span>
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">{roleLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            {profile?.role === 'company_owner' && (
              <button
                onClick={() => navigate('/company')}
                className="relative p-2 rounded-xl text-slate-400 hover:text-gold hover:bg-gold/10 transition-all"
                title={pendingCount > 0 ? `${pendingCount} turno(s) pendiente(s)` : 'Sin notificaciones'}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {pendingCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px] shadow-lg animate-pulse">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </button>
            )}
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
