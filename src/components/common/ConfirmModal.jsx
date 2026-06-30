import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmModal({ show, open, title, message, danger, confirmText, onConfirm, onCancel }) {
  return (
    <AnimatePresence>
      {(show || open) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="modal-glass rounded-3xl p-6 max-w-md w-full shadow-2xl"
            role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-2xl ${danger ? 'bg-red-50 dark:bg-red-900/20' : 'bg-indigo-50 dark:bg-indigo-900/20'}`}>
                <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-500' : 'text-indigo-500'}`} />
              </div>
              <div className="flex-1">
                <h3 id="confirm-modal-title" className="font-semibold text-[#18181B] dark:text-[#FAFAFA]">{title || 'Tasdiqlash'}</h3>
                <p className="text-[#71717A] dark:text-[#A1A1AA] mt-1 text-sm">{message || 'Haqiqatan ham davom etmoqchimisiz?'}</p>
              </div>
              <button onClick={onCancel} className="p-1.5 rounded-xl text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] transition-colors" aria-label="Yopish">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={onCancel} className="btn_secondary">Bekor qilish</button>
              <button onClick={onConfirm} className={danger ? 'btn_danger' : 'btn_primary'}>{confirmText || 'Tasdiqlash'}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
