import { Inbox } from 'lucide-react'

export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
        <Inbox className="w-12 h-12 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title || 'Ma\'lumot topilmadi'}</h3>
      <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-sm">{description || 'Hozircha hech qanday ma\'lumot mavjud emas.'}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
