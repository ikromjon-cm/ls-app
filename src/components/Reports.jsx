import { useApp } from '../context/AppContext'
import PageHeader from './layout/PageHeader'

export default function Reports() {
  const { state } = useApp()
  return (
    <div>
      <PageHeader title="Hisobotlar" subtitle="Barcha hisobotlar" />
      <div className="card">
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">Hisobotlar sahifasi ishlab chiqilmoqda</p>
      </div>
    </div>
  )
}
