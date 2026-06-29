import { useState, useMemo, useEffect, useCallback, Fragment } from 'react'
import { useApp } from '../../context/AppContext'
import { api } from '../../api'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Download, ChevronDown, ChevronUp,
  DollarSign, User, CreditCard, X,
} from 'lucide-react'
import PageHeader from '../layout/PageHeader'

const METHOD_BADGE = {
  Naqd: 'badge_green',
  Click: 'badge_blue',
  Payme: 'badge_blue',
  Uzum: 'badge_purple',
  Bank: 'badge_yellow',
}

const METHODS = ['Naqd', 'Click', 'Payme', 'Uzum', 'Bank']

function formatCurrency(amount) {
  return new Intl.NumberFormat('uz-UZ').format(amount || 0) + " so'm"
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function Toast({ show, message, type, onClose }) {
  useEffect(() => {
    if (show) { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }
  }, [show, onClose])
  if (!show) return null
  const bg = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  return (
    <div className="fixed top-20 right-4 z-[60] animate-bounce-in">
      <div className={`${bg} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 ring-2 ring-offset-2 dark:ring-offset-gray-900 ring-white/50`}>
        <span className="font-medium text-sm sm:text-base">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70 font-bold text-lg leading-none">&times;</button>
      </div>
    </div>
  )
}

export default function Payments() {
  const { state, dispatch } = useApp()
  const { payments: rawPayments, students, groups, stats } = state

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formStudentId, setFormStudentId] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formMethod, setFormMethod] = useState('Naqd')
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10))
  const [formErrors, setFormErrors] = useState({})
  const [studentSearch, setStudentSearch] = useState('')
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)

  const [expandedRow, setExpandedRow] = useState(null)
  const [expandedPayment, setExpandedPayment] = useState(null)

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const showToast = useCallback((message, type = 'success') => setToast({ show: true, message, type }), [])
  const hideToast = useCallback(() => setToast(s => ({ ...s, show: false })), [])

  const filteredPayments = useMemo(() => {
    let list = rawPayments || []
    if (dateFrom) list = list.filter(p => p.date >= dateFrom)
    if (dateTo) list = list.filter(p => p.date <= dateTo)
    return [...list].reverse()
  }, [rawPayments, dateFrom, dateTo])

  const totalRevenue = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
    return (rawPayments || [])
      .filter(p => p.date >= startOfMonth && p.date <= endOfMonth)
      .reduce((sum, p) => sum + (p.amount || 0), 0)
  }, [rawPayments])

  const debtorCount = useMemo(() => {
    return (students || []).filter(s => s.paymentStatus === 'debt' || s.paymentStatus === 'risk').length
  }, [students])

  const allStudents = useMemo(() => {
    return (students || []).map(s => {
      const group = (groups || []).find(g => g.id === s.groupId)
      return { ...s, groupName: group?.name || s.groupName, groupPrice: group?.price }
    })
  }, [students, groups])

  const studentOptions = useMemo(() => {
    let list = allStudents
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase()
      list = list.filter(s =>
        s.name?.toLowerCase().includes(q) || s.phone?.includes(q)
      )
    }
    return list.slice(0, 20)
  }, [allStudents, studentSearch])

  const selectedStudent = useMemo(() => {
    if (!formStudentId) return null
    return allStudents.find(s => s.id === Number(formStudentId))
  }, [allStudents, formStudentId])

  function validateForm() {
    const errs = {}
    if (!formStudentId) errs.student = "Talaba tanlanmagan"
    if (!formAmount || Number(formAmount) <= 0) errs.amount = "To'lov summasini kiriting"
    if (!formDate) errs.date = 'Sanani tanlang'
    if (!formMethod) errs.method = 'Usulni tanlang'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  function openAddModal() {
    setFormStudentId('')
    setFormAmount('')
    setFormMethod('Naqd')
    setFormDate(new Date().toISOString().slice(0, 10))
    setFormErrors({})
    setStudentSearch('')
    setShowStudentDropdown(false)
    setModalOpen(true)
  }

  function closeModal() {
    if (submitting) return
    setModalOpen(false)
  }

  function selectStudent(student) {
    setFormStudentId(String(student.id))
    setStudentSearch(student.name)
    setShowStudentDropdown(false)
    if (student.groupPrice && !formAmount) {
      setFormAmount(String(student.groupPrice))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validateForm() || submitting) return
    setSubmitting(true)
    try {
      const payload = {
        studentId: Number(formStudentId),
        amount: Number(formAmount),
        method: formMethod,
        date: formDate,
        studentName: selectedStudent?.name || '',
        groupId: selectedStudent?.groupId || null,
      }
      const created = await api.createPayment(payload)
      dispatch({ type: 'ADD_PAYMENT', payment: created })
      showToast("To'lov qabul qilindi")
      closeModal()
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  function toggleExpand(payment) {
    if (expandedRow === payment.id) {
      setExpandedRow(null)
      setExpandedPayment(null)
    } else {
      setExpandedRow(payment.id)
      setExpandedPayment(payment)
    }
  }

  function exportCSV() {
    const headers = ['Sana', "Talaba", 'Guruh', 'Summa', 'Usul', "Kim tomonidan"]
    const rows = filteredPayments.map(p => [
      p.date, p.studentName, p.groupName, p.amount, p.method, p.createdByName || '',
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `tolovlar-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    showToast('CSV yuklandi')
  }

  return (
    <div className="space-y-6">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />

      <PageHeader
        title="To'lovlar"
        subtitle="Barcha to'lovlarni boshqaring"
        actions={
          <div className="flex gap-2">
            <button onClick={exportCSV} disabled={filteredPayments.length === 0} className="btn_secondary flex items-center gap-2 text-sm">
              <Download className="w-4 h-4" />
              CSV eksport
            </button>
            <button onClick={openAddModal} className="btn_primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              To'lov qabul qilish
            </button>
          </div>
        }
      />

      {/* Summary bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-900">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Oylik tushum</p>
          </div>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-900">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">To'lovlar soni</p>
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{rawPayments?.length || 0} ta</p>
        </div>
        <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-900">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">Qarzdorlar</p>
          </div>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">{debtorCount} ta</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Boshlang'ich sana</label>
          <input
            type="date"
            className="input_field text-sm"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tugash sanasi</label>
          <input
            type="date"
            className="input_field text-sm"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo('') }}
            className="btn_ghost text-sm flex items-center gap-1 mb-0.5"
          >
            <X className="w-3.5 h-3.5" />
            Filtrni tozalash
          </button>
        )}
      </div>

      {/* Payments table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Sana</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Talaba</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Guruh</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Summa</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Usul</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Kim tomonidan</th>
                <th className="py-3 px-4 w-10" />
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400 dark:text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p>To'lovlar mavjud emas</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const isExpanded = expandedRow === payment.id
                  return (
                    <Fragment key={payment.id}>
                      <tr
                        onClick={() => toggleExpand(payment)}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(payment.date)}</td>
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{payment.studentName || '—'}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{payment.groupName || '—'}</td>
                        <td className="py-3 px-4 text-right font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{formatCurrency(payment.amount)}</td>
                        <td className="py-3 px-4">
                          <span className={METHOD_BADGE[payment.method] || 'badge_blue'}>{payment.method || '—'}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{payment.createdByName || '—'}</td>
                        <td className="py-3 px-4">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </td>
                      </tr>
                      <AnimatePresence>
                        {isExpanded && expandedPayment && (
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <td colSpan={7} className="p-0">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="bg-gray-50 dark:bg-gray-800/30 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-400 dark:text-gray-500 text-xs block">To'lov ID</span>
                                      <span className="text-gray-800 dark:text-gray-200 font-medium">#{payment.id}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400 dark:text-gray-500 text-xs block">Sana</span>
                                      <span className="text-gray-800 dark:text-gray-200">{formatDate(payment.date)}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400 dark:text-gray-500 text-xs block">Summa</span>
                                      <span className="text-gray-800 dark:text-gray-200 font-medium">{formatCurrency(payment.amount)}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400 dark:text-gray-500 text-xs block">To'lov usuli</span>
                                      <span className={METHOD_BADGE[payment.method] || 'badge_blue'}>{payment.method || '—'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400 dark:text-gray-500 text-xs block">Talaba</span>
                                      <span className="text-gray-800 dark:text-gray-200">{payment.studentName || '—'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400 dark:text-gray-500 text-xs block">Guruh</span>
                                      <span className="text-gray-800 dark:text-gray-200">{payment.groupName || '—'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400 dark:text-gray-500 text-xs block">Kim tomonidan</span>
                                      <span className="text-gray-800 dark:text-gray-200">{payment.createdByName || '—'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400 dark:text-gray-500 text-xs block">Yaratilgan vaqt</span>
                                      <span className="text-gray-800 dark:text-gray-200">{payment.createdAt ? formatDate(payment.createdAt) : '—'}</span>
                                    </div>
                                  </div>
                                  {payment.note && (
                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                      <span className="text-gray-400 dark:text-gray-500 text-xs block">Izoh</span>
                                      <span className="text-gray-800 dark:text-gray-200 text-sm">{payment.note}</span>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Modal */}
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
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">To'lov qabul qilish</h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none">&times;</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Student select (searchable) */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Talaba *</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      className={`input_field pl-9 ${formErrors.student ? 'input_error' : ''}`}
                      placeholder="Talabani qidirish..."
                      value={studentSearch}
                      onChange={(e) => {
                        setStudentSearch(e.target.value)
                        setFormStudentId('')
                        setShowStudentDropdown(true)
                      }}
                      onFocus={() => setShowStudentDropdown(true)}
                      disabled={submitting}
                    />
                    {selectedStudent && (
                      <button
                        type="button"
                        onClick={() => { setFormStudentId(''); setStudentSearch(''); setFormAmount('') }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {formErrors.student && <p className="text-xs text-red-500 mt-1">{formErrors.student}</p>}

                  <AnimatePresence>
                    {showStudentDropdown && !formStudentId && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto"
                      >
                        {studentOptions.length === 0 ? (
                          <p className="text-sm text-gray-400 p-3 text-center">Talaba topilmadi</p>
                        ) : (
                          studentOptions.map(s => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => selectStudent(s)}
                              className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 flex items-center gap-3"
                            >
                              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xs flex-shrink-0">
                                {s.name ? s.name.charAt(0).toUpperCase() : '?'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">{s.name}</p>
                                <p className="text-xs text-gray-400 truncate">{s.phone} | {s.groupName}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Summa *</label>
                  <input
                    type="number"
                    className={`input_field ${formErrors.amount ? 'input_error' : ''}`}
                    placeholder="500000"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    disabled={submitting}
                  />
                  {formErrors.amount && <p className="text-xs text-red-500 mt-1">{formErrors.amount}</p>}
                </div>

                {/* Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">To'lov usuli</label>
                  <div className="grid grid-cols-5 gap-2">
                    {METHODS.map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setFormMethod(m)}
                        className={`py-2 px-1 rounded-lg text-xs font-medium border transition-all ${
                          formMethod === m
                            ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-400 text-primary-700 dark:text-primary-300'
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  {formErrors.method && <p className="text-xs text-red-500 mt-1">{formErrors.method}</p>}
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Sana</label>
                  <input
                    type="date"
                    className={`input_field ${formErrors.date ? 'input_error' : ''}`}
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    disabled={submitting}
                  />
                  {formErrors.date && <p className="text-xs text-red-500 mt-1">{formErrors.date}</p>}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="btn_secondary flex-1" disabled={submitting}>Bekor qilish</button>
                  <button type="submit" className="btn_primary flex-1" disabled={submitting}>
                    {submitting ? 'Saqlanmoqda...' : "To'lovni qabul qilish"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
