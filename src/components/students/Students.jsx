import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { api } from '../../api'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, Edit3, Trash2, ChevronDown, ChevronUp,
  AlertTriangle, Upload, X, User, BookOpen, DollarSign,
  Activity, Camera,
} from 'lucide-react'
import PageHeader from '../layout/PageHeader'
import ConfirmModal from '../common/ConfirmModal'

const COURSES = ['Frontend', 'Backend', 'IELTS', 'Python', 'Mobile', 'Design', 'SMM', 'English', 'Matematika', 'Fizika']

const PAYMENT_STATUS_MAP = {
  paid: { label: "To'lagan", className: 'badge_green' },
  debt: { label: 'Qarzdor', className: 'badge_red' },
  risk: { label: 'Xavfli', className: 'badge_yellow' },
}

const AVATAR_COLORS = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
  'bg-orange-500', 'bg-cyan-500',
]

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
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

export default function Students() {
  const { state, dispatch } = useApp()
  const { students: rawStudents, groups } = state

  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [expandedId, setExpandedId] = useState(null)
  const [studentPayments, setStudentPayments] = useState([])
  const [studentAttendance, setStudentAttendance] = useState([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const showToast = useCallback((message, type = 'success') => setToast({ show: true, message, type }), [])
  const hideToast = useCallback(() => setToast(s => ({ ...s, show: false })), [])

  const fileInputRef = useRef(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      gender: '',
      birthDate: '',
      phone: '',
      parentPhone: '',
      parentName: '',
      address: '',
      school: '',
      passport: '',
      course: '',
      groupId: '',
      startDate: new Date().toISOString().slice(0, 10),
      paymentAmount: '',
      paymentDate: '',
      discount: '0',
      note: '',
      medicalInfo: '',
      telegram: '',
    },
  })

  const selectedCourse = watch('course')

  const filteredGroups = useMemo(() => {
    if (!selectedCourse) return groups
    return groups.filter(g => g.course === selectedCourse)
  }, [groups, selectedCourse])

  const prevCourseRef = useRef(selectedCourse)
  useEffect(() => {
    if (prevCourseRef.current !== selectedCourse) {
      prevCourseRef.current = selectedCourse
      setValue('groupId', '')
    }
  }, [selectedCourse, setValue])

  const filteredStudents = useMemo(() => {
    let list = rawStudents || []
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.phone?.includes(q)
      )
    }
    if (courseFilter) list = list.filter(s => s.course === courseFilter)
    if (groupFilter) list = list.filter(s => String(s.groupId) === groupFilter)
    if (paymentFilter) list = list.filter(s => s.paymentStatus === paymentFilter)
    return list
  }, [rawStudents, search, courseFilter, groupFilter, paymentFilter])

  const openAddModal = () => {
    setEditingStudent(null)
    setAvatarPreview(null)
    setAvatarFile(null)
    reset({
      name: '', gender: '', birthDate: '', phone: '', parentPhone: '', parentName: '',
      address: '', school: '', passport: '', course: '', groupId: '',
      startDate: new Date().toISOString().slice(0, 10),
      paymentAmount: '', paymentDate: '', discount: '0', note: '', medicalInfo: '', telegram: '',
    })
    setModalOpen(true)
  }

  const openEditModal = (student) => {
    setEditingStudent(student)
    setAvatarPreview(student.avatar || null)
    setAvatarFile(null)
    reset({
      name: student.name || '',
      gender: student.gender || '',
      birthDate: student.birthDate ? student.birthDate.slice(0, 10) : '',
      phone: student.phone || '',
      parentPhone: student.parentPhone || '',
      parentName: student.parentName || '',
      address: student.address || '',
      school: student.school || '',
      passport: student.passport || '',
      course: student.course || '',
      groupId: String(student.groupId || ''),
      startDate: student.startDate ? student.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      paymentAmount: String(student.paymentAmount || ''),
      paymentDate: student.paymentDate ? student.paymentDate.slice(0, 10) : '',
      discount: String(student.discount || '0'),
      note: student.note || '',
      medicalInfo: student.medicalInfo || '',
      telegram: student.telegram || '',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    if (submitting) return
    setModalOpen(false)
    setEditingStudent(null)
    setAvatarPreview(null)
    setAvatarFile(null)
  }

  const onSubmit = async (data) => {
    if (submitting) return
    setSubmitting(true)
    try {
      const payload = {
        ...data,
        groupId: data.groupId ? Number(data.groupId) : undefined,
        paymentAmount: data.paymentAmount ? Number(data.paymentAmount) : undefined,
        discount: Number(data.discount || 0),
      }
      if (avatarFile) payload.avatar = avatarFile
      if (editingStudent) {
        const updated = await api.updateStudent(editingStudent.id, payload)
        dispatch({ type: 'UPDATE_STUDENT', student: updated })
        showToast("O'quvchi tahrirlandi")
      } else {
        const created = await api.createStudent(payload)
        dispatch({ type: 'ADD_STUDENT', student: created })
        showToast("O'quvchi qo'shildi")
      }
      closeModal()
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete || deleting) return
    setDeleting(true)
    try {
      await api.deleteStudent(confirmDelete.id)
      dispatch({ type: 'DELETE_STUDENT', id: confirmDelete.id })
      showToast("O'quvchi o'chirildi")
      setConfirmDelete(null)
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const toggleExpand = async (studentId) => {
    if (expandedId === studentId) {
      setExpandedId(null)
      setStudentPayments([])
      setStudentAttendance([])
      return
    }
    setExpandedId(studentId)
    setLoadingDetails(true)
    try {
      const [payments, attendance] = await Promise.all([
        api.getPayments({ studentId }),
        api.getAttendance({ studentId }),
      ])
      setStudentPayments(payments || [])
      setStudentAttendance(attendance || [])
    } catch {
      setStudentPayments([])
      setStudentAttendance([])
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (ev) => setAvatarPreview(ev.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleImportCSV = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      const text = await file.text()
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) {
        showToast('CSV faylida ma\'lumot topilmadi', 'error')
        return
      }
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
      let imported = 0
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        const row = {}
        headers.forEach((h, idx) => { row[h] = values[idx] || '' })
        try {
          await api.createStudent({
            name: row['Ism Familiya'] || row['Ism'] || '',
            phone: row['Telefon'] || row['Phone'] || '',
            course: row['Kurs'] || '',
            groupId: row['Guruh ID'] ? Number(row['Guruh ID']) : undefined,
          })
          imported++
        } catch {}
      }
      const updated = await api.getStudents({})
      dispatch({ type: 'SET_INITIAL', data: { students: updated } })
      showToast(`${imported} ta o'quvchi import qilindi`)
    }
    input.click()
  }

  const groupMap = useMemo(() => {
    const m = {}
    groups.forEach(g => { m[g.id] = g })
    return m
  }, [groups])

  return (
    <div className="space-y-6">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />

      <PageHeader
        title="O'quvchilar"
        subtitle="Barcha o'quvchilar ro'yxati"
        actions={
          <div className="flex gap-2">
            <button onClick={handleImportCSV} className="btn_secondary flex items-center gap-2 text-sm">
              <Upload className="w-4 h-4" />
              Import CSV
            </button>
            <button onClick={openAddModal} className="btn_primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Qo'shish
            </button>
          </div>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input_field pl-9"
            placeholder="Ism yoki telefon raqami..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input_field sm:w-40"
          value={courseFilter}
          onChange={(e) => { setCourseFilter(e.target.value); setGroupFilter('') }}
        >
          <option value="">Barcha kurslar</option>
          {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
          {rawStudents.filter(s => s.course && !COURSES.includes(s.course)).map(s =>
            <option key={s.course} value={s.course}>{s.course}</option>
          )}
        </select>
        <select
          className="input_field sm:w-40"
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
        >
          <option value="">Barcha guruhlar</option>
          {(courseFilter ? groups.filter(g => g.course === courseFilter) : groups).map(g =>
            <option key={g.id} value={g.id}>{g.name}</option>
          )}
        </select>
        <select
          className="input_field sm:w-36"
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
        >
          <option value="">Barcha holat</option>
          <option value="paid">To'lagan</option>
          <option value="debt">Qarzdor</option>
          <option value="risk">Xavfli</option>
        </select>
      </div>

      {/* Student cards */}
      {filteredStudents.length === 0 ? (
        <div className="card text-center py-16">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">O'quvchilar topilmadi</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Filtrni o'zgartiring yoki yangi o'quvchi qo'shing</p>
          <button onClick={openAddModal} className="btn_primary">O'quvchi qo'shish</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => {
            const isExpanded = expandedId === student.id
            const group = groupMap[student.groupId]
            const statusCfg = PAYMENT_STATUS_MAP[student.paymentStatus] || PAYMENT_STATUS_MAP.debt

            return (
              <motion.div
                key={student.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="card hover:shadow-lg transition-shadow duration-200 relative overflow-hidden group cursor-pointer"
                onClick={() => toggleExpand(student.id)}
              >
                {/* Actions */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal(student) }}
                    className="w-8 h-8 bg-gray-100 dark:bg-gray-800 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-lg flex items-center justify-center text-gray-500 hover:text-primary-600 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(student) }}
                    className="w-8 h-8 bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Card header */}
                <div className="flex items-start gap-4 mb-3 pr-16">
                  <div className={`w-12 h-12 rounded-full ${getAvatarColor(student.name)} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                    {student.name ? student.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate">{student.name}</h3>
                      {student.riskGroup && (
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" title="Xavfli guruh" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{student.phone || '—'}</p>
                  </div>
                </div>

                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <p><BookOpen className="w-3.5 h-3.5 inline mr-1" />{student.course || '—'}</p>
                  <p><User className="w-3.5 h-3.5 inline mr-1" />{group?.name || student.groupName || '—'}</p>
                </div>

                {/* Payment status */}
                <div className="flex items-center justify-between">
                  <span className={statusCfg.className}>{statusCfg.label}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    Batafsil
                  </span>
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                        {loadingDetails ? (
                          <div className="flex items-center gap-2 py-3 text-sm text-gray-400">
                            <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                            Yuklanmoqda...
                          </div>
                        ) : (
                          <>
                            {/* All fields */}
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <Field label="Jinsi" value={student.gender === 'male' ? 'Erkak' : student.gender === 'female' ? 'Ayol' : student.gender} />
                              <Field label="Tug'ilgan sana" value={formatDate(student.birthDate)} />
                              <Field label="Telefon" value={student.phone} />
                              <Field label="Ota-onasi" value={student.parentName} />
                              <Field label="Ota-ona tel" value={student.parentPhone} />
                              <Field label="Manzil" value={student.address} />
                              <Field label="Maktab" value={student.school} />
                              <Field label="Pasport" value={student.passport} />
                              <Field label="Kurs" value={student.course} />
                              <Field label="Guruh" value={group?.name || student.groupName} />
                              <Field label="Boshlagan sana" value={formatDate(student.startDate)} />
                              <Field label="To'lov summasi" value={student.paymentAmount ? formatCurrency(student.paymentAmount) : '—'} />
                              <Field label="To'lov sanasi" value={formatDate(student.paymentDate)} />
                              <Field label="Chegirma" value={student.discount ? `${student.discount}%` : '—'} />
                              <Field label="Telegram" value={student.telegram} />
                              <Field label="Izoh" value={student.note} />
                              <Field label="Tibbiy holat" value={student.medicalInfo} className="col-span-2" />
                            </div>

                            {/* Payment history */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-1.5">
                                <DollarSign className="w-4 h-4 text-emerald-500" />
                                To'lov tarixi
                              </h4>
                              {studentPayments.length === 0 ? (
                                <p className="text-xs text-gray-400">To'lovlar mavjud emas</p>
                              ) : (
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {studentPayments.map(p => (
                                    <div key={p.id} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-1.5">
                                      <span className="text-gray-500">{formatDate(p.date)}</span>
                                      <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(p.amount)}</span>
                                      <span className="badge_green text-[10px]">{p.method}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Attendance history */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-1.5">
                                <Activity className="w-4 h-4 text-blue-500" />
                                Davomat tarixi
                              </h4>
                              {studentAttendance.length === 0 ? (
                                <p className="text-xs text-gray-400">Davomat ma'lumotlari mavjud emas</p>
                              ) : (
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {studentAttendance.map(a => (
                                    <div key={a.id} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-1.5">
                                      <span className="text-gray-500">{formatDate(a.date)}</span>
                                      <span className={`font-medium ${a.status === 'present' ? 'text-emerald-600' : a.status === 'late' ? 'text-yellow-600' : 'text-red-600'}`}>
                                        {a.status === 'present' ? "Keldi" : a.status === 'late' ? 'Kech qoldi' : "Kelmedi"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingStudent ? "O'quvchini tahrirlash" : "Yangi o'quvchi qo'shish"}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none">&times;</button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ism Familiya *</label>
                    <input
                      className={`input_field ${errors.name ? 'input_error' : ''}`}
                      placeholder="Alisher Karimov"
                      {...register('name', { required: 'Ism majburiy' })}
                      disabled={submitting}
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Jinsi</label>
                    <select className="input_field" {...register('gender')} disabled={submitting}>
                      <option value="">Tanlang</option>
                      <option value="male">Erkak</option>
                      <option value="female">Ayol</option>
                    </select>
                  </div>

                  {/* Birth date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tug'ilgan sana</label>
                    <input type="date" className="input_field" {...register('birthDate')} disabled={submitting} />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Telefon raqami *</label>
                    <input
                      className={`input_field ${errors.phone ? 'input_error' : ''}`}
                      placeholder="+998901234567"
                      {...register('phone', {
                        required: 'Telefon majburiy',
                        pattern: { value: /^\+998\d{9}$/, message: '+998XXXXXXXXX formatida' },
                      })}
                      disabled={submitting}
                    />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                  </div>

                  {/* Parent phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ota-onasi telefon raqami</label>
                    <input
                      className="input_field"
                      placeholder="+998901234567"
                      {...register('parentPhone', {
                        pattern: { value: /^\+998\d{9}$/, message: '+998XXXXXXXXX formatida' },
                      })}
                      disabled={submitting}
                    />
                    {errors.parentPhone && <p className="text-xs text-red-500 mt-1">{errors.parentPhone.message}</p>}
                  </div>

                  {/* Parent name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ota-onasi F.I.O</label>
                    <input className="input_field" placeholder="Karimov A." {...register('parentName')} disabled={submitting} />
                  </div>

                  {/* Address */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Manzil</label>
                    <textarea className="input_field" rows={2} placeholder="Toshkent sh., Chilonzor t." {...register('address')} disabled={submitting} />
                  </div>

                  {/* School */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Maktab / Universitet</label>
                    <input className="input_field" placeholder="81-maktab" {...register('school')} disabled={submitting} />
                  </div>

                  {/* Passport */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Pasport yoki JSHSHIR</label>
                    <input className="input_field" placeholder="AB1234567" {...register('passport')} disabled={submitting} />
                  </div>

                  {/* Course */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Kurs</label>
                    <select
                      className={`input_field ${errors.course ? 'input_error' : ''}`}
                      {...register('course', { required: 'Kurs majburiy' })}
                      disabled={submitting}
                    >
                      <option value="">Kursni tanlang</option>
                      {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.course && <p className="text-xs text-red-500 mt-1">{errors.course.message}</p>}
                  </div>

                  {/* Group */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Guruh</label>
                    <select className="input_field" {...register('groupId')} disabled={submitting || !selectedCourse}>
                      <option value="">Guruhni tanlang</option>
                      {filteredGroups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Start date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">O'qishni boshlagan sana</label>
                    <input type="date" className="input_field" {...register('startDate')} disabled={submitting} />
                  </div>

                  {/* Payment amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">To'lov summasi</label>
                    <input type="number" className="input_field" placeholder="500000" {...register('paymentAmount')} disabled={submitting} />
                  </div>

                  {/* Payment date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">To'lov sanasi</label>
                    <input type="date" className="input_field" {...register('paymentDate')} disabled={submitting} />
                  </div>

                  {/* Discount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Chegirma %</label>
                    <input
                      type="number"
                      className="input_field"
                      min={0}
                      max={100}
                      placeholder="0"
                      {...register('discount', { min: { value: 0, message: '0-100 oralig\'ida' }, max: { value: 100, message: '0-100 oralig\'ida' } })}
                      disabled={submitting}
                    />
                    {errors.discount && <p className="text-xs text-red-500 mt-1">{errors.discount.message}</p>}
                  </div>

                  {/* Telegram */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Telegram username</label>
                    <input className="input_field" placeholder="@username" {...register('telegram')} disabled={submitting} />
                  </div>

                  {/* Avatar */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Rasm</label>
                    <div className="flex items-center gap-4">
                      {avatarPreview ? (
                        <div className="relative">
                          <img src={avatarPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700" />
                          <button
                            type="button"
                            onClick={() => { setAvatarPreview(null); setAvatarFile(null) }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                          <Camera className="w-6 h-6" />
                        </div>
                      )}
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="btn_secondary text-sm">
                        Rasm tanlash
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </div>
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Izoh</label>
                  <textarea className="input_field" rows={2} placeholder="Qo'shimcha ma'lumot..." {...register('note')} disabled={submitting} />
                </div>

                {/* Medical info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tibbiy holati</label>
                  <textarea className="input_field" rows={2} placeholder="Agar mavjud bo'lsa..." {...register('medicalInfo')} disabled={submitting} />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="btn_secondary flex-1" disabled={submitting}>Bekor qilish</button>
                  <button type="submit" className="btn_primary flex-1" disabled={submitting}>
                    {submitting ? 'Saqlanmoqda...' : editingStudent ? 'Saqlash' : "Qo'shish"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <ConfirmModal
        open={!!confirmDelete}
        title="O'quvchini o'chirish"
        message={`${confirmDelete?.name} o'chirilsinmi?`}
        confirmText={deleting ? "O'chirilmoqda..." : "O'chirish"}
        danger
        onConfirm={handleDelete}
        onCancel={() => { if (!deleting) setConfirmDelete(null) }}
      />
    </div>
  )
}

function Field({ label, value, className = '' }) {
  return (
    <div className={className}>
      <span className="text-gray-400 dark:text-gray-500 text-xs block">{label}</span>
      <span className="text-gray-800 dark:text-gray-200 text-sm">{value || '—'}</span>
    </div>
  )
}
