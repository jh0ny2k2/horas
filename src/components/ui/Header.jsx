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
        .eq('rejected', false)
        .in('user_id', userIds)

      setPendingCount(count || 0)
    } catch {
      setPendingCount(0)
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-ivory/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/80 safe-area-top">
      <div className="max-w-6xl mx-auto md:px-6 lg:px-10">
        <div className="px-5 pt-4 pb-3 md:pt-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 shadow-glow" />
                <p className="text-[10px] font-bold tracking-[0.14em] uppercase bg-gradient-to-r from-brand-600 to-accent-600 dark:from-brand-400 dark:to-accent-400 bg-clip-text text-transparent">
                  Workora
                </p>
              </div>
              <h1 className="text-xl font-extrabold text-slate-800 dark:text-white truncate leading-tight">
                {greeting}, <span className="bg-gradient-to-r from-brand-600 to-accent-600 dark:from-brand-400 dark:to-accent-400 bg-clip-text text-transparent">{displayName}</span>
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                <span className="px-1.5 py-0.5 rounded-full bg-brand-600/10 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold">{roleLabel}</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {profile?.role === 'company_owner' && (
                <button
                  onClick={() => navigate('/')}
                  className="relative p-2.5 rounded-2xl text-slate-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-all"
                  title={pendingCount > 0 ? `${pendingCount} turno(s) pendiente(s)` : 'Sin notificaciones'}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  {pendingCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-gradient-to-r from-rose-500 to-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg animate-pulse">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={() => navigate('/settings')}
                className="p-2.5 rounded-2xl text-slate-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors md:hidden"
                title="Ajustes"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={signOut}
                className="p-2.5 rounded-2xl text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                title="Cerrar sesión"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
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
