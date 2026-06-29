import { useApp } from '../context/AppContext'
import PageHeader from './layout/PageHeader'

export default function Expenses() {
  const { state } = useApp()
  return (
    <div>
      <PageHeader title="Xarajatlar" subtitle="Barcha xarajatlar ro'yxati" />
      <div className="card">
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">Xarajatlar sahifasi ishlab chiqilmoqda</p>
      </div>
    </div>
  )
}
