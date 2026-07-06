import { formatHours } from '../../lib/calculations'

export default function ShiftCard({ shift, onView, onEdit, onDelete, compact = false }) {
  return (
    <div className="card animate-fade-in active:scale-[0.99] transition-transform">
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={() => onView(shift)}
          className="flex-1 min-w-0 text-left"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-slate-700">
              {formatDate(shift.work_date)}
            </span>
            <span className="text-xs text-slate-400">
              {getDayName(shift.work_date)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>{shift.start_time.slice(0, 5)}</span>
            <span className="text-slate-300">→</span>
            <span>{shift.end_time.slice(0, 5)}</span>
            {shift.break_minutes > 0 && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-xs">{shift.break_minutes}min</span>
              </>
            )}
          </div>
          {shift.notes && !compact && (
            <p className="text-xs text-slate-400 mt-1.5 line-clamp-1">{shift.notes}</p>
          )}
        </button>

        <div className="flex items-center gap-4 shrink-0">
          <span className="text-lg font-bold text-gold tabular-nums">
            {formatHours(shift.total_hours)}
            <span className="text-xs font-normal text-slate-400 ml-0.5">h</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onView(shift)}
              className="p-3 rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-all"
              aria-label="Ver detalle"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              onClick={() => onEdit(shift)}
              className="p-3 rounded-2xl text-slate-400 hover:text-gold hover:bg-gold/5 active:bg-gold/10 transition-all"
              aria-label="Editar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(shift)}
              className="p-3 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 active:bg-red-100 transition-all"
              aria-label="Eliminar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function getDayName(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Hoy'
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer'

  return d.toLocaleDateString('es-ES', { weekday: 'short' })
}
