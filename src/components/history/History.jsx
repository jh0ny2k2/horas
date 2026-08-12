import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { getWeekRange, getMonthRange, formatHours } from '../../lib/calculations'
import useCompanyData from '../../hooks/useCompanyData'
import ShiftDetailModal from '../shifts/ShiftDetailModal'
import WorkShiftForm from '../shifts/WorkShiftForm'
import LoadingSpinner from '../ui/LoadingSpinner'
import EmptyState from '../ui/EmptyState'
import ErrorMessage from '../ui/ErrorMessage'

const FILTERS = {
  ALL: 'all',
  WEEK: 'week',
  MONTH: 'month',
}

export default function History() {
  const { user, profile, company } = useAuth()
  const isCompany = profile?.role === 'company_owner' && !!company
  const companyData = useCompanyData(isCompany ? company : null)
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState(FILTERS.ALL)
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [editingShift, setEditingShift] = useState(null)
  const [viewingShift, setViewingShift] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [employeeFilter, setEmployeeFilter] = useState('all')

  useEffect(() => {
    if (isCompany) return
    loadShifts()
  }, [user, isCompany])

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
      setError('Error al cargar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const allShifts = isCompany ? companyData.shifts : shifts
  const employees = companyData.employees

  const employeeById = useMemo(() => {
    return Object.fromEntries((employees || []).map(e => [e.user_id, e]))
  }, [employees])

  const employeeName = (userId) => {
    const emp = employeeById[userId]
    return emp?.email?.split('@')[0] || 'Empleado'
  }

  const handleApprove = async (shiftId) => {
    const { error } = await supabase.from('work_shifts').update({ approved: true }).eq('id', shiftId)
    if (!error) companyData.reload()
  }

  const handleReject = async (shiftId) => {
    const { error } = await supabase.from('work_shifts').update({ approved: false }).eq('id', shiftId)
    if (!error) companyData.reload()
  }

  const filteredShifts = useMemo(() => {
    let result = [...allShifts]

    if (isCompany && employeeFilter !== 'all') {
      result = result.filter(s => s.user_id === employeeFilter)
    }

    if (filter === FILTERS.WEEK) {
      const { start, end } = getWeekRange()
      result = result.filter(s => {
        const d = new Date(s.work_date + 'T12:00:00')
        return d >= start && d <= end
      })
    } else if (filter === FILTERS.MONTH) {
      const { start, end } = getMonthRange()
      result = result.filter(s => {
        const d = new Date(s.work_date + 'T12:00:00')
        return d >= start && d <= end
      })
    } else if (dateRange.from && dateRange.to) {
      result = result.filter(s => s.work_date >= dateRange.from && s.work_date <= dateRange.to)
    }

    return result
  }, [allShifts, isCompany, employeeFilter, filter, dateRange])

  const groupedShifts = useMemo(() => {
    const groups = {}
    filteredShifts.forEach(s => {
      if (!groups[s.work_date]) groups[s.work_date] = []
      groups[s.work_date].push(s)
    })
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filteredShifts])

  const totalHours = filteredShifts.reduce((a, s) => a + Number(s.total_hours), 0)
  const totalDays = groupedShifts.length
  const avgPerDay = totalDays > 0 ? totalHours / totalDays : 0
  const approvedCount = filteredShifts.filter(s => s.approved).length
  const pendingCount = filteredShifts.length - approvedCount

  const periodLabel = filter === FILTERS.WEEK
    ? 'Esta semana'
    : filter === FILTERS.MONTH
      ? 'Este mes'
      : dateRange.from
        ? 'Período seleccionado'
        : 'Todos los registros'

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      setError('')
      const { error } = await supabase
        .from('work_shifts')
        .delete()
        .eq('id', deleteConfirm.id)

      if (error) throw error
      setDeleteConfirm(null)
      loadShifts()
    } catch (err) {
      setError('Error al eliminar: ' + err.message)
      setDeleteConfirm(null)
    }
  }

  const handleEdit = (shift) => {
    setViewingShift(null)
    setEditingShift(shift)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSaved = () => {
    setEditingShift(null)
    loadShifts()
  }

  if (editingShift) {
    return (
      <WorkShiftForm
        editShift={editingShift}
        onSaved={handleSaved}
      />
    )
  }

  if (isCompany ? companyData.loading : loading) {
    return <LoadingSpinner text={isCompany ? 'Cargando turnos de la empresa...' : 'Cargando historial...'} />
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">
          {isCompany ? 'Turnos de la empresa' : 'Historial'}
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {allShifts.length} registro{allShifts.length !== 1 ? 's' : ''} en total
        </p>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {[
          { key: FILTERS.ALL, label: 'Todo' },
          { key: FILTERS.WEEK, label: 'Semana' },
          { key: FILTERS.MONTH, label: 'Mes' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setDateRange({ from: '', to: '' }) }}
            className={`chip ${filter === f.key ? 'chip-active' : ''}`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={() => setFilter(dateRange.from ? FILTERS.ALL : 'range')}
          className={`chip ${dateRange.from ? 'chip-active' : ''}`}
        >
          Rango
        </button>
      </div>

      {/* Employee filter (company) */}
      {isCompany && employees.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          <button
            onClick={() => setEmployeeFilter('all')}
            className={`chip ${employeeFilter === 'all' ? 'chip-active' : ''}`}
          >
            Todos
          </button>
          {employees.map(e => (
            <button
              key={e.id}
              onClick={() => setEmployeeFilter(e.user_id)}
              className={`chip ${employeeFilter === e.user_id ? 'chip-active' : ''}`}
            >
              {e.email?.split('@')[0] || 'Empleado'}
            </button>
          ))}
        </div>
      )}

      {/* Date range picker */}
      {(filter === 'range' || dateRange.from) && (
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            className="input-field text-sm flex-1"
          />
          <span className="text-slate-300 dark:text-slate-600">-</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            className="input-field text-sm flex-1"
          />
        </div>
      )}

      {/* Hero summary */}
      {filteredShifts.length > 0 && (
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-600 to-accent-600 p-6 shadow-xl shadow-brand-600/30">
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-8 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">{periodLabel}</p>
                <p className="text-4xl font-extrabold text-white mt-1 tabular-nums">
                  {formatHours(totalHours)}
                  <span className="text-lg font-bold text-white/60 ml-1">h</span>
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-white/15 text-white text-xs font-semibold whitespace-nowrap">
                {totalDays} día{totalDays !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] text-white/60 uppercase tracking-wider">Promedio/día</p>
                <p className="text-white font-bold tabular-nums">{formatHours(avgPerDay)}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/60 uppercase tracking-wider">Aprobadas</p>
                <p className="text-emerald-200 font-bold tabular-nums">{approvedCount}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/60 uppercase tracking-wider">Pendientes</p>
                <p className="text-amber-200 font-bold tabular-nums">{pendingCount}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grouped list by day */}
      {filteredShifts.length > 0 ? (
        <div>
          {groupedShifts.map(([date, dayShifts]) => {
            const dayTotal = dayShifts.reduce((a, s) => a + Number(s.total_hours), 0)
            const dayPending = dayShifts.filter(s => !s.approved).length
            return (
              <div key={date}>
                <div className="flex items-center justify-between px-1 pt-4 pb-1.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{dayHeader(date)}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{dateSubtitle(date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {dayPending > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title={`${dayPending} pendiente(s)`} />
                    )}
                    <span className="text-sm font-bold text-brand-600 dark:text-brand-400 tabular-nums">
                      {formatHours(dayTotal)}
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 ml-0.5">h</span>
                    </span>
                  </div>
                </div>

                <div className="card px-4 py-1 divide-y divide-slate-100 dark:divide-slate-800">
                  {dayShifts.map((shift) => (
                    <div
                      key={shift.id}
                      onClick={() => setViewingShift(shift)}
                      className="w-full flex items-center gap-3 py-3 text-left group cursor-pointer"
                    >
                      {isCompany && (
                        <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
                          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-[9px] font-bold text-white">
                              {(employeeById[shift.user_id]?.email || 'E')[0].toUpperCase()}
                            </span>
                          </span>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate max-w-[80px]">
                            {employeeName(shift.user_id)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                          {shift.start_time.slice(0, 5)}
                        </span>
                        <svg className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                          {shift.end_time.slice(0, 5)}
                        </span>
                        {shift.break_minutes > 0 && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1 whitespace-nowrap">
                            {shift.break_minutes}min
                          </span>
                        )}
                      </div>

                      <div className="flex-1" />

                      {isCompany ? (
                        shift.approved ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleReject(shift.id) }}
                            className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                            title="Desaprobar"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleApprove(shift.id) }}
                            className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                            title="Aprobar"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )
                      ) : (
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          shift.approved
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${shift.approved ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {shift.approved ? 'Aprobado' : 'Pendiente'}
                        </span>
                      )}

                      <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                        {formatHours(shift.total_hours)}
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 ml-0.5">h</span>
                      </span>

                      {!isCompany && (
                        <svg className="w-4 h-4 text-slate-300 dark:text-slate-600 transition-transform group-active:translate-x-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={
            <svg className="w-7 h-7 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          title="Sin registros"
          description={isCompany
            ? 'No hay turnos registrados todavía.'
            : filter !== FILTERS.ALL ? 'No hay registros en este período.' : 'Aún no has registrado ninguna jornada.'}
        />
      )}

      {/* Detail modal */}
      <ShiftDetailModal
        shift={viewingShift}
        onClose={() => setViewingShift(null)}
        onEdit={isCompany ? null : handleEdit}
        onDelete={isCompany ? null : (s) => { setViewingShift(null); setDeleteConfirm(s) }}
      />

      {/* Delete confirmation modal */}
      {deleteConfirm && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-premium-lg animate-scale-in border border-slate-200/60 dark:border-slate-800">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Eliminar registro</h3>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                  ¿Eliminar registro del <strong className="text-slate-700 dark:text-slate-200">{deleteConfirm.work_date}</strong>?
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="btn-primary flex-1 !bg-gradient-to-r !from-rose-500 !to-red-500 !shadow-rose-500/25"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

function dayHeader(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Hoy'
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer'
  return capitalize(d.toLocaleDateString('es-ES', { weekday: 'long' }))
}

function dateSubtitle(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
