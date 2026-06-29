export default function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmText = "O'chirish", danger = true }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className={`w-14 h-14 ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-800'} rounded-full flex items-center justify-center mx-auto mb-3`}>
            {danger ? (
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            ) : (
              <svg className="w-7 h-7 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{message}</p>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="btn_secondary flex-1">Bekor qilish</button>
          <button
            onClick={onConfirm}
            className={danger ? 'btn_danger flex-1' : 'btn_primary flex-1'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
