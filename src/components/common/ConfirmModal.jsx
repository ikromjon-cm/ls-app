import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmModal({ show, title, message, danger, onConfirm, onCancel }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-primary-100 dark:bg-primary-900/30'}`}>
                <AlertTriangle className={`w-6 h-6 ${danger ? 'text-red-500' : 'text-primary-500'}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{title || 'Tasdiqlash'}</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{message || 'Haqiqatan ham davom etmoqchimisiz?'}</p>
              </div>
              <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={onCancel} className="btn_secondary">Bekor qilish</button>
              <button onClick={onConfirm} className={danger ? 'btn_danger' : 'btn_primary'}>Tasdiqlash</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
