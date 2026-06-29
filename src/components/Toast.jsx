import { useEffect } from 'react'
import { useApp } from '../context/AppContext'

export default function Toast() {
  const { state, actions } = useApp()
  const { show, message, type } = state.toast

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => actions.hideToast(), 3500)
      return () => clearTimeout(timer)
    }
  }, [show])

  if (!show) return null

  const config = {
    success: { icon: '✓', bg: 'bg-emerald-500', ring: 'ring-emerald-300' },
    error: { icon: '✕', bg: 'bg-red-500', ring: 'ring-red-300' },
    info: { icon: 'ℹ', bg: 'bg-blue-500', ring: 'ring-blue-300' },
  }

  const { icon, bg, ring } = config[type] || config.success

  return (
    <div className="fixed top-20 right-4 z-50 animate-bounce-in">
      <div className={`${bg} ${ring} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 ring-2 ring-offset-2 dark:ring-offset-gray-900`}>
        <span className="text-lg font-bold">{icon}</span>
        <span className="font-medium text-sm sm:text-base">{message}</span>
        <button onClick={() => actions.hideToast()} className="ml-2 hover:opacity-70 transition-opacity font-bold text-lg leading-none">&times;</button>
      </div>
    </div>
  )
}
