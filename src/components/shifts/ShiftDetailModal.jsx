import { formatHours } from '../../lib/calculations'

export default function ShiftDetailModal({ shift, onClose }) {
  if (!shift) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm shadow-premium-lg animate-slide-up max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Detalle de jornada</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="text-center mb-5">
            <p className="text-3xl font-bold text-gold tabular-nums">
              {formatHours(shift.total_hours)}
              <span className="text-base font-normal text-slate-400 ml-1">horas</span>
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {Number(shift.total_hours).toFixed(2)}h netas
            </p>
          </div>

          <div className="h-px bg-slate-100 mb-4" />

          <div className="grid grid-cols-2 gap-y-4 gap-x-3">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Fecha</p>
              <p className="text-sm font-semibold text-slate-700 mt-1">
                {formatDateFull(shift.work_date)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Día</p>
              <p className="text-sm font-semibold text-slate-700 mt-1 capitalize">
                {getDayNameFull(shift.work_date)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Inicio</p>
              <p className="text-sm font-semibold text-slate-700 mt-1">
                {shift.start_time.slice(0, 5)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Fin</p>
              <p className="text-sm font-semibold text-slate-700 mt-1">
                {shift.end_time.slice(0, 5)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Duración</p>
              <p className="text-sm font-semibold text-slate-700 mt-1">
                {calcDuration(shift.start_time, shift.end_time)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Descanso</p>
              <p className="text-sm font-semibold text-slate-700 mt-1">
                {shift.break_minutes > 0 ? `${shift.break_minutes} min` : '—'}
              </p>
            </div>
          </div>

          {shift.notes && (
            <>
              <div className="h-px bg-slate-100 my-4" />
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Notas</p>
                <p className="text-sm text-slate-600 bg-slate-50 rounded-2xl p-3 leading-relaxed">
                  {shift.notes}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="px-6 pb-6">
          <button onClick={onClose} className="btn-primary">
            Cerrar
          </button>
        </div>
      </div>
    </div>
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
