import { createPortal } from 'react-dom'
import { formatHours } from '../../lib/calculations'

export default function ShiftDetailModal({ shift, onClose, onEdit, onDelete }) {
  if (!shift) return null

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
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Detalle de jornada</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="text-center mb-5">
            <p className="text-4xl font-extrabold bg-gradient-to-r from-brand-600 to-accent-600 dark:from-brand-400 dark:to-accent-400 bg-clip-text text-transparent tabular-nums">
              {formatHours(shift.total_hours)}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {Number(shift.total_hours).toFixed(2)}h netas
            </p>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800 mb-4" />

          <div className="grid grid-cols-2 gap-y-4 gap-x-3">
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Fecha</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1">
                {formatDateFull(shift.work_date)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Día</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1 capitalize">
                {getDayNameFull(shift.work_date)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Inicio</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1">
                {shift.start_time.slice(0, 5)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Fin</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1">
                {shift.end_time.slice(0, 5)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Duración</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1">
                {calcDuration(shift.start_time, shift.end_time)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Descanso</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1">
                {shift.break_minutes > 0 ? `${shift.break_minutes} min` : '—'}
              </p>
            </div>
          </div>

          {shift.notes && (
            <>
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Notas</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 leading-relaxed">
                  {shift.notes}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="px-6 pb-6 safe-area-bottom space-y-2">
          {(onEdit || onDelete) && (
            <div className="flex gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(shift)}
                  className="btn-secondary flex-1"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar
                  </span>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(shift)}
                  className="flex-1 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 font-medium py-3 px-5 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-500/10 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar
                </button>
              )}
            </div>
          )}
          <button onClick={onClose} className="w-full text-center text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 py-1 transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function formatDateFull(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getDayNameFull(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-ES', { weekday: 'long' })
}

function calcDuration(startTime, endTime) {
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  let startTotal = startH * 60 + startM
  let endTotal = endH * 60 + endM
  if (endTotal <= startTotal) endTotal += 24 * 60
  const diff = endTotal - startTotal
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return `${h}h ${m}min`
}
