import { useState, useMemo, useEffect, useCallback } from 'react'
import { useApp } from '../../context/AppContext'
import { api } from '../../api'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, Edit3, Trash2, ChevronDown, ChevronUp,
  BookOpen, UserPlus, X, Users,
} from 'lucide-react'
import PageHeader from '../layout/PageHeader'
import ConfirmModal from '../ConfirmModal'

const COURSES = ['Frontend', 'Backend', 'Python', 'Mobile', 'Design', 'IELTS', 'SMM', 'English', 'Matematika', 'Fizika']
const DAYS_OPTIONS = [
  { label: 'Du', value: 'Dushanba' },
  { label: 'Se', value: 'Seshanba' },
  { label: 'Ch', value: 'Chorshanba' },
  { label: 'Pa', value: 'Payshanba' },
  { label: 'Ju', value: 'Juma' },
  { label: 'Sha', value: 'Shanba' },
  { label: 'Yak', value: 'Yakshanba' },
]
const STATUS_OPTIONS = [
  { label: 'Barchasi', value: '' },
  { label: 'Aktiv', value: 'active' },
  { label: 'Tugagan', value: 'completed' },
  { label: 'Muzlatilgan', value: 'frozen' },
]
const STATUS_MAP = { active: 'Aktiv', completed: 'Tugagan', frozen: 'Muzlatilgan' }
const STATUS_BADGE = {
  active: 'badge_green',
  completed: 'badge_blue',
  frozen: 'badge_yellow',
}

function toastStyle(type) {
  return type === 'success'
    ? 'bg-emerald-500 text-white'
    : type === 'error'
      ? 'bg-red-500 text-white'
      : 'bg-blue-500 text-white'
}

function Toast({ show, message, type, onClose }) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(onClose, 3000)
      return () => clearTimeout(t)
    }
  }, [show, onClose])
  if (!show) return null
  return (
    <div className="fixed top-20 right-4 z-[60] animate-bounce-in">
      <div className={`${toastStyle(type)} px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 ring-2 ring-offset-2 dark:ring-offset-gray-900 ring-white/50`}>
        <span className="font-medium text-sm sm:text-base">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70 font-bold text-lg leading-none">&times;</button>
      </div>
    </div>
  )
}

export default function Groups() {
  const { state, dispatch } = useApp()
  const { groups: rawGroups, students: allStudents } = state

  const [teachers, setTeachers] = useState([])
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [expandedId, setExpandedId] = useState(null)
  const [groupStudents, setGroupStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)

  const [inlineForm, setInlineForm] = useState({ groupId: null, name: '', phone: '' })
  const [addingStudent, setAddingStudent] = useState(false)

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type })
  }, [])
  const hideToast = useCallback(() => setToast(s => ({ ...s, show: false })), [])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      course: '',
      name: '',
      teacherId: '',
      startDate: '',
      endDate: '',
      days: [],
      time: '',
      room: '',
      maxStudents: '',
      price: '',
    },
  })

  const selectedDays = watch('days', [])

  useEffect(() => {
    api.getTeachers()
      .then(setTeachers)
      .catch(() => {})
  }, [])

  const openAddModal = () => {
    setEditingGroup(null)
    reset({
      course: '', name: '', teacherId: '', startDate: '', endDate: '',
      days: [], time: '', room: '', maxStudents: '', price: '',
    })
    setModalOpen(true)
  }

  const openEditModal = (group) => {
    setEditingGroup(group)
    const groupDays = group.days
      ? group.days.split(', ').map(d => d.trim())
      : []
    reset({
      course: group.course || '',
      name: group.name || '',
      teacherId: String(group.teacherId || ''),
      startDate: group.startDate || '',
      endDate: group.endDate || '',
      days: groupDays,
      time: group.time || '',
      room: group.room || '',
      maxStudents: String(group.maxStudents || ''),
      price: String(group.price || ''),
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    if (submitting) return
    setModalOpen(false)
    setEditingGroup(null)
  }

  const onSubmit = async (data) => {
    if (submitting) return
    setSubmitting(true)
    try {
      const payload = {
        ...data,
        teacherId: Number(data.teacherId),
        maxStudents: data.maxStudents ? Number(data.maxStudents) : undefined,
        price: Number(data.price),
        days: data.days.join(', '),
        teacherName: teachers.find(t => t.id === Number(data.teacherId))?.name || '',
      }

      if (editingGroup) {
        const updated = await api.updateGroup(editingGroup.id, payload)
        dispatch({ type: 'UPDATE_GROUP', group: updated })
        showToast('Guruh tahrirlandi')
      } else {
        const created = await api.createGroup(payload)
        dispatch({ type: 'ADD_GROUP', group: created })
        showToast('Guruh yaratildi')
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
      await api.deleteGroup(confirmDelete.id)
      dispatch({ type: 'DELETE_GROUP', id: confirmDelete.id })
      showToast('Guruh o\'chirildi')
      setConfirmDelete(null)
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const toggleExpand = async (groupId) => {
    if (expandedId === groupId) {
      setExpandedId(null)
      setGroupStudents([])
      return
    }
    setExpandedId(groupId)
    setLoadingStudents(true)
    try {
      const students = await api.getStudents({ groupId })
      setGroupStudents(students)
    } catch {
      setGroupStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }

  const handleAddStudent = async (groupId) => {
    if (!inlineForm.name.trim() || !inlineForm.phone.trim() || addingStudent) return
    setAddingStudent(true)
    try {
      await api.createStudent({
        name: inlineForm.name.trim(),
        phone: inlineForm.phone.trim(),
        groupId,
      })
      const updated = await api.getStudents({ groupId })
      setGroupStudents(updated)
      setInlineForm({ groupId: null, name: '', phone: '' })
      showToast('Talaba qo\'shildi')
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi', 'error')
    } finally {
      setAddingStudent(false)
    }
  }

  const filtered = useMemo(() => {
    let list = rawGroups || []
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        g =>
          g.name?.toLowerCase().includes(q) ||
          g.course?.toLowerCase().includes(q) ||
          g.teacherName?.toLowerCase().includes(q)
      )
    }
    if (courseFilter) list = list.filter(g => g.course === courseFilter)
    if (statusFilter) list = list.filter(g => g.status === statusFilter)
    return list
  }, [rawGroups, search, courseFilter, statusFilter])

  const courses = useMemo(() => {
    const set = new Set(COURSES)
    ;(rawGroups || []).forEach(g => { if (g.course) set.add(g.course) })
    return [...set]
  }, [rawGroups])

  return (
    <div className="space-y-6">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />

      <PageHeader
        title="Guruhlar"
        subtitle="Barcha guruhlarni boshqaring"
        actions={
          <button onClick={openAddModal} className="btn_primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Yangi guruh
          </button>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input_field pl-9"
            placeholder="Guruh nomi, kurs yoki o'qituvchi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input_field sm:w-44"
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
        >
          <option value="">Barcha kurslar</option>
          {courses.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          className="input_field sm:w-40"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Group cards */}
      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Guruhlar topilmadi</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Filtrni o'zgartiring yoki yangi guruh yarating</p>
          <button onClick={openAddModal} className="btn_primary">Guruh yaratish</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((group) => {
            const paid = allStudents.filter(
              s => s.groupId === group.id && s.paymentStatus === 'paid'
            ).length
            const debt = allStudents.filter(
              s => s.groupId === group.id && s.paymentStatus === 'debt'
            ).length
            const total = allStudents.filter(s => s.groupId === group.id).length
            const isExpanded = expandedId === group.id

            return (
              <motion.div
                key={group.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="card hover:shadow-lg transition-shadow duration-200 relative overflow-hidden group"
              >
                {/* Status badge */}
                <div className="absolute top-3 right-3">
                  <span className={STATUS_BADGE[group.status] || 'badge_blue'}>
                    {STATUS_MAP[group.status] || 'Aktiv'}
                  </span>
                </div>

                {/* Actions */}
                <div className="absolute top-3 right-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal(group) }}
                    className="w-8 h-8 bg-gray-100 dark:bg-gray-800 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-lg flex items-center justify-center text-gray-500 hover:text-primary-600 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(group) }}
                    className="w-8 h-8 bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Card body */}
                <div className="mb-3 pr-24">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{group.name}</h3>
                  <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mt-0.5">{group.course}</p>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1 mb-3">
                  <p>👨‍🏫 {group.teacherName || 'Belgilanmagan'}</p>
                  {group.days && <p>📅 {group.days}</p>}
                  {group.time && <p>⏰ {group.time}</p>}
                  {group.room && <p>🚪 {group.room}</p>}
                </div>

                {group.price != null && (
                  <div className="mb-3">
                    <span className="text-xs font-medium bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 px-2.5 py-1 rounded-full">
                      {new Intl.NumberFormat('uz-UZ').format(group.price)} so'm
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs mb-3">
                  <span className="text-gray-500 dark:text-gray-400">👥 {total} ta</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ {paid} to\'lagan</span>
                  <span className="text-red-600 dark:text-red-400 font-medium">⏳ {debt} qarzdor</span>
                </div>

                {/* Expand toggle */}
                <button
                  onClick={() => toggleExpand(group.id)}
                  className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium transition-colors"
                >
                  {isExpanded ? (
                    <>Yopish <ChevronUp className="w-3.5 h-3.5" /></>
                  ) : (
                    <>Talabalar <ChevronDown className="w-3.5 h-3.5" /></>
                  )}
                </button>

                {/* Expanded student list */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                        {loadingStudents ? (
                          <div className="flex items-center gap-2 py-3 text-sm text-gray-400">
                            <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                            Yuklanmoqda...
                          </div>
                        ) : groupStudents.length === 0 ? (
                          <p className="text-sm text-gray-400 py-2">Talabalar mavjud emas</p>
                        ) : (
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {groupStudents.map((s) => (
                              <div
                                key={s.id}
                                className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                      s.paymentStatus === 'paid' ? 'bg-emerald-500' : 'bg-red-500'
                                    }`}
                                  />
                                  <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{s.name}</span>
                                  <span className="text-xs text-gray-400">{s.phone}</span>
                                </div>
                                <span
                                  className={`text-xs font-medium ${
                                    s.paymentStatus === 'paid'
                                      ? 'text-emerald-500'
                                      : 'text-red-500'
                                  }`}
                                >
                                  {s.paymentStatus === 'paid' ? "To'lagan" : 'Qarzdor'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Inline add student */}
                        {inlineForm.groupId === group.id ? (
                          <div className="mt-3 flex items-center gap-2">
                            <input
                              className="input_field text-xs flex-1"
                              placeholder="Ism"
                              value={inlineForm.name}
                              onChange={(e) => setInlineForm(f => ({ ...f, name: e.target.value }))}
                            />
                            <input
                              className="input_field text-xs w-32"
                              placeholder="+998 XX XXX XX XX"
                              value={inlineForm.phone}
                              onChange={(e) => setInlineForm(f => ({ ...f, phone: e.target.value }))}
                            />
                            <button
                              onClick={() => handleAddStudent(group.id)}
                              disabled={addingStudent}
                              className="btn_primary text-xs px-3 py-2"
                            >
                              {addingStudent ? '...' : 'Qo\'shish'}
                            </button>
                            <button
                              onClick={() => setInlineForm({ groupId: null, name: '', phone: '' })}
                              className="p-2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setInlineForm({ groupId: group.id, name: '', phone: '' })}
                            className="mt-3 flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Talaba qo'shish
                          </button>
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
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingGroup ? 'Guruhni tahrirlash' : 'Yangi guruh yaratish'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none">
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Course */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Kurs</label>
                    <select
                      className={`input_field ${errors.course ? 'input_error' : ''}`}
                      {...register('course', { required: 'Kurs majburiy' })}
                      disabled={submitting}
                    >
                      <option value="">Kursni tanlang</option>
                      {courses.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {errors.course && <p className="text-xs text-red-500 mt-1">{errors.course.message}</p>}
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Guruh nomi</label>
                    <input
                      className={`input_field ${errors.name ? 'input_error' : ''}`}
                      placeholder="Frontend N11"
                      {...register('name', { required: 'Guruh nomi majburiy' })}
                      disabled={submitting}
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                  </div>

                  {/* Teacher */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">O'qituvchi</label>
                    <select
                      className={`input_field ${errors.teacherId ? 'input_error' : ''}`}
                      {...register('teacherId', { required: "O'qituvchi majburiy" })}
                      disabled={submitting}
                    >
                      <option value="">O'qituvchini tanlang</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    {errors.teacherId && <p className="text-xs text-red-500 mt-1">{errors.teacherId.message}</p>}
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Narxi (so'm)</label>
                    <input
                      type="number"
                      className={`input_field ${errors.price ? 'input_error' : ''}`}
                      placeholder="500000"
                      {...register('price', {
                        required: 'Narx majburiy',
                        min: { value: 1, message: 'Narx noto\'g\'ri' },
                      })}
                      disabled={submitting}
                    />
                    {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
                  </div>

                  {/* Start date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Boshlanish sanasi</label>
                    <input
                      type="date"
                      className={`input_field ${errors.startDate ? 'input_error' : ''}`}
                      {...register('startDate', { required: 'Boshlanish sanasi majburiy' })}
                      disabled={submitting}
                    />
                    {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate.message}</p>}
                  </div>

                  {/* End date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tugash sanasi</label>
                    <input
                      type="date"
                      className={`input_field ${errors.endDate ? 'input_error' : ''}`}
                      {...register('endDate', { required: 'Tugash sanasi majburiy' })}
                      disabled={submitting}
                    />
                    {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate.message}</p>}
                  </div>

                  {/* Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Vaqti</label>
                    <input
                      className={`input_field ${errors.time ? 'input_error' : ''}`}
                      placeholder="15:00 - 17:00"
                      {...register('time', { required: 'Vaqt majburiy' })}
                      disabled={submitting}
                    />
                    {errors.time && <p className="text-xs text-red-500 mt-1">{errors.time.message}</p>}
                  </div>

                  {/* Room */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Xona</label>
                    <input
                      className={`input_field ${errors.room ? 'input_error' : ''}`}
                      placeholder="301-xona"
                      {...register('room')}
                      disabled={submitting}
                    />
                  </div>

                  {/* Max students */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Maksimal talabalar</label>
                    <input
                      type="number"
                      className={`input_field ${errors.maxStudents ? 'input_error' : ''}`}
                      placeholder="15"
                      {...register('maxStudents', {
                        min: { value: 1, message: 'Kamida 1 talaba' },
                      })}
                      disabled={submitting}
                    />
                    {errors.maxStudents && <p className="text-xs text-red-500 mt-1">{errors.maxStudents.message}</p>}
                  </div>
                </div>

                {/* Days checkboxes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dars kunlari</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OPTIONS.map((d) => {
                      const checked = selectedDays.includes(d.value)
                      return (
                        <label
                          key={d.value}
                          className={`cursor-pointer select-none px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                            checked
                              ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-400 text-primary-700 dark:text-primary-300'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            value={d.value}
                            className="hidden"
                            {...register('days', {
                              validate: (v) => v.length > 0 || 'Kamida 1 kun tanlang',
                            })}
                          />
                          {d.label}
                        </label>
                      )
                    })}
                  </div>
                  {errors.days && <p className="text-xs text-red-500 mt-1">{errors.days.message}</p>}
                </div>

                {/* Submit buttons */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="btn_secondary flex-1" disabled={submitting}>
                    Bekor qilish
                  </button>
                  <button type="submit" className="btn_primary flex-1" disabled={submitting}>
                    {submitting ? 'Saqlanmoqda...' : editingGroup ? 'Saqlash' : 'Yaratish'}
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
        title="Guruhni o'chirish"
        message={`"${confirmDelete?.name}" guruhi va undagi barcha talabalar o'chiriladi.`}
        confirmText={deleting ? "O'chirilmoqda..." : "O'chirish"}
        danger
        onConfirm={handleDelete}
        onCancel={() => { if (!deleting) setConfirmDelete(null) }}
      />
    </div>
  )
}
