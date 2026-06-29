import { useApp } from '../context/AppContext'
import PageHeader from './layout/PageHeader'

export default function Students() {
  const { state } = useApp()
  return (
    <div>
      <PageHeader title="O'quvchilar" subtitle="Barcha o'quvchilar ro'yxati" />
      <div className="card">
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">O'quvchilar sahifasi ishlab chiqilmoqda</p>
      </div>
    </div>
  )
}
