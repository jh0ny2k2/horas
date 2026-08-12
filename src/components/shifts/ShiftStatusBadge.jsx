import { shiftStatus } from '../../lib/calculations'

const STYLES = {
  approved: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  rejected: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  pending: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
}

const DOTS = {
  approved: 'bg-emerald-500',
  rejected: 'bg-rose-500',
  pending: 'bg-amber-500',
}

const LABELS = {
  approved: 'Aprobado',
  rejected: 'Rechazado',
  pending: 'Pendiente',
}

export default function ShiftStatusBadge({ shift, className = '' }) {
  const status = shiftStatus(shift)

  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${STYLES[status]} ${className}`}>
      <span className={`w-1 h-1 rounded-full ${DOTS[status]}`} />
      {LABELS[status]}
    </span>
  )
}
