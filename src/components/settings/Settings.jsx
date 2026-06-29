import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, RefreshCw } from 'lucide-react'
import { api } from '../../api'
import PageHeader from '../layout/PageHeader'
import Toast from '../common/Toast'

export default function Settings() {
  const [settings, setSettings] = useState({ sessionTimeout: 60, smsEnabled: false, telegramEnabled: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  useEffect(() => {
    api.getSettings()
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateSettings(settings)
      setToast({ show: true, message: 'Sozlamalar saqlandi', type: 'success' })
    } catch (e) {
      setToast({ show: true, message: e.message, type: 'error' })
    }
    setSaving(false)
  }

  if (loading) return <div className="space-y-4"><div className="skeleton h-8 w-48" /><div className="skeleton h-40 w-full" /></div>

  return (
    <div>
      <PageHeader title="Sozlamalar" subtitle="Tizim sozlamalarini boshqaring" />

      <div className="max-w-2xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
          <h3 className="text-lg font-semibold mb-4">Xavfsizlik</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Session timeout (daqiqa)</label>
            <input type="number" value={settings.sessionTimeout} onChange={e => setSettings(s => ({ ...s, sessionTimeout: Number(e.target.value) }))} className="input_field w-40" min="5" max="480" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
          <h3 className="text-lg font-semibold mb-4">Integratsiyalar</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={settings.smsEnabled} onChange={e => setSettings(s => ({ ...s, smsEnabled: e.target.checked }))} className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <div><p className="font-medium">SMS xabarnomalar</p><p className="text-sm text-gray-500">To'lov eslatmasi, davomat xabarlari</p></div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={settings.telegramEnabled} onChange={e => setSettings(s => ({ ...s, telegramEnabled: e.target.checked }))} className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <div><p className="font-medium">Telegram bot</p><p className="text-sm text-gray-500">Telegram orqali xabarlar yuborish</p></div>
            </label>
          </div>
          <p className="text-xs text-gray-400 mt-4 italic">* SMS va Telegram integratsiyasi keyingi versiyalarda to'liq ishga tushadi</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn_primary flex items-center gap-2">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </motion.div>
      </div>

      <Toast {...toast} onClose={() => setToast(s => ({ ...s, show: false }))} />
    </div>
  )
}
