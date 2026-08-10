export default function SummaryCard({ label, value, subtitle, icon, color = 'brand' }) {
  const colorClasses = {
    brand: 'from-brand-500 to-accent-500',
    blue: 'from-sky-500 to-blue-600',
    green: 'from-emerald-500 to-teal-600',
    purple: 'from-violet-500 to-purple-600',
    amber: 'from-amber-500 to-orange-500',
  }

  const glowClasses = {
    brand: 'shadow-brand-600/25',
    blue: 'shadow-blue-600/25',
    green: 'shadow-emerald-600/25',
    purple: 'shadow-purple-600/25',
    amber: 'shadow-amber-600/25',
  }

  return (
    <div className="card animate-fade-in hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-300 group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1.5 tabular-nums truncate">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center flex-shrink-0 text-white shadow-lg ${glowClasses[color]} group-hover:scale-105 transition-transform duration-300`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
