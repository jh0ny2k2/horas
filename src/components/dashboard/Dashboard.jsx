import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatHours, getWeekRange, getMonthRange } from '../../lib/calculations'
import { startOfWeek } from '../../lib/calculations'
import SummaryCard from './SummaryCard'
import LoadingSpinner from '../ui/LoadingSpinner'
import EmptyState from '../ui/EmptyState'
import ErrorMessage from '../ui/ErrorMessage'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { user } = useAuth()
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
  const todayStr = today.toISOString().split('T')[0]
  const { start: weekStart, end: weekEnd } = getWeekRange(today)
  const { start: monthStart, end: monthEnd } = getMonthRange(today)

  const todayShifts = shifts.filter(s => s.work_date === todayStr)
  const weekShifts = shifts.filter(s => {
    const d = new Date(s.work_date)
    return d >= weekStart && d <= weekEnd
  })
  const monthShifts = shifts.filter(s => {
    const d = new Date(s.work_date)
    return d >= monthStart && d <= monthEnd
  })

  const todayHours = todayShifts.reduce((acc, s) => acc + Number(s.total_hours), 0)
  const weekHours = weekShifts.reduce((acc, s) => acc + Number(s.total_hours), 0)
  const monthHours = monthShifts.reduce((acc, s) => acc + Number(s.total_hours), 0)
  const totalHours = shifts.reduce((acc, s) => acc + Number(s.total_hours), 0)

  const todayDays = weekShifts.length
  const avgDay = todayDays > 0 ? (weekHours / todayDays) : 0

  if (loading) return <LoadingSpinner text="Cargando resumen..." />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-700">Resumen de horas</h2>
        <button
          onClick={() => navigate('/register')}
          className="flex items-center gap-1.5 text-sm font-medium text-gold hover:text-gold/80 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Añadir
        </button>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      <div className="grid grid-cols-2 gap-3 stagger">
        <SummaryCard
          label="Hoy"
          value={formatHours(todayHours)}
          subtitle={todayShifts.length > 0 ? `${todayShifts.length} turno${todayShifts.length > 1 ? 's' : ''}` : 'Sin registro'}
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          color="gold"
        />
        <SummaryCard
          label="Esta semana"
          value={formatHours(weekHours)}
          subtitle={todayDays > 0 ? `Promedio ${formatHours(avgDay)}/día` : 'Sin datos'}
          icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          color="blue"
        />
        <SummaryCard
          label="Este mes"
          value={formatHours(monthHours)}
          subtitle={monthShifts.length} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          color="green"
        />
        <SummaryCard
          label="Total acumulado"
          value={formatHours(totalHours)}
          subtitle={`${shifts.length} registro${shifts.length !== 1 ? 's' : ''}`}
          icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          color="purple"
        />
      </div>

      {shifts.length === 0 && (
        <EmptyState
          icon={
            <svg className="w-7 h-7 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="No hay registros aún"
          description="Comienza a registrar tus jornadas laborales para ver tu resumen aquí."
          action={
            <button onClick={() => navigate('/register')} className="btn-primary">
              Registrar primera jornada
            </button>
          }
        />
      )}

      {shifts.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Últimos registros</h3>
          <div className="space-y-2">
            {shifts.slice(0, 5).map((shift) => (
              <div
                key={shift.id}
                className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {formatDate(shift.work_date)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                    {shift.break_minutes > 0 && ` · ${shift.break_minutes}min`}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-700 tabular-nums">
                  {formatHours(shift.total_hours)}h
                </p>
              </div>
            ))}
          </div>
          {shifts.length > 5 && (
            <button
              onClick={() => navigate('/history')}
              className="w-full text-center text-sm text-gold font-medium mt-3 pt-2 hover:text-gold/80 transition-colors"
            >
              Ver todos los registros
            </button>
          )}
        </div>
      )}
    </div>
  )
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
