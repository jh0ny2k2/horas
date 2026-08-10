export default function LoadingSpinner({ text = 'Cargando...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-slate-200 dark:border-slate-800" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-500 dark:border-t-brand-400 animate-spin" />
      </div>
      <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">{text}</p>
    </div>
  )
}
