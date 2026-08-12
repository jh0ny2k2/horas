import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatHours, getWeekRange, getMonthRange, startOfWeek } from '../../lib/calculations'
import SummaryCard from '../dashboard/SummaryCard'
import LoadingSpinner from '../ui/LoadingSpinner'
import ShiftStatusBadge from '../shifts/ShiftStatusBadge'
import ReviewShiftModal from '../shifts/ReviewShiftModal'
import { useNavigate, useParams } from 'react-router-dom'

const tabs = [
  { id: 'summary', label: 'Resumen' },
  { id: 'history', label: 'Historial' },
  { id: 'stats', label: 'Estadísticas' },
  { id: 'pending', label: 'Pendientes' },
]

export default function EmployeeDetail() {
  const { company } = useAuth()
  const navigate = useNavigate()
  const { employeeId } = useParams()
  const [activeTab, setActiveTab] = useState('summary')
  const [employee, setEmployee] = useState(null)
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [historyFilter, setHistoryFilter] = useState('all')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [statsMode, setStatsMode] = useState('weekly')
  const [reviewTarget, setReviewTarget] = useState(null)

  useEffect(() => { loadData() }, [employeeId])

  const loadData = async () => {
    if (!employeeId) return
    try {
      setLoading(true)
      const { data: memberData } = await supabase
        .from('company_members').select('*')
        .eq('user_id', employeeId).eq('company_id', company?.id).single()
      setEmployee(memberData)

      const { data: shiftsData } = await supabase
        .from('work_shifts').select('*')
        .eq('user_id', employeeId)
        .order('work_date', { ascending: false })
        .order('start_time', { ascending: false })
      setShifts(shiftsData || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (shiftId) => {
    const { error } = await supabase
      .from('work_shifts')
      .update({ approved: true, rejected: false, review_comment: null })
      .eq('id', shiftId)
    if (!error) setShifts(prev => prev.map(s => s.id === shiftId ? { ...s, approved: true, rejected: false, review_comment: null } : s))
  }

  const handleReview = async (comment) => {
    const target = reviewTarget
    if (!target) return
    const { error } = await supabase
      .from('work_shifts')
      .update({
        approved: false,
        rejected: target.mode === 'reject',
        review_comment: comment || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', target.shift.id)
    if (error) throw error
    setShifts(prev => prev.map(s => s.id === target.shift.id ? {
      ...s,
      approved: false,
      rejected: target.mode === 'reject',
      review_comment: comment || null,
    } : s))
  }

  const handleApproveAll = async () => {
    const pending = shifts.filter(s => !s.approved && !s.rejected)
    for (const s of pending) {
      await supabase.from('work_shifts').update({ approved: true, rejected: false }).eq('id', s.id)
    }
    setShifts(prev => prev.map(s => (s.approved ? s : { ...s, approved: true, rejected: false })))
  }

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const { start: weekStart, end: weekEnd } = getWeekRange(today)
  const { start: monthStart, end: monthEnd } = getMonthRange(today)

  const approvedShifts = useMemo(() => shifts.filter(s => s.approved), [shifts])
  const pendingShifts = useMemo(() => shifts.filter(s => !s.approved && !s.rejected), [shifts])

  const todayHours = approvedShifts.filter(s => s.work_date === todayStr).reduce((a, s) => a + Number(s.total_hours), 0)
  const weekHours = approvedShifts.filter(s => { const d = new Date(s.work_date); return d >= weekStart && d <= weekEnd }).reduce((a, s) => a + Number(s.total_hours), 0)
  const monthHours = approvedShifts.filter(s => { const d = new Date(s.work_date); return d >= monthStart && d <= monthEnd }).reduce((a, s) => a + Number(s.total_hours), 0)
  const totalHours = approvedShifts.reduce((a, s) => a + Number(s.total_hours), 0)
  const totalCost = totalHours * Number(employee?.hourly_rate || 0)

  const filteredHistory = useMemo(() => {
    if (historyFilter === 'week') return shifts.filter(s => { const d = new Date(s.work_date); return d >= weekStart && d <= weekEnd })
    if (historyFilter === 'month') return shifts.filter(s => { const d = new Date(s.work_date); return d >= monthStart && d <= monthEnd })
    if (historyFilter === 'range' && dateRange.from && dateRange.to) {
      return shifts.filter(s => s.work_date >= dateRange.from && s.work_date <= dateRange.to)
    }
    return shifts
  }, [shifts, historyFilter, dateRange, weekStart, weekEnd, monthStart, monthEnd])

  const statsData = useMemo(() => {
    if (statsMode === 'weekly') {
      const weeks = {}
      approvedShifts.forEach(s => {
        const ws = startOfWeek(new Date(s.work_date)).toISOString().split('T')[0]
        weeks[ws] = (weeks[ws] || 0) + Number(s.total_hours)
      })
      return Object.entries(weeks).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 8).reverse()
    } else {
      const months = {}
      approvedShifts.forEach(s => {
        const key = s.work_date.slice(0, 7)
        months[key] = (months[key] || 0) + Number(s.total_hours)
      })
      return Object.entries(months).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12).reverse()
    }
  }, [approvedShifts, statsMode])

  const avgPerPeriod = statsData.length > 0 ? statsData.reduce((a, [, h]) => a + h, 0) / statsData.length : 0
  const bestPeriod = statsData.length > 0 ? statsData.reduce((best, [k, h]) => h > best[1] ? [k, h] : best, ['', 0]) : null

  if (loading) return <LoadingSpinner text="Cargando empleado..." />
  if (!employee) return <div className="text-center py-12 text-slate-400 dark:text-slate-500">Empleado no encontrado</div>

  return (
    <div className="space-y-4 animate-fade-in">
      <button onClick={() => navigate('/')} className="btn-ghost flex items-center gap-1 text-sm">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Volver
      </button>

      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/25">
            <span className="text-xl font-bold text-white">{(employee.email || '?')[0].toUpperCase()}</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">{employee.email?.split('@')[0]}</h2>
            <p className="text-sm text-slate-400 dark:text-slate-500">{employee.email}</p>
            <p className="text-sm text-brand-600 dark:text-brand-400 font-semibold">€{Number(employee.hourly_rate || 0).toFixed(2)}/hora</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-2xl p-1 border border-slate-200/60 dark:border-slate-800 shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-all duration-200 relative ${
              activeTab === tab.id
                ? 'bg-gradient-to-br from-brand-600 to-accent-600 text-white shadow-md shadow-brand-600/25'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
            {tab.id === 'pending' && pendingShifts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {pendingShifts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'summary' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger">
            <SummaryCard label="Hoy" value={formatHours(todayHours)} subtitle="aprobadas" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" color="brand" />
            <SummaryCard label="Semana" value={formatHours(weekHours)} subtitle="aprobadas" icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" color="blue" />
            <SummaryCard label="Mes" value={formatHours(monthHours)} subtitle="aprobadas" icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" color="green" />
            <SummaryCard label="Costo total" value={`€${totalCost.toFixed(2)}`} subtitle={`${formatHours(totalHours)} aprobadas`} icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" color="purple" />
          </div>

          {approvedShifts.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">Últimos registros aprobados</h3>
              <div className="space-y-2">
                {approvedShifts.slice(0, 5).map(shift => (
                  <div key={shift.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{formatDate(shift.work_date)}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}{shift.break_minutes > 0 && ` · ${shift.break_minutes}min`}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums">{formatHours(shift.total_hours)}h</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {[
              { id: 'all', label: 'Todo' },
              { id: 'week', label: 'Semana' },
              { id: 'month', label: 'Mes' },
              { id: 'range', label: 'Rango' },
            ].map(f => (
              <button key={f.id} onClick={() => setHistoryFilter(f.id)}
                className={`chip ${historyFilter === f.id ? 'chip-active' : ''}`}>
                {f.label}
              </button>
            ))}
          </div>

          {historyFilter === 'range' && (
            <div className="flex gap-2">
              <input type="date" value={dateRange.from} onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))} className="input-field text-sm flex-1" />
              <input type="date" value={dateRange.to} onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))} className="input-field text-sm flex-1" />
            </div>
          )}

          <div className="card">
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">{filteredHistory.length} registros · {formatHours(filteredHistory.reduce((a, s) => a + Number(s.total_hours), 0))} totales</p>
            {filteredHistory.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">Sin registros para este filtro</p>
            ) : (
              <div className="space-y-2">
                {filteredHistory.map(shift => (
                  <div key={shift.id} className="py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <ShiftStatusBadge shift={shift} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{formatDate(shift.work_date)}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">{shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}{shift.break_minutes > 0 && ` · ${shift.break_minutes}min`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums mr-1">{formatHours(shift.total_hours)}h</span>
                        {!shift.approved && (
                          <button onClick={() => handleApprove(shift.id)} className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors" title="Aprobar">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          </button>
                        )}
                        {shift.approved ? (
                          <button onClick={() => setReviewTarget({ shift, mode: 'return' })} className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors" title="Devolver a pendiente">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                          </button>
                        ) : !shift.rejected ? (
                          <button onClick={() => setReviewTarget({ shift, mode: 'reject' })} className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors" title="Rechazar">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {shift.review_comment && (
                      <p className={`text-xs mt-1.5 italic rounded-xl px-3 py-2 ${shift.rejected
                        ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300'
                        : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}>
                        "{shift.review_comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            <button onClick={() => setStatsMode('weekly')} className={`chip ${statsMode === 'weekly' ? 'chip-active' : ''}`}>Por semana</button>
            <button onClick={() => setStatsMode('monthly')} className={`chip ${statsMode === 'monthly' ? 'chip-active' : ''}`}>Por mes</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SummaryCard label="Promedio" value={formatHours(avgPerPeriod)} subtitle={`por ${statsMode === 'weekly' ? 'semana' : 'mes'}`} icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" color="blue" />
            <SummaryCard label="Mejor período" value={bestPeriod ? formatHours(bestPeriod[1]) : '0:00'} subtitle={bestPeriod ? formatDateShort(bestPeriod[0]) : 'Sin datos'} icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" color="green" />
          </div>

          {statsData.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">Horas por {statsMode === 'weekly' ? 'semana' : 'mes'}</h3>
              <div className="space-y-2">
                {statsData.map(([period, hours], i) => {
                  const maxHours = Math.max(...statsData.map(([, h]) => h))
                  const pct = maxHours > 0 ? (hours / maxHours) * 100 : 0
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500 dark:text-slate-400">{statsMode === 'weekly' ? `Sem ${period.slice(5)}` : formatMonth(period)}</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{formatHours(hours)}</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="space-y-4 animate-fade-in">
          {pendingShifts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-slate-500 dark:text-slate-300 font-medium">Todo aprobado</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">No hay horas pendientes de este empleado</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-amber-700 dark:text-amber-300 font-semibold">{pendingShifts.length} turno{pendingShifts.length > 1 ? 's' : ''} pendiente{pendingShifts.length > 1 ? 's' : ''}</p>
                <button onClick={handleApproveAll} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Aprobar todo
                </button>
              </div>

              <div className="space-y-3">
                {pendingShifts.map(shift => (
                  <div key={shift.id} className="card border-amber-200 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/5">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatDate(shift.work_date)}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}{shift.break_minutes > 0 && ` · ${shift.break_minutes}min descanso`}</p>
                      </div>
                      <span className="text-lg font-extrabold text-slate-700 dark:text-white tabular-nums">{formatHours(shift.total_hours)}h</span>
                    </div>
                    {shift.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 italic">"{shift.notes}"</p>}
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(shift.id)} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-1 active:scale-[0.98]">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Aprobar
                      </button>
                      <button onClick={() => setReviewTarget({ shift, mode: 'reject' })} className="flex-1 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm font-semibold py-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all flex items-center justify-center gap-1 active:scale-[0.98]">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <ReviewShiftModal
        shift={reviewTarget?.shift}
        mode={reviewTarget?.mode}
        onClose={() => setReviewTarget(null)}
        onSubmit={handleReview}
      />
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

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function formatMonth(ym) {
  const [y, m] = ym.split('-')
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${months[Number(m) - 1]} ${y.slice(2)}`
}
