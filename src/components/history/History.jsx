import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { getWeekRange, getMonthRange } from '../../lib/calculations'
import ShiftCard from '../shifts/ShiftCard'
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
  const { user } = useAuth()
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState(FILTERS.ALL)
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [editingShift, setEditingShift] = useState(null)
  const [viewingShift, setViewingShift] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

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
      setError('Error al cargar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredShifts = useMemo(() => {
    let result = [...shifts]

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
  }, [shifts, filter, dateRange])

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

  if (loading) return <LoadingSpinner text="Cargando historial..." />

  const totalDisplay = filteredShifts.reduce((acc, s) => acc + Number(s.total_hours), 0)

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold text-slate-700">Historial</h2>
        <p className="text-sm text-slate-400 mt-1">
          {shifts.length} registro{shifts.length !== 1 ? 's' : ''} en total
        </p>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {[
          { key: FILTERS.ALL, label: 'Todo' },
          { key: FILTERS.WEEK, label: 'Esta semana' },
          { key: FILTERS.MONTH, label: 'Este mes' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setDateRange({ from: '', to: '' }) }}
            className={`px-4 py-2 rounded-2xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              filter === f.key
                ? 'bg-gold/10 text-gold shadow-inner-glow'
                : 'bg-white/60 text-slate-500 hover:bg-white/80'
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={() => setFilter(dateRange.from ? FILTERS.ALL : 'range')}
          className={`px-4 py-2 rounded-2xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
            dateRange.from
              ? 'bg-gold/10 text-gold shadow-inner-glow'
              : 'bg-white/60 text-slate-500 hover:bg-white/80'
          }`}
        >
          Rango
        </button>
      </div>

      {/* Date range picker */}
      {(filter === 'range' || dateRange.from) && (
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            className="input-field text-sm flex-1"
          />
          <span className="text-slate-300">-</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            className="input-field text-sm flex-1"
          />
        </div>
      )}

      {/* Summary */}
      {filteredShifts.length > 0 && (
        <div className="card bg-gradient-to-r from-gold/5 to-brand-50 border-gold/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">
              {filteredShifts.length} registro{filteredShifts.length !== 1 ? 's' : ''}
            </span>
            <span className="text-lg font-bold text-gold tabular-nums">
              {totalDisplay.toFixed(2)}h totales
            </span>
          </div>
        </div>
      )}

      {/* Shift list */}
      {filteredShifts.length > 0 ? (
        <div className="space-y-2.5">
          {filteredShifts.map((shift) => (
            <ShiftCard
              key={shift.id}
              shift={shift}
              onView={setViewingShift}
              onEdit={handleEdit}
              onDelete={setDeleteConfirm}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={
            <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          title="Sin registros"
          description={filter !== FILTERS.ALL ? 'No hay registros en este período.' : 'Aún no has registrado ninguna jornada.'}
        />
      )}

      {/* Detail modal */}
      <ShiftDetailModal shift={viewingShift} onClose={() => setViewingShift(null)} />

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-premium-lg animate-slide-up">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Eliminar registro</h3>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500 mb-1">
                  ¿Eliminar registro del <strong className="text-slate-700">{deleteConfirm.work_date}</strong>?
                </p>
                <p className="text-xs text-slate-400">Esta acción no se puede deshacer.</p>
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
                className="btn-primary flex-1 !bg-gradient-to-r !from-red-400 !to-red-500 !shadow-red-200/30"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
