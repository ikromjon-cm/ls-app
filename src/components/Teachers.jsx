import { useApp } from '../context/AppContext'
import PageHeader from './layout/PageHeader'

export default function Teachers() {
  const { state } = useApp()
  return (
    <div>
      <PageHeader title="O'qituvchilar" subtitle="Barcha o'qituvchilar ro'yxati" />
      <div className="card">
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">O'qituvchilar sahifasi ishlab chiqilmoqda</p>
      </div>
    </div>
  )
}
