import { useState, useCallback, createContext, useContext, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const icons = { success: CheckCircle, error: XCircle, warning: AlertCircle, info: Info }
const colors = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
}

const ToastContext = createContext()

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    if (duration > 0) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
    }
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    const handler = (e) => addToast(e.detail?.message || 'Server xatoligi', 'error')
    window.addEventListener('app:error', handler)
    return () => window.removeEventListener('app:error', handler)
  }, [addToast])

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => {
            const Icon = icons[toast.type]
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -8, x: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, x: 8, scale: 0.98 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className={`${colors[toast.type]} text-white rounded-2xl shadow-soft-lg p-4 flex items-start gap-3 pointer-events-auto`}
              >
                <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-sm flex-1">{toast.message}</p>
                <button onClick={() => removeToast(toast.id)} className="shrink-0 hover:opacity-70 transition-opacity">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export default function Toast({ show, message, type = 'info', onClose }) {
  useEffect(() => {
    if (show) { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }
  }, [show, onClose])
  if (!show) return null
  const Icon = icons[type]
  const bg = colors[type]
  return (
    <div className="fixed top-20 right-4 z-[60]">
      <div className={`${bg} text-white px-4 py-3 rounded-2xl shadow-soft-lg flex items-center gap-3`}>
        <Icon className="w-4 h-4" />
        <span className="font-medium text-sm">{message}</span>
        <button onClick={onClose} className="ml-1 hover:opacity-70 font-bold text-lg leading-none">&times;</button>
      </div>
    </div>
  )
}
