import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatHours, startOfWeek } from '../../lib/calculations'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import LoadingSpinner from '../ui/LoadingSpinner'
import EmptyState from '../ui/EmptyState'
import SummaryCard from '../dashboard/SummaryCard'

const VIEW_OPTIONS = [
  { key: 'daily', label: 'Diario' },
  { key: 'weekly', label: 'Semanal' },
  { key: 'monthly', label: 'Mensual' },
  { key: 'custom', label: 'Rango' },
]

const QUICK_RANGES = [
  { key: '7d', label: '7 días', days: 7 },
  { key: '30d', label: '30 días', days: 30 },
  { key: '90d', label: '90 días', days: 90 },
  { key: 'year', label: 'Este año', days: 365 },
]

export default function Statistics() {
  const { user, profile } = useAuth()
  const hourlyRate = Number(profile?.hourly_rate || 0)
  const isIndividual = profile?.role === 'individual'
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

  const { chartData, stats } = useMemo(() => {
    if (filteredShifts.length === 0) return { chartData: [], stats: null }

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

  const periodLabel = view === 'daily' ? 'día' : view === 'weekly' ? 'semana' : view === 'monthly' ? 'mes' : 'período'
  const totalCount = filteredShifts.length

  const periodEarned = hourlyRate > 0 ? stats?.totalHours * hourlyRate : 0
  const totalEarned = hourlyRate > 0 ? shifts.reduce((acc, s) => acc + Number(s.total_hours), 0) * hourlyRate : 0

  const chartTitle = view === 'daily'
    ? 'Horas por día'
    : view === 'weekly'
      ? 'Horas por semana'
      : view === 'monthly'
        ? 'Horas por mes'
        : 'Horas en período'

  if (loading) return <LoadingSpinner text="Cargando estadísticas..." />

  if (shifts.length === 0) {
    return (
      <div className="animate-fade-in">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Estadísticas</h2>
        <p className="text-sm text-slate-400 dark:text-slate-500 mb-6">Visualiza tus horas trabajadas</p>
        <EmptyState
          icon={
            <svg className="w-7 h-7 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Estadísticas</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500">Visualiza tus horas trabajadas</p>
      </div>

      {/* View selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {VIEW_OPTIONS.map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`chip ${view === v.key ? 'chip-active' : ''}`}
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
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {QUICK_RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => { setQuickRange(r.key); setShowAll(false) }}
              className={`chip ${!showAll && quickRange === r.key ? 'chip-active' : ''}`}
            >
              {r.label}
            </button>
          ))}
          <button
            onClick={() => { setShowAll(true) }}
            className={`chip ${showAll ? 'chip-active' : ''}`}
          >
            Todo
          </button>
        </div>
      )}

      {stats ? (
        <>
          {/* Hero */}
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-600 to-accent-600 p-6 shadow-xl shadow-brand-600/30 animate-fade-in">
            <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-8 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />

            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">Horas registradas</p>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/15 text-white whitespace-nowrap">
                  {stats.totalDays} {stats.totalDays === 1 ? 'día' : 'días'}
                </span>
              </div>
              <p className="text-4xl font-extrabold text-white mt-2 tabular-nums">
                {formatHours(stats.totalHours)}
                <span className="text-lg font-bold text-white/60 ml-1">h</span>
              </p>
              <p className="text-[11px] text-white/60 mt-1">
                {totalCount} {totalCount === 1 ? 'turno' : 'turnos'} en el período
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-white/15">
                <div>
                  <p className="text-[10px] text-white/60 uppercase tracking-wider">Promedio</p>
                  <p className="text-white font-bold tabular-nums">
                    {formatHours(stats.average)} <span className="text-xs text-white/60 font-medium">/ {periodLabel}</span>
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-white/60 uppercase tracking-wider">Mejor</p>
                  <p className="text-white font-bold tabular-nums truncate">
                    {formatHours(stats.bestValue)} <span className="text-xs text-white/60 font-medium">({stats.bestLabel})</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="card-premium">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{chartTitle}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Media {formatHours(stats.average)}/{periodLabel}</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: 'var(--chart-tick)' }}
                    axisLine={{ stroke: 'var(--chart-grid)' }}
                    tickLine={false}
                    interval={Math.floor(chartData.length / 8)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--chart-tick)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}h`}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                    contentStyle={{
                      background: 'var(--chart-tooltip-bg)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      padding: '8px 12px',
                      color: 'inherit',
                    }}
                    formatter={(value) => [formatHours(value), 'Horas']}
                    labelStyle={{ color: '#6366f1', fontWeight: 600, fontSize: 12 }}
                  />
                  <Bar
                    dataKey="hours"
                    fill="var(--chart-bar)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 stagger">
            <SummaryCard
              label="Promedio"
              value={formatHours(stats.average)}
              subtitle={`por ${periodLabel}`}
              icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              color="blue"
            />
            <SummaryCard
              label="Mejor período"
              value={formatHours(stats.bestValue)}
              subtitle={stats.bestLabel}
              icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              color="brand"
            />
            {!isIndividual && (
              <>
                <SummaryCard
                  label="Ganado en el período"
                  value={`€${periodEarned.toFixed(2)}`}
                  subtitle={hourlyRate > 0 ? `${formatHours(stats.totalHours)} a ${hourlyRate.toFixed(2)}€/h` : 'Configura tu tarifa en Ajustes'}
                  icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  color="green"
                />
                <SummaryCard
                  label="Total acumulado"
                  value={`€${totalEarned.toFixed(2)}`}
                  subtitle={`${formatHours(shifts.reduce((acc, s) => acc + Number(s.total_hours), 0))} en total`}
                  icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  color="purple"
                />
              </>
            )}
          </div>
        </>
      ) : (
        <div className="card flex flex-col items-center text-center py-8 animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Sin datos en este período</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Ajusta el rango seleccionado</p>
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
