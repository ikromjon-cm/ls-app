import { useState, useMemo, useCallback, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { api } from '../../api'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, CheckCheck, Info, CheckCircle, AlertTriangle, XCircle, Clock,
} from 'lucide-react'
import PageHeader from '../layout/PageHeader'

const TYPE_CONFIG = {
  info: { icon: Info, bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900', iconBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' },
  success: { icon: CheckCircle, bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' },
  warning: { icon: AlertTriangle, bg: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900', iconBg: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400' },
  error: { icon: XCircle, bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900', iconBg: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' },
}

function getRelativeTime(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'hozir'
  if (mins < 60) return `${mins} daqiqa oldin`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} soat oldin`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} kun oldin`
  return new Date(dateStr).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' })
}

export default function NotificationPage() {
  const { state, dispatch, refreshNotifications } = useApp()
  const { notifications = [] } = state

  const [processing, setProcessing] = useState(null)

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])

  async function handleMarkAllRead() {
    try {
      const unread = notifications.filter(n => !n.read)
      await Promise.all(unread.map(n => api.markNotificationRead(n.id)))
      await refreshNotifications()
    } catch {}
  }

  async function handleMarkRead(id) {
    if (processing === id) return
    setProcessing(id)
    try {
      await api.markNotificationRead(id)
      dispatch({ type: 'MARK_NOTIFICATION', id })
    } catch {} finally {
      setProcessing(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Xabarlar"
        subtitle="Tizim xabarlari va bildirishnomalar"
        actions={
          unreadCount > 0 ? (
            <button onClick={handleMarkAllRead} className="btn_secondary flex items-center gap-2 text-sm">
              <CheckCheck className="w-4 h-4" />
              Barchasini o'qilgan deb belgilash
            </button>
          ) : null
        }
      />

      {notifications.length === 0 ? (
        <div className="card text-center py-16">
          <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Xabarlar mavjud emas</h3>
          <p className="text-gray-500 dark:text-gray-400">Hozircha hech qanday xabar kelmagan</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {notifications.map((notification, idx) => {
              const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info
              const Icon = config.icon
              const isUnread = !notification.read

              return (
                <motion.div
                  key={notification.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.2 }}
                  onClick={() => { if (isUnread) handleMarkRead(notification.id) }}
                  className={`relative rounded-xl border p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isUnread
                      ? `${config.bg} ring-1 ring-primary-500/30 dark:ring-primary-500/20`
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className={`text-sm ${isUnread ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                            {notification.title || notification.message}
                          </p>
                          {notification.title && notification.message && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notification.message}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getRelativeTime(notification.createdAt)}
                          </span>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-primary-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
