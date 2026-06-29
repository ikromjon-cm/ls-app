import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const icons = { success: CheckCircle, error: XCircle, warning: AlertCircle, info: Info }
const colors = {
  success: 'bg-emerald-500', error: 'bg-red-500', warning: 'bg-yellow-500', info: 'bg-blue-500',
}

export default function Toast({ show, message, type = 'info', onClose }) {
  const Icon = icons[type]
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -20, x: 20 }}
          className="fixed top-20 right-4 z-50 max-w-sm"
        >
          <div className={`${colors[type]} text-white rounded-xl shadow-2xl p-4 flex items-start gap-3 backdrop-blur-sm`}>
            <Icon className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-sm flex-1">{message}</p>
            <button onClick={onClose} className="shrink-0 hover:opacity-70"><X className="w-4 h-4" /></button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
