import { useState, useEffect, useCallback } from 'react'
import { api } from '../../api'
import { motion } from 'framer-motion'
import { Save, CreditCard, Eye, EyeOff } from 'lucide-react'
import PageHeader from '../layout/PageHeader'

const PROVIDER_CONFIG = {
  click: {
    name: 'Click',
    fields: [
      { key: 'merchantId', label: 'Merchant ID', type: 'text' },
      { key: 'secretKey', label: 'Secret Key', type: 'password' },
      { key: 'serviceId', label: 'Service ID', type: 'text' },
      { key: 'merchantUserId', label: 'Merchant User ID', type: 'text' },
    ],
  },
  payme: {
    name: 'Payme',
    fields: [
      { key: 'merchantId', label: 'Merchant ID', type: 'text' },
      { key: 'secretKey', label: 'Secret Key', type: 'password' },
      { key: 'checkoutUrl', label: 'Checkout URL', type: 'text' },
    ],
  },
  uzum: {
    name: 'Uzum',
    fields: [
      { key: 'merchantId', label: 'Merchant ID', type: 'text' },
      { key: 'secretKey', label: 'Secret Key', type: 'password' },
      { key: 'terminalId', label: 'Terminal ID', type: 'text' },
    ],
  },
}

export default function PaymentSettings() {
  const [config, setConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [visible, setVisible] = useState({})

  const load = useCallback(async () => {
    try {
      const data = await api.request('/payments/providers/config', {})
      setConfig(data || {})
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const updateProvider = (provider, key, value) => {
    setConfig(prev => ({
      ...prev,
      [provider]: { ...prev[provider], [key]: value, enabled: true },
    }))
  }

  const toggleProvider = (provider) => {
    setConfig(prev => ({
      ...prev,
      [provider]: { ...prev[provider], enabled: !prev[provider]?.enabled },
    }))
  }

  const save = async () => {
    setSaving(true)
    try {
      await api.request('/payments/providers/config', { method: 'PUT', body: JSON.stringify(config) })
    } catch {} finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="To'lov tizimlari" subtitle="Click, Payme va Uzum sozlamalari" />

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(PROVIDER_CONFIG).map(([provider, info]) => {
            const pConfig = config[provider] || {}
            return (
              <motion.div key={provider} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20">
                      <CreditCard className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{info.name}</h3>
                      <p className="text-xs text-gray-400">{pConfig.enabled ? 'Faol' : 'Faol emas'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleProvider(provider)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${pConfig.enabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${pConfig.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {info.fields.map(field => (
                    <div key={field.key}>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{field.label}</label>
                      <div className="relative">
                        <input
                          type={field.type === 'password' && !visible[`${provider}-${field.key}`] ? 'password' : 'text'}
                          value={pConfig[field.key] || ''}
                          onChange={e => updateProvider(provider, field.key, e.target.value)}
                          className="input_field text-sm pr-8"
                          placeholder={field.label}
                        />
                        {field.type === 'password' && (
                          <button
                            type="button"
                            onClick={() => setVisible(prev => ({ ...prev, [`${provider}-${field.key}`]: !prev[`${provider}-${field.key}`] }))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {visible[`${provider}-${field.key}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}

          <div className="flex justify-end">
            <button onClick={save} disabled={saving} className="btn_primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Saqlanmoqda...' : 'Sozlamalarni saqlash'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
