import { useApp } from '../context/AppContext'
import PageHeader from './layout/PageHeader'

export default function Audit() {
  const { state } = useApp()
  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Tizimdagi barcha o'zgarishlar logi" />
      <div className="card">
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">Audit log sahifasi ishlab chiqilmoqda</p>
      </div>
    </div>
  )
}
