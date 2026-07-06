export default function ErrorMessage({ message, onDismiss }) {
  if (!message) return null

  return (
    <div className="bg-red-50/90 backdrop-blur-sm border border-red-100 rounded-2xl px-5 py-4 animate-fade-in">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-red-600 flex-1">{message}</p>
        {onDismiss && (
          <button onClick={onDismiss} className="text-red-400 hover:text-red-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
