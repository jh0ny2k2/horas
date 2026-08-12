import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatHours, getWeekRange, getMonthRange } from '../../lib/calculations'
import SummaryCard from './SummaryCard'
import LoadingSpinner from '../ui/LoadingSpinner'
import EmptyState from '../ui/EmptyState'
import ErrorMessage from '../ui/ErrorMessage'
import ShiftStatusBadge from '../shifts/ShiftStatusBadge'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const hourlyRate = Number(profile?.hourly_rate || 0)
  const isIndividual = profile?.role === 'individual'
  const navigate = useNavigate()
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadShifts()
  }, [user])

  const loadShifts = async () => {
    try {
      setLoading(true)
      setError('')
      const { data, error } = await supabase
        .from('work_shifts')
        .select('*')
        .eq('user_id', user.id)
        .order('work_date', { ascending: false })
        .order('start_time', { ascending: false })

      if (error) throw error
      setShifts(data || [])
    } catch (err) {
      setError('Error al cargar los datos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const today = new Date()
  const todayStr = toDateStr(today)
  const { start: weekStart, end: weekEnd } = getWeekRange(today)
  const { start: monthStart, end: monthEnd } = getMonthRange(today)

  const approvedShifts = shifts.filter(s => s.approved)
  const pendingShifts = shifts.filter(s => !s.approved && !s.rejected)
  const pendingCount = pendingShifts.length

  const todayShifts = approvedShifts.filter(s => s.work_date === todayStr)
  const weekShifts = approvedShifts.filter(s => {
    const d = new Date(s.work_date)
    return d >= weekStart && d <= weekEnd
  })
  const monthShifts = approvedShifts.filter(s => {
    const d = new Date(s.work_date)
    return d >= monthStart && d <= monthEnd
  })

  const todayHours = todayShifts.reduce((acc, s) => acc + Number(s.total_hours), 0)
  const weekHours = weekShifts.reduce((acc, s) => acc + Number(s.total_hours), 0)
  const monthHours = monthShifts.reduce((acc, s) => acc + Number(s.total_hours), 0)
  const totalHours = approvedShifts.reduce((acc, s) => acc + Number(s.total_hours), 0)

  const weekDays = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    const dateStr = toDateStr(d)
    const hours = approvedShifts
      .filter(s => s.work_date === dateStr)
      .reduce((acc, s) => acc + Number(s.total_hours), 0)
    weekDays.push({
      label: ['L', 'M', 'X', 'J', 'V', 'S', 'D'][i],
      hours,
      isToday: d.toDateString() === today.toDateString(),
      hasData: hours > 0,
    })
  }
  const maxWeekHours = Math.max(...weekDays.map(d => d.hours), 1)

  if (loading) return <LoadingSpinner text="Cargando resumen..." />

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Resumen</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Tu actividad de trabajo</p>
        </div>
        <button
          onClick={() => navigate('/register')}
          className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors px-3 py-2 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-500/10"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Añadir
        </button>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {pendingCount > 0 && !isIndividual && (
        <button
          onClick={() => navigate('/history')}
          className="w-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex items-center gap-3 animate-fade-in text-left hover:border-amber-300 dark:hover:border-amber-500/40 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {pendingCount} turno{pendingCount > 1 ? 's' : ''} pendiente{pendingCount > 1 ? 's' : ''} de aprobación
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400/80">Toca para verlos en el historial</p>
          </div>
          <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {shifts.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-7 h-7 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="No hay registros aún"
          description="Comienza a registrar tus jornadas laborales para ver tu resumen aquí."
          action={
            <button onClick={() => navigate('/register')} className="btn-primary w-auto px-8">
              Registrar primera jornada
            </button>
          }
        />
      ) : (
        <>
          {/* Hero: hoy */}
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-600 to-accent-600 p-6 shadow-xl shadow-brand-600/30">
            <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-8 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />

            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">Registrado hoy</p>
                  <p className="text-4xl font-extrabold text-white mt-1 tabular-nums">
                    {formatHours(todayHours)}
                    <span className="text-lg font-bold text-white/60 ml-1">h</span>
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                  todayShifts.length > 0
                    ? 'bg-white/15 text-white'
                    : 'bg-white/10 text-white/60'
                }`}>
                  {todayShifts.length > 0
                    ? `${todayShifts.length} turno${todayShifts.length > 1 ? 's' : ''}`
                    : 'Sin registro'}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] text-white/60 uppercase tracking-wider">Semana</p>
                  <p className="text-white font-bold tabular-nums">{formatHours(weekHours)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/60 uppercase tracking-wider">Mes</p>
                  <p className="text-white font-bold tabular-nums">{formatHours(monthHours)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/60 uppercase tracking-wider">Total</p>
                  <p className="text-white font-bold tabular-nums">{formatHours(totalHours)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Esta semana */}
          {weekShifts.length > 0 && (
            <div className="card-premium">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Esta semana</h3>
                <p className="text-sm font-extrabold text-brand-600 dark:text-brand-400 tabular-nums">
                  {formatHours(weekHours)}
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 ml-0.5">h</span>
                </p>
              </div>
              <div className="flex items-end justify-between gap-2 h-28">
                {weekDays.map((d, i) => {
                  const pct = d.hours > 0 ? Math.max((d.hours / maxWeekHours) * 100, 6) : 3
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className={`text-[10px] font-semibold tabular-nums ${d.hasData ? 'text-brand-600 dark:text-brand-400' : 'text-transparent'}`}>
                        {d.hasData ? formatHours(d.hours) : '0'}
                      </span>
                      <div className="w-full max-w-[18px] rounded-full bg-slate-100 dark:bg-slate-800 flex items-end justify-center overflow-hidden"
                        style={{ height: `${Math.max(pct, 8)}%` }}>
                        <div
                          className={`w-full rounded-full transition-all duration-500 ${
                            d.isToday
                              ? 'bg-gradient-to-b from-brand-500 to-accent-600'
                              : d.hasData
                                ? 'bg-gradient-to-b from-brand-400/60 to-accent-500/60'
                                : ''
                          }`}
                          style={{ height: '100%' }}
                        />
                      </div>
                      <span className={`text-[10px] font-medium ${d.isToday ? 'text-brand-700 dark:text-brand-300 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                        {d.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Ganancias */}
          {!isIndividual && (
            <div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">Ganancias</h3>
              <div className="grid grid-cols-2 gap-3 stagger">
                <SummaryCard
                  label="Ganado este mes"
                  value={`€${(monthHours * hourlyRate).toFixed(2)}`}
                  subtitle={formatHours(monthHours)}
                  icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  color="brand"
                />
                <SummaryCard
                  label="Ganado en total"
                  value={`€${(totalHours * hourlyRate).toFixed(2)}`}
                  subtitle={formatHours(totalHours)}
                  icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  color="blue"
                />
              </div>
            </div>
          )}

          {/* Últimos registros */}
          <div className="card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Últimos registros</h3>
              <button
                onClick={() => navigate('/history')}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
              >
                Ver todos
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {shifts.slice(0, 5).map((shift) => (
                <button
                  key={shift.id}
                  onClick={() => navigate('/history')}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    shift.approved
                      ? 'bg-emerald-50 dark:bg-emerald-500/10'
                      : shift.rejected
                        ? 'bg-rose-50 dark:bg-rose-500/10'
                        : 'bg-amber-50 dark:bg-amber-500/10'
                  }`}>
                    <svg className={`w-5 h-5 ${shift.approved ? 'text-emerald-600 dark:text-emerald-400' : shift.rejected ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {formatDate(shift.work_date)}
                      </p>
                      <ShiftStatusBadge shift={shift} />
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                      {shift.start_time.slice(0, 5)} – {shift.end_time.slice(0, 5)}
                      {shift.break_minutes > 0 && ` · ${shift.break_minutes} min de pausa`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-extrabold text-slate-800 dark:text-white tabular-nums">
                      {formatHours(shift.total_hours)}
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">h</span>
                    </p>
                  </div>
                </button>
              ))}
            </div>
            {shifts.length > 5 && (
              <button
                onClick={() => navigate('/history')}
                className="w-full text-center text-sm text-brand-600 dark:text-brand-400 font-semibold py-3.5 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
              >
                Ver todos los registros
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function toDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Hoy'
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer'

  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}
