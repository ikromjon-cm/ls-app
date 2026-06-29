import { useApp } from '../context/AppContext'
import PageHeader from './layout/PageHeader'

export default function NotificationsPage() {
  const { state } = useApp()
  const { notifications = [] } = state
  return (
    <div>
      <PageHeader title="Xabarnomalar" subtitle="Barcha xabarnomalar" />
      <div className="card">
        {notifications.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">Xabarnomalar mavjud emas</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-700 dark:text-gray-300">{n.message}</p>
                {n.createdAt && <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('uz-UZ')}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
