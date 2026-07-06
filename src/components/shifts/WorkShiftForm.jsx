import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { calculateTotalHours } from '../../lib/calculations'
import ErrorMessage from '../ui/ErrorMessage'
import { useNavigate } from 'react-router-dom'

export default function WorkShiftForm({ editShift = null, onSaved }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isEditing = !!editShift

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

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost flex items-center gap-1 text-sm text-slate-400 mb-3"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
        <h2 className="text-lg font-semibold text-slate-700">
          {isEditing ? 'Editar jornada' : 'Registrar jornada'}
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {isEditing ? 'Actualiza los datos del turno' : 'Añade un turno de trabajo'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage message={error} onDismiss={() => setError('')} />

        <div>
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="start_time">Hora inicio</label>
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
            <label className="label" htmlFor="end_time">Hora fin</label>
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

        <div>
          <label className="label" htmlFor="break_minutes">Descanso (minutos)</label>
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
        </div>

        <div>
          <label className="label" htmlFor="notes">Notas (opcional)</label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="input-field resize-none h-20"
            placeholder="Notas adicionales..."
          />
        </div>

        {calculated !== null && calculated > 0 && (
          <div className="card bg-gradient-to-r from-gold/5 to-brand-50 border-gold/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Horas netas calculadas</span>
              <span className="text-lg font-bold text-gold tabular-nums">
                {calculated.toFixed(2)}h
              </span>
            </div>
          </div>
        )}

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
