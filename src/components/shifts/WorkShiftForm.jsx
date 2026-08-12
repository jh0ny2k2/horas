import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { calculateTotalHours, formatHours } from '../../lib/calculations'
import ErrorMessage from '../ui/ErrorMessage'
import { useNavigate } from 'react-router-dom'

const BREAK_PRESETS = [0, 15, 30, 60]

export default function WorkShiftForm({ editShift = null, onSaved }) {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const isEditing = !!editShift
  const isIndividual = profile?.role === 'individual'

  const [formData, setFormData] = useState({
    work_date: editShift?.work_date || new Date().toISOString().split('T')[0],
    start_time: editShift?.start_time?.slice(0, 5) || '',
    end_time: editShift?.end_time?.slice(0, 5) || '',
    break_minutes: editShift?.break_minutes || 0,
    notes: editShift?.notes || '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [calculated, setCalculated] = useState(null)

  const handleChange = (field, value) => {
    const updated = { ...formData, [field]: value }
    setFormData(updated)
    setCalculated(null)

    if (updated.start_time && updated.end_time) {
      try {
        const total = calculateTotalHours(updated.start_time, updated.end_time, Number(updated.break_minutes) || 0)
        setCalculated(total)
      } catch {
        setCalculated(null)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const start = formData.start_time
    const end = formData.end_time
    const breakMins = Number(formData.break_minutes) || 0

    if (!start || !end) {
      setError('Debes indicar la hora de inicio y fin')
      return
    }

    if (!formData.work_date) {
      setError('Debes indicar la fecha')
      return
    }

    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)
    if (startH > 23 || startM > 59 || endH > 23 || endM > 59) {
      setError('Las horas deben ser válidas (0-23) y minutos (0-59)')
      return
    }

    const total = calculateTotalHours(start, end, breakMins)
    if (total <= 0) {
      setError('Las horas trabajadas deben ser mayores a cero. Revisa el horario.')
      return
    }

    if (breakMins > 480) {
      setError('El descanso no puede ser mayor a 480 minutos (8 horas)')
      return
    }

    setLoading(true)
    try {
      const shiftData = {
        user_id: user.id,
        work_date: formData.work_date,
        start_time: start,
        end_time: end,
        break_minutes: breakMins,
        notes: formData.notes || '',
        total_hours: total,
        approved: isIndividual,
        rejected: false,
        review_comment: null,
      }

      if (isEditing) {
        const { error: updateError } = await supabase
          .from('work_shifts')
          .update(shiftData)
          .eq('id', editShift.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('work_shifts')
          .insert(shiftData)

        if (insertError) throw insertError
      }

      onSaved?.()
      navigate('/')
    } catch (err) {
      setError('Error al guardar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const dateLabel = formData.work_date
    ? formatDateLabel(formData.work_date)
    : 'Elige una fecha'

  const hasComplete = formData.start_time && formData.end_time

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost flex items-center justify-center w-10 h-10 rounded-2xl shrink-0"
          aria-label="Volver"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white truncate">
            {isEditing ? 'Editar jornada' : 'Registrar jornada'}
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {isEditing ? 'Actualiza los datos del turno' : 'Añade un turno de trabajo'}
          </p>
        </div>
      </div>

      {/* Live preview */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-600 to-accent-600 p-6 shadow-xl shadow-brand-600/30 mb-5 animate-fade-in">
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-8 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider capitalize">
              {dateLabel}
            </p>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
              calculated > 0 ? 'bg-white/15 text-white' : 'bg-white/10 text-white/60'
            }`}>
              {calculated > 0 ? `${formData.break_minutes > 0 ? 'Con pausa' : 'Sin pausa'}` : 'Pendiente'}
            </span>
          </div>

          <p className="text-4xl font-extrabold text-white mt-2 tabular-nums">
            {calculated > 0 ? formatHours(calculated) : '--:--'}
            <span className="text-lg font-bold text-white/60 ml-1">h</span>
          </p>
          <p className="text-[11px] text-white/60 mt-1">Horas netas de trabajo</p>

          {hasComplete && (
            <div className="mt-4 pt-4 border-t border-white/15 flex items-center gap-2">
              <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-semibold text-white tabular-nums">
                {formData.start_time} - {formData.end_time}
                {Number(formData.break_minutes) > 0 && (
                  <span className="text-white/70 font-medium"> · {formData.break_minutes} min</span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage message={error} onDismiss={() => setError('')} />

        {/* Fecha */}
        <div className="card">
          <label className="label" htmlFor="work_date">Fecha</label>
          <input
            id="work_date"
            type="date"
            value={formData.work_date}
            onChange={(e) => handleChange('work_date', e.target.value)}
            className="input-field"
            required
          />
        </div>

        {/* Horario */}
        <div className="card">
          <span className="label">Horario</span>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1.5 block" htmlFor="start_time">Inicio</label>
              <input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => handleChange('start_time', e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1.5 block" htmlFor="end_time">Fin</label>
              <input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => handleChange('end_time', e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-50/60 dark:bg-brand-500/5">
            <svg className="w-4 h-4 text-brand-500 dark:text-brand-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-xs font-medium text-brand-700 dark:text-brand-300">
              {calculated > 0 ? `${formatHours(calculated)}h netas calculadas` : 'Completa inicio y fin para calcular'}
            </p>
          </div>
        </div>

        {/* Descanso */}
        <div className="card">
          <span className="label">Descanso</span>
          <div className="flex flex-wrap gap-2 mb-3">
            {BREAK_PRESETS.map(min => (
              <button
                key={min}
                type="button"
                onClick={() => handleChange('break_minutes', min)}
                className={`${Number(formData.break_minutes) === min ? 'chip chip-active' : 'chip'}`}
              >
                {min === 0 ? 'Sin pausa' : `${min} min`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              id="break_minutes"
              type="number"
              min="0"
              max="480"
              value={formData.break_minutes}
              onChange={(e) => handleChange('break_minutes', e.target.value)}
              className="input-field"
              placeholder="0"
            />
            <span className="text-sm text-slate-400 dark:text-slate-500 flex-shrink-0">minutos</span>
          </div>
        </div>

        {/* Notas */}
        <div className="card">
          <label className="label" htmlFor="notes">Notas (opcional)</label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="input-field resize-none h-20"
            placeholder="Notas adicionales..."
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading
            ? 'Guardando...'
            : isEditing
              ? 'Actualizar jornada'
              : 'Guardar jornada'
          }
        </button>
      </form>
    </div>
  )
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}
