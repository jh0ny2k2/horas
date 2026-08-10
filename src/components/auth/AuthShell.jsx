export default function AuthShell({ title, subtitle, icon, iconClassName, children }) {
  return (
    <div className="min-h-screen bg-ivory dark:bg-slate-950 flex flex-col relative overflow-hidden">
      <div className="absolute -top-28 -right-20 w-80 h-80 rounded-full bg-brand-400/15 dark:bg-brand-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-28 w-80 h-80 rounded-full bg-accent-400/15 dark:bg-accent-500/10 blur-3xl pointer-events-none" />

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6 py-10 relative">
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-[1.4rem] bg-gradient-to-br mx-auto mb-5 flex items-center justify-center shadow-xl ring-4 ${iconClassName || 'from-brand-600 to-accent-600 shadow-brand-600/30 ring-brand-500/10'}`}>
            {icon}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">{title}</h1>
          {subtitle && (
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
