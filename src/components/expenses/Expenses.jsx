import { useState, useMemo, useCallback } from 'react'
import { useApp } from '../../context/AppContext'
import { api } from '../../api'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, Wallet, Layers, TrendingUp, X,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import PageHeader from '../layout/PageHeader'
import ConfirmModal from '../common/ConfirmModal'

const CATEGORIES = [
  { label: 'Hammasi', value: '' },
  { label: 'Oylik', value: 'Oylik' },
  { label: 'Ijara', value: 'Ijara' },
  { label: 'Internet', value: 'Internet' },
  { label: 'Elektr', value: 'Elektr' },
  { label: 'Jihozlar', value: 'Jihozlar' },
  { label: 'Reklama', value: 'Reklama' },
  { label: 'Soliq', value: 'Soliq' },
  { label: 'Boshqa', value: 'Boshqa' },
]

const CATEGORY_COLORS = {
  Oylik: '#8b5cf6',
  Ijara: '#f59e0b',
  Internet: '#3b82f6',
  Elektr: '#10b981',
  Jihozlar: '#ef4444',
  Reklama: '#ec4899',
  Soliq: '#14b8a6',
  Boshqa: '#6b7280',
}

const CATEGORY_BADGE = {
  Oylik: 'badge_purple',
  Ijara: 'badge_yellow',
  Internet: 'badge_blue',
  Elektr: 'badge_green',
  Jihozlar: 'badge_red',
  Reklama: 'badge_red',
  Soliq: 'badge_green',
  Boshqa: 'badge',
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('uz-UZ').format(amount || 0) + " so'm"
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function Toast({ show, message, type, onClose }) {
  const bg = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  if (!show) return null
  return (
    <div className="fixed top-20 right-4 z-[60] animate-bounce-in">
      <div className={`${bg} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 ring-2 ring-offset-2 dark:ring-offset-gray-900 ring-white/50`}>
        <span className="font-medium text-sm sm:text-base">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70 font-bold text-lg leading-none">&times;</button>
      </div>
    </div>
  )
}

export default function Expenses() {
  const { state, dispatch } = useApp()
  const { expenses: rawExpenses } = state

  const [categoryFilter, setCategoryFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const showToast = useCallback((message, type = 'success') => setToast({ show: true, message, type }), [])
  const hideToast = useCallback(() => setToast(s => ({ ...s, show: false })), [])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      category: '',
      amount: '',
      description: '',
      date: new Date().toISOString().slice(0, 10),
    },
  })

  const filteredExpenses = useMemo(() => {
    let list = rawExpenses || []
    if (categoryFilter) list = list.filter(e => e.category === categoryFilter)
    if (dateFrom) list = list.filter(e => e.date >= dateFrom)
    if (dateTo) list = list.filter(e => e.date <= dateTo)
    return [...list].reverse()
  }, [rawExpenses, categoryFilter, dateFrom, dateTo])

  const monthlyTotal = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
    return (rawExpenses || [])
      .filter(e => e.date >= start && e.date <= end)
      .reduce((sum, e) => sum + (e.amount || 0), 0)
  }, [rawExpenses])

  const categoryCount = useMemo(() => {
    const cats = new Set((rawExpenses || []).map(e => e.category))
    return cats.size
  }, [rawExpenses])

  const maxExpense = useMemo(() => {
    if (!rawExpenses || rawExpenses.length === 0) return null
    return rawExpenses.reduce((max, e) => (e.amount > max.amount ? e : max), rawExpenses[0])
  }, [rawExpenses])

  const chartData = useMemo(() => {
    const grouped = {}
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
    ;(rawExpenses || [])
      .filter(e => e.date >= start && e.date <= end)
      .forEach(e => {
        grouped[e.category] = (grouped[e.category] || 0) + (e.amount || 0)
      })
    return CATEGORIES.filter(c => c.value).map(c => ({
      name: c.label,
      summa: grouped[c.value] || 0,
      color: CATEGORY_COLORS[c.value],
    }))
  }, [rawExpenses])

  function openAddModal() {
    reset({ category: '', amount: '', description: '', date: new Date().toISOString().slice(0, 10) })
    setModalOpen(true)
  }

  function closeModal() {
    if (submitting) return
    setModalOpen(false)
  }

  function onSubmit(data) {
    if (submitting) return
    setSubmitting(true)
    const payload = {
      category: data.category,
      amount: Number(data.amount),
      description: data.description || '',
      date: data.date,
    }
    api.createExpense(payload)
      .then(created => {
        dispatch({ type: 'ADD_EXPENSE', expense: created })
        showToast('Xarajat qo\'shildi')
        closeModal()
      })
      .catch(err => showToast(err.message || 'Xatolik yuz berdi', 'error'))
      .finally(() => setSubmitting(false))
  }

  function handleDelete() {
    if (!deleteTarget || deleting) return
    setDeleting(true)
    api.deleteExpense(deleteTarget.id)
      .then(() => {
        dispatch({ type: 'DELETE_EXPENSE', id: deleteTarget.id })
        showToast('Xarajat o\'chirildi')
        setDeleteTarget(null)
      })
      .catch(err => showToast(err.message || 'Xatolik yuz berdi', 'error'))
      .finally(() => setDeleting(false))
  }

  return (
    <div className="space-y-6">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />

      <PageHeader
        title="Xarajatlar"
        subtitle="Barcha xarajatlarni boshqaring"
        actions={
          <button onClick={openAddModal} className="btn_primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Yangi xarajat
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-900">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Oylik xarajat</p>
          </div>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatCurrency(monthlyTotal)}</p>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-900">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Kategoriyalar soni</p>
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{categoryCount} ta</p>
        </div>
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-900">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Eng katta xarajat</p>
          </div>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
            {maxExpense ? formatCurrency(maxExpense.amount) : '—'}
          </p>
          {maxExpense && (
            <p className="text-xs text-orange-500 dark:text-orange-400 mt-0.5">{maxExpense.category}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                categoryFilter === cat.value
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-end ml-auto">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Boshlang'ich sana</label>
            <input type="date" className="input_field text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tugash sanasi</label>
            <input type="date" className="input_field text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          {(dateFrom || dateTo || categoryFilter) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); setCategoryFilter('') }}
              className="btn_ghost text-sm flex items-center gap-1 mb-0.5"
            >
              <X className="w-3.5 h-3.5" />
              Tozalash
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Sana</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Kategoriya</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Summa</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Izoh</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Kim tomonidan</th>
                  <th className="py-3 px-4 w-10" />
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400 dark:text-gray-500">
                      <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                      <p>Xarajatlar mavjud emas</p>
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map(expense => (
                    <tr key={expense.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(expense.date)}</td>
                      <td className="py-3 px-4">
                        <span className={CATEGORY_BADGE[expense.category] || 'badge'}>{expense.category || '—'}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-red-600 dark:text-red-400 whitespace-nowrap">{formatCurrency(expense.amount)}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{expense.description || '—'}</td>
                      <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{expense.createdByName || '—'}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setDeleteTarget(expense)}
                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Kategoriyalar bo'yicha xarajatlar</h3>
          {chartData.every(d => d.summa === 0) ? (
            <p className="text-sm text-gray-400 text-center py-8">Bu oy uchun ma'lumot mavjud emas</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} width={60} />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#e5e7eb' }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Bar dataKey="summa" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 md:p-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Yangi xarajat</h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none">&times;</button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Kategoriya *</label>
                  <select
                    className={`input_field ${errors.category ? 'input_error' : ''}`}
                    {...register('category', { required: 'Kategoriya majburiy' })}
                    disabled={submitting}
                  >
                    <option value="">Tanlang</option>
                    {CATEGORIES.filter(c => c.value).map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Summa *</label>
                  <input
                    type="number"
                    className={`input_field ${errors.amount ? 'input_error' : ''}`}
                    placeholder="500000"
                    {...register('amount', {
                      required: 'Summa majburiy',
                      min: { value: 1, message: 'Summa noto\'g\'ri' },
                    })}
                    disabled={submitting}
                  />
                  {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Izoh</label>
                  <textarea
                    className="input_field"
                    rows={3}
                    placeholder="Xarajat haqida ma'lumot..."
                    {...register('description')}
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Sana</label>
                  <input
                    type="date"
                    className={`input_field ${errors.date ? 'input_error' : ''}`}
                    {...register('date', { required: 'Sana majburiy' })}
                    disabled={submitting}
                  />
                  {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="btn_secondary flex-1" disabled={submitting}>Bekor qilish</button>
                  <button type="submit" className="btn_primary flex-1" disabled={submitting}>
                    {submitting ? 'Saqlanmoqda...' : 'Xarajatni qo\'shish'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={!!deleteTarget}
        title="Xarajatni o'chirish"
        message={`${deleteTarget?.category} — ${formatCurrency(deleteTarget?.amount)} o'chirilsinmi?`}
        confirmText={deleting ? "O'chirilmoqda..." : "O'chirish"}
        danger
        onConfirm={handleDelete}
        onCancel={() => { if (!deleting) setDeleteTarget(null) }}
      />
    </div>
  )
}
