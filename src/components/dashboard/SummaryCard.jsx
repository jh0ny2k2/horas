export default function SummaryCard({ label, value, subtitle, icon, color = 'gold' }) {
  const colorClasses = {
    gold: 'from-gold/10 to-brand-50 border-gold/20',
    blue: 'from-blue-50 to-sky-50 border-blue-200/30',
    green: 'from-emerald-50 to-teal-50 border-emerald-200/30',
    purple: 'from-purple-50 to-violet-50 border-purple-200/30',
  }

  const iconColorClasses = {
    gold: 'text-gold bg-gold/10',
    blue: 'text-blue-500 bg-blue-50',
    green: 'text-emerald-500 bg-emerald-50',
    purple: 'text-purple-500 bg-purple-50',
  }

  return (
    <div className={`card bg-gradient-to-br ${colorClasses[color]} animate-fade-in`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1.5 tabular-nums">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${iconColorClasses[color]}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
