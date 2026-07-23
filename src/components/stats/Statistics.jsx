import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatHours, startOfWeek } from '../../lib/calculations'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import LoadingSpinner from '../ui/LoadingSpinner'
import EmptyState from '../ui/EmptyState'

const VIEW_OPTIONS = [
  { key: 'daily', label: 'Diario' },
  { key: 'weekly', label: 'Semanal' },
  { key: 'monthly', label: 'Mensual' },
  { key: 'custom', label: 'Rango' },
]

const QUICK_RANGES = [
  { key: '7d', label: 'Últimos 7 días', days: 7 },
  { key: '30d', label: 'Últimos 30 días', days: 30 },
  { key: '90d', label: 'Últimos 90 días', days: 90 },
  { key: 'year', label: 'Este año', days: 365 },
]

export default function Statistics() {
  const { user } = useAuth()
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('weekly')
  const [quickRange, setQuickRange] = useState('30d')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showAll, setShowAll] = useState(false)

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

  const filteredShifts = useMemo(() => {
    if (showAll || view === 'custom') {
      if (view === 'custom' && dateFrom && dateTo) {
        return shifts.filter(s => s.work_date >= dateFrom && s.work_date <= dateTo)
      }
      return shifts
    }

    const now = new Date()
    const range = QUICK_RANGES.find(r => r.key === quickRange)
    const daysBack = range?.days || 30
    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() - daysBack)
    const cutoffStr = cutoff.toISOString().split('T')[0]

    return shifts.filter(s => s.work_date >= cutoffStr)
  }, [shifts, view, quickRange, dateFrom, dateTo, showAll])

  const { chartData, stats, chartLabel } = useMemo(() => {
    if (filteredShifts.length === 0) return { chartData: [], stats: null, chartLabel: '' }

    if (view === 'daily') return processDaily(filteredShifts)
    if (view === 'weekly') return processWeekly(filteredShifts)
    if (view === 'monthly') return processMonthly(filteredShifts)

    if (view === 'custom') {
      if (dateFrom && dateTo) {
        const daysDiff = Math.ceil((new Date(dateTo) - new Date(dateFrom)) / (1000 * 60 * 60 * 24))
        if (daysDiff <= 60) return processDaily(filteredShifts)
        if (daysDiff <= 180) return processWeekly(filteredShifts)
        return processMonthly(filteredShifts)
      }
      return processDaily(filteredShifts)
    }

    return processWeekly(filteredShifts)
  }, [filteredShifts, view, dateFrom, dateTo])

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
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold text-slate-700">Estadísticas</h2>
        <p className="text-sm text-slate-400 mt-1">Visualiza tus horas trabajadas</p>
      </div>

      {/* View selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {VIEW_OPTIONS.map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 ${
              view === v.key
                ? 'bg-gold text-white shadow-sm'
                : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Quick ranges or date inputs */}
      {view === 'custom' ? (
        <div className="card">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-[11px]">Desde</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input-field text-xs py-1.5"
              />
            </div>
            <div>
              <label className="label text-[11px]">Hasta</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input-field text-xs py-1.5"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {QUICK_RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => { setQuickRange(r.key); setShowAll(false) }}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all ${
                !showAll && quickRange === r.key
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
          <button
            onClick={() => { setShowAll(true) }}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all ${
              showAll
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            Todo
          </button>
        </div>
      )}

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
          <div className="card">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total días</p>
            <p className="text-xl font-bold text-slate-800 mt-1 tabular-nums">{stats.totalDays}</p>
            <p className="text-xs text-slate-400 mt-0.5">con registros</p>
          </div>
          <div className="card">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total horas</p>
            <p className="text-xl font-bold text-slate-800 mt-1 tabular-nums">{formatHours(stats.totalHours)}</p>
            <p className="text-xs text-slate-400 mt-0.5">registradas</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card-premium">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-slate-500">
              {view === 'daily' ? 'Horas por día' :
               view === 'weekly' ? 'Horas por semana' :
               view === 'monthly' ? 'Horas por mes' : 'Horas en período'}
            </p>
            {stats && (
              <p className="text-xs text-gold font-semibold">
                Media: {formatHours(stats.average)}/período
              </p>
            )}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={{ stroke: '#f0ede8' }}
                tickLine={false}
                interval={Math.floor(chartData.length / 8)}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
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
                radius={[4, 4, 0, 0]}
                maxBarSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Daily breakdown list */}
      {view === 'daily' && filteredShifts.length > 0 && (
        <div className="card">
          <p className="text-xs font-medium text-slate-500 mb-3">Desglose por día</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredShifts.slice().reverse().slice(0, 30).map((shift) => (
              <div key={shift.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {new Date(shift.work_date + 'T12:00:00').toLocaleDateString('es-ES', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short'
                    })}
                  </p>
                  <p className="text-xs text-slate-400">
                    {shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)}
                    {shift.break_minutes > 0 && ` · ${shift.break_minutes}min descanso`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-700">{formatHours(shift.total_hours)}</p>
                  <p className={`text-[10px] font-medium ${shift.approved ? 'text-green-500' : 'text-yellow-500'}`}>
                    {shift.approved ? 'Aprobado' : 'Pendiente'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function processDaily(shifts) {
  const dayMap = new Map()

  shifts.forEach((s) => {
    const existing = dayMap.get(s.work_date) || { hours: 0, count: 0 }
    existing.hours += Number(s.total_hours)
    existing.count++
    dayMap.set(s.work_date, existing)
  })

  const sorted = Array.from(dayMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  const display = sorted.length > 30 ? sorted.slice(-30) : sorted

  const chartData = display.map(([key, val]) => ({
    label: formatDayLabel(key),
    hours: Math.round(val.hours * 100) / 100,
  }))

  const allValues = sorted.map(([, v]) => v.hours)
  const totalHours = allValues.reduce((a, b) => a + b, 0)
  const average = allValues.length > 0 ? totalHours / allValues.length : 0
  const bestIndex = allValues.indexOf(Math.max(...allValues))
  const bestValue = allValues[bestIndex] || 0
  const bestLabel = sorted[bestIndex] ? formatDayLabel(sorted[bestIndex][0]) : ''

  return {
    chartData,
    stats: { average, bestValue, bestLabel, totalDays: allValues.length, totalHours },
  }
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
  const last = sorted.length > 12 ? sorted.slice(-12) : sorted

  const chartData = last.map(([key, val]) => ({
    label: formatShortWeek(key),
    hours: Math.round(val.hours * 100) / 100,
  }))

  const allValues = sorted.map(([, v]) => v.hours)
  const totalHours = allValues.reduce((a, b) => a + b, 0)
  const average = allValues.length > 0 ? totalHours / allValues.length : 0
  const bestIndex = allValues.indexOf(Math.max(...allValues))
  const bestValue = allValues[bestIndex] || 0
  const bestLabel = sorted[bestIndex] ? formatWeekLabel(sorted[bestIndex][0]) : ''

  return {
    chartData,
    stats: { average, bestValue, bestLabel, totalDays: sorted.length, totalHours },
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
  const last = sorted.length > 12 ? sorted.slice(-12) : sorted

  const chartData = last.map(([key, val]) => ({
    label: formatShortMonth(key),
    hours: Math.round(val.hours * 100) / 100,
  }))

  const allValues = sorted.map(([, v]) => v.hours)
  const totalHours = allValues.reduce((a, b) => a + b, 0)
  const average = allValues.length > 0 ? totalHours / allValues.length : 0
  const bestIndex = allValues.indexOf(Math.max(...allValues))
  const bestValue = allValues[bestIndex] || 0
  const bestLabel = sorted[bestIndex] ? formatMonthLabel(sorted[bestIndex][0]) : ''

  return {
    chartData,
    stats: { average, bestValue, bestLabel, totalDays: sorted.length, totalHours },
  }
}

function formatDayLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
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
