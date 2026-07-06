import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatHours, startOfWeek } from '../../lib/calculations'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import LoadingSpinner from '../ui/LoadingSpinner'
import EmptyState from '../ui/EmptyState'

const VIEWS = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
}

export default function Statistics() {
  const { user } = useAuth()
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState(VIEWS.WEEKLY)

  useEffect(() => {
    loadShifts()
  }, [user])

  const loadShifts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('work_shifts')
        .select('*')
        .eq('user_id', user.id)
        .order('work_date', { ascending: true })

      if (error) throw error
      setShifts(data || [])
    } catch {
      setShifts([])
    } finally {
      setLoading(false)
    }
  }

  const { chartData, stats } = useMemo(() => {
    if (shifts.length === 0) return { chartData: [], stats: null }

    if (view === VIEWS.WEEKLY) {
      return processWeekly(shifts)
    } else {
      return processMonthly(shifts)
    }
  }, [shifts, view])

  if (loading) return <LoadingSpinner text="Cargando estadísticas..." />

  if (shifts.length === 0) {
    return (
      <div className="animate-fade-in">
        <h2 className="text-lg font-semibold text-slate-700 mb-1">Estadísticas</h2>
        <p className="text-sm text-slate-400 mb-6">Visualiza tus horas trabajadas</p>
        <EmptyState
          icon={
            <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          title="No hay datos suficientes"
          description="Registra algunas jornadas para ver tus estadísticas."
        />
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold text-slate-700">Estadísticas</h2>
        <p className="text-sm text-slate-400 mt-1">Visualiza tus horas trabajadas</p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="card">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Promedio</p>
            <p className="text-xl font-bold text-slate-800 mt-1 tabular-nums">{formatHours(stats.average)}</p>
            <p className="text-xs text-slate-400 mt-0.5">por período</p>
          </div>
          <div className="card bg-gradient-to-br from-gold/5 to-brand-50 border-gold/20">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Mejor período</p>
            <p className="text-xl font-bold text-gold mt-1 tabular-nums">{formatHours(stats.bestValue)}</p>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{stats.bestLabel}</p>
          </div>
        </div>
      )}

      {/* View toggle */}
      <div className="flex gap-2">
        {[
          { key: VIEWS.WEEKLY, label: 'Por semana' },
          { key: VIEWS.MONTHLY, label: 'Por mes' },
        ].map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 ${
              view === v.key
                ? 'bg-gold/10 text-gold shadow-inner-glow'
                : 'bg-white/60 text-slate-500 hover:bg-white/80'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card-premium">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={{ stroke: '#f0ede8' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}h`}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  padding: '8px 12px',
                }}
                formatter={(value) => [formatHours(value), 'Horas']}
                labelStyle={{ color: '#475569', fontWeight: 600, fontSize: 12 }}
              />
              <Bar
                dataKey="hours"
                fill="#d4a843"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Total hours */}
      <div className="card bg-gradient-to-r from-gold/5 to-brand-50 border-gold/20">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Total registrado</span>
          <span className="text-lg font-bold text-gold tabular-nums">
            {formatHours(shifts.reduce((a, s) => a + Number(s.total_hours), 0))}h
          </span>
        </div>
      </div>
    </div>
  )
}

function processWeekly(shifts) {
  const weekMap = new Map()

  shifts.forEach((s) => {
    const weekStart = startOfWeek(new Date(s.work_date + 'T12:00:00'))
    const key = weekStart.toISOString().split('T')[0]
    const existing = weekMap.get(key) || { hours: 0, count: 0 }
    existing.hours += Number(s.total_hours)
    existing.count++
    weekMap.set(key, existing)
  })

  const sorted = Array.from(weekMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  const last5 = sorted.slice(-8)

  const chartData = last5.map(([key, val]) => ({
    label: formatShortWeek(key),
    hours: Math.round(val.hours * 100) / 100,
  }))

  const values = sorted.map(([, v]) => v.hours)
  const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
  const bestIndex = values.indexOf(Math.max(...values))
  const bestValue = values[bestIndex] || 0
  const bestLabel = sorted[bestIndex] ? formatWeekLabel(sorted[bestIndex][0]) : ''

  return {
    chartData,
    stats: { average, bestValue, bestLabel },
  }
}

function processMonthly(shifts) {
  const monthMap = new Map()

  shifts.forEach((s) => {
    const d = new Date(s.work_date + 'T12:00:00')
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const existing = monthMap.get(key) || { hours: 0, count: 0 }
    existing.hours += Number(s.total_hours)
    existing.count++
    monthMap.set(key, existing)
  })

  const sorted = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  const last5 = sorted.slice(-12)

  const chartData = last5.map(([key, val]) => ({
    label: formatShortMonth(key),
    hours: Math.round(val.hours * 100) / 100,
  }))

  const values = sorted.map(([, v]) => v.hours)
  const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
  const bestIndex = values.indexOf(Math.max(...values))
  const bestValue = values[bestIndex] || 0
  const bestLabel = sorted[bestIndex] ? formatMonthLabel(sorted[bestIndex][0]) : ''

  return {
    chartData,
    stats: { average, bestValue, bestLabel },
  }
}

function formatShortWeek(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function formatWeekLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const end = new Date(d)
  end.setDate(d.getDate() + 6)
  return `${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
}

function formatShortMonth(key) {
  const [y, m] = key.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('es-ES', { month: 'short' })
}

function formatMonthLabel(key) {
  const [y, m] = key.split('-')
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  return `${months[Number(m) - 1]} ${y}`
}
