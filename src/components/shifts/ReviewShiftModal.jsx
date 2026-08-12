import { useState } from 'react'
import { createPortal } from 'react-dom'
import { formatHours } from '../../lib/calculations'

export default function ReviewShiftModal({ shift, mode, onClose, onSubmit }) {
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  if (!shift) return null

  const isReject = mode === 'reject'

  const handleSubmit = async () => {
    if (saving) return
    setSaving(true)
    try {
      await onSubmit(comment.trim())
      onClose()
    } catch {
      setSaving(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full sm:max-w-sm rounded-t-[2rem] sm:rounded-3xl shadow-premium-lg animate-slide-up max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pt-3 px-6 sm:hidden flex justify-center">
          <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              {isReject ? 'Rechazar turno' : 'Devolver a pendiente'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 mb-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatDateFull(shift.work_date)}</p>
              <p className="text-lg font-extrabold text-brand-600 dark:text-brand-400 tabular-nums">
                {formatHours(shift.total_hours)}h
              </p>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
              {shift.break_minutes > 0 && ` · ${shift.break_minutes}min descanso`}
            </p>
            {shift.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 italic">"{shift.notes}"</p>}
          </div>

          <label className="label">{isReject ? 'Motivo del rechazo' : 'Motivo de la devolución'} <span className="text-slate-400">(opcional)</span></label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="input-field resize-none h-24"
            placeholder={isReject
              ? 'Ej: Esas horas no corresponden a este turno.'
              : 'Ej: Faltó registrar el descanso, revísalo y vuelve a enviarlo.'}
          />

          <div className="mt-5 space-y-2">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className={`w-full py-3 rounded-2xl text-white text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60 ${
                isReject
                  ? 'bg-gradient-to-r from-rose-500 to-red-500 shadow-lg shadow-rose-500/25'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25'
              }`}
            >
              {saving ? 'Guardando...' : isReject ? 'Rechazar turno' : 'Devolver a pendiente'}
            </button>
            <button
              onClick={onClose}
              className="w-full text-center text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 py-1 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function formatDateFull(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}
