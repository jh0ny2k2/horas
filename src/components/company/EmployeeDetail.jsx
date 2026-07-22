import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatHours, getWeekRange, getMonthRange, startOfWeek } from '../../lib/calculations'
import SummaryCard from '../dashboard/SummaryCard'
import LoadingSpinner from '../ui/LoadingSpinner'
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
    const { error } = await supabase.from('work_shifts').update({ approved: true }).eq('id', shiftId)
    if (!error) setShifts(prev => prev.map(s => s.id === shiftId ? { ...s, approved: true } : s))
  }

  const handleReject = async (shiftId) => {
    const { error } = await supabase.from('work_shifts').update({ approved: false }).eq('id', shiftId)
    if (!error) setShifts(prev => prev.map(s => s.id === shiftId ? { ...s, approved: false } : s))
  }

  const handleApproveAll = async () => {
    const pending = shifts.filter(s => !s.approved)
    for (const s of pending) {
      await supabase.from('work_shifts').update({ approved: true }).eq('id', s.id)
    }
    setShifts(prev => prev.map(s => ({ ...s, approved: true })))
  }

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const { start: weekStart, end: weekEnd } = getWeekRange(today)
  const { start: monthStart, end: monthEnd } = getMonthRange(today)

  const approvedShifts = useMemo(() => shifts.filter(s => s.approved), [shifts])
  const pendingShifts = useMemo(() => shifts.filter(s => !s.approved), [shifts])

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
  if (!employee) return <div className="text-center py-12 text-slate-400">Empleado no encontrado</div>

  return (
    <div className="space-y-4 animate-fade-in">
      <button onClick={() => navigate('/')} className="btn-ghost flex items-center gap-1 text-sm text-slate-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Volver
      </button>

      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center">
            <span className="text-xl font-bold text-gold">{(employee.email || '?')[0].toUpperCase()}</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-700">{employee.email?.split('@')[0]}</h2>
            <p className="text-sm text-slate-400">{employee.email}</p>
            <p className="text-sm text-gold font-medium">${Number(employee.hourly_rate || 0).toFixed(2)}/hora</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-white/60 backdrop-blur-sm rounded-2xl p-1 border border-white/60">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-medium transition-all duration-200 relative ${
              activeTab === tab.id
                ? 'bg-white text-gold shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
            {tab.id === 'pending' && pendingShifts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {pendingShifts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'summary' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-3 stagger">
            <SummaryCard label="Hoy" value={formatHours(todayHours)} subtitle="aprobadas" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" color="gold" />
            <SummaryCard label="Semana" value={formatHours(weekHours)} subtitle="aprobadas" icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" color="blue" />
            <SummaryCard label="Mes" value={formatHours(monthHours)} subtitle="aprobadas" icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" color="green" />
            <SummaryCard label="Costo total" value={`$${totalCost.toFixed(2)}`} subtitle={`${formatHours(totalHours)} aprobadas`} icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" color="purple" />
          </div>

          {approvedShifts.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Últimos registros aprobados</h3>
              <div className="space-y-2">
                {approvedShifts.slice(0, 5).map(shift => (
                  <div key={shift.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{formatDate(shift.work_date)}</p>
                        <p className="text-xs text-slate-400">{shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}{shift.break_minutes > 0 && ` · ${shift.break_minutes}min`}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-slate-700 tabular-nums">{formatHours(shift.total_hours)}h</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Todo' },
              { id: 'week', label: 'Semana' },
              { id: 'month', label: 'Mes' },
              { id: 'range', label: 'Rango' },
            ].map(f => (
              <button key={f.id} onClick={() => setHistoryFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${historyFilter === f.id ? 'bg-gold text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
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
            <p className="text-xs text-slate-400 mb-2">{filteredHistory.length} registros · {formatHours(filteredHistory.reduce((a, s) => a + Number(s.total_hours), 0))} totales</p>
            {filteredHistory.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Sin registros para este filtro</p>
            ) : (
              <div className="space-y-2">
                {filteredHistory.map(shift => (
                  <div key={shift.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${shift.approved ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{formatDate(shift.work_date)}</p>
                        <p className="text-xs text-slate-400">{shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}{shift.break_minutes > 0 && ` · ${shift.break_minutes}min`}{!shift.approved && ' · Pendiente'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700 tabular-nums">{formatHours(shift.total_hours)}h</span>
                      {shift.approved ? (
                        <button onClick={() => handleReject(shift.id)} className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-50 transition-colors" title="Desaprobar">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      ) : (
                        <button onClick={() => handleApprove(shift.id)} className="p-1 rounded-lg text-slate-400 hover:text-green-500 hover:bg-green-50 transition-colors" title="Aprobar">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex gap-2">
            <button onClick={() => setStatsMode('weekly')} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${statsMode === 'weekly' ? 'bg-gold text-white' : 'bg-white text-slate-500'}`}>Por semana</button>
            <button onClick={() => setStatsMode('monthly')} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${statsMode === 'monthly' ? 'bg-gold text-white' : 'bg-white text-slate-500'}`}>Por mes</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SummaryCard label="Promedio" value={formatHours(avgPerPeriod)} subtitle={`por ${statsMode === 'weekly' ? 'semana' : 'mes'}`} icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" color="blue" />
            <SummaryCard label="Mejor período" value={bestPeriod ? formatHours(bestPeriod[1]) : '0:00'} subtitle={bestPeriod ? formatDateShort(bestPeriod[0]) : 'Sin datos'} icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" color="green" />
          </div>

          {statsData.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Horas por {statsMode === 'weekly' ? 'semana' : 'mes'}</h3>
              <div className="space-y-2">
                {statsData.map(([period, hours], i) => {
                  const maxHours = Math.max(...statsData.map(([, h]) => h))
                  const pct = maxHours > 0 ? (hours / maxHours) * 100 : 0
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">{statsMode === 'weekly' ? `Sem ${period.slice(5)}` : formatMonth(period)}</span>
                        <span className="font-medium text-slate-700 tabular-nums">{formatHours(hours)}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
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
              <div className="w-16 h-16 rounded-3xl bg-green-50 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-slate-500 font-medium">Todo aprobado</p>
              <p className="text-sm text-slate-400 mt-1">No hay horas pendientes de este empleado</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-yellow-700 font-medium">{pendingShifts.length} turno{pendingShifts.length > 1 ? 's' : ''} pendiente{pendingShifts.length > 1 ? 's' : ''}</p>
                <button onClick={handleApproveAll} className="text-xs font-medium text-green-600 hover:text-green-700 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Aprobar todo
                </button>
              </div>

              <div className="space-y-3">
                {pendingShifts.map(shift => (
                  <div key={shift.id} className="card border-yellow-200 bg-yellow-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{formatDate(shift.work_date)}</p>
                        <p className="text-xs text-slate-400">{shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}{shift.break_minutes > 0 && ` · ${shift.break_minutes}min descanso`}</p>
                      </div>
                      <span className="text-lg font-bold text-slate-700 tabular-nums">{formatHours(shift.total_hours)}h</span>
                    </div>
                    {shift.notes && <p className="text-xs text-slate-500 mb-2 italic">"{shift.notes}"</p>}
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(shift.id)} className="flex-1 bg-green-500 text-white text-sm font-medium py-2 rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Aprobar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
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

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function formatMonth(ym) {
  const [y, m] = ym.split('-')
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${months[Number(m) - 1]} ${y.slice(2)}`
}
