import { useState, useMemo, useEffect, useCallback } from 'react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Edit3, Trash2, Users, Phone, User,
  BookOpen, LogIn, Key, X, Search,
} from 'lucide-react'
import PageHeader from '../layout/PageHeader'
import ConfirmModal from '../common/ConfirmModal'

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

export default function Teachers() {
  const { state, dispatch } = useApp()
  const { hasRole } = useAuth()
  const { groups } = state

  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const showToast = useCallback((message, type = 'success') => setToast({ show: true, message, type }), [])
  const hideToast = useCallback(() => setToast(s => ({ ...s, show: false })), [])

  const [formLogin, setFormLogin] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formErrors, setFormErrors] = useState({})

  const [expandedTeacher, setExpandedTeacher] = useState(null)

  const loadTeachers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getTeachers()
      setTeachers(data || [])
    } catch {
      setTeachers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTeachers() }, [loadTeachers])

  if (!hasRole('admin', 'superadmin')) {
    return (
      <div className="card text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Ruxsat yo'q</h3>
        <p className="text-gray-500 dark:text-gray-400">Bu sahifaga faqat admin va superadminlar kirishi mumkin</p>
      </div>
    )
  }

  const filteredTeachers = useMemo(() => {
    if (!search.trim()) return teachers
    const q = search.toLowerCase()
    return teachers.filter(t =>
      t.name?.toLowerCase().includes(q) ||
      t.login?.toLowerCase().includes(q) ||
      t.phone?.includes(q)
    )
  }, [teachers, search])

  function validateForm() {
    const errs = {}
    if (!formName.trim()) errs.name = 'Ism majburiy'
    if (!formLogin.trim()) errs.login = 'Login majburiy'
    else if (formLogin.trim().length < 3) errs.login = 'Login kamida 3 belgi'
    if (!editingTeacher && !formPassword.trim()) errs.password = 'Parol majburiy'
    if (editingTeacher && formPassword && formPassword.trim().length < 4 && formPassword.trim().length > 0) {
      errs.password = 'Parol kamida 4 belgi'
    }
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  function openAddModal() {
    setEditingTeacher(null)
    setFormLogin('')
    setFormPassword('')
    setFormName('')
    setFormPhone('')
    setFormErrors({})
    setModalOpen(true)
  }

  function openEditModal(teacher) {
    setEditingTeacher(teacher)
    setFormLogin(teacher.login || '')
    setFormPassword('')
    setFormName(teacher.name || '')
    setFormPhone(teacher.phone || '')
    setFormErrors({})
    setModalOpen(true)
  }

  function closeModal() {
    if (submitting) return
    setModalOpen(false)
    setEditingTeacher(null)
  }

  async function handleFormSubmit(e) {
    e.preventDefault()
    if (!validateForm() || submitting) return
    setSubmitting(true)
    try {
      const payload = {
        login: formLogin.trim(),
        name: formName.trim(),
        phone: formPhone.trim(),
        role: 'teacher',
      }
      if (formPassword.trim()) payload.password = formPassword.trim()

      if (editingTeacher) {
        const updated = await api.updateUser(editingTeacher.id, payload)
        setTeachers(prev => prev.map(t => t.id === updated.id ? updated : t))
        showToast("O'qituvchi tahrirlandi")
      } else {
        const created = await api.createUser(payload)
        setTeachers(prev => [...prev, created])
        showToast("O'qituvchi qo'shildi")
      }
      closeModal()
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete || deleting) return
    setDeleting(true)
    try {
      await api.deleteUser(confirmDelete.id)
      setTeachers(prev => prev.filter(t => t.id !== confirmDelete.id))
      showToast("O'qituvchi o'chirildi")
      setConfirmDelete(null)
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const teacherGroupMap = useMemo(() => {
    const m = {}
    groups.forEach(g => {
      const teacherId = g.teacherId
      if (teacherId) {
        if (!m[teacherId]) m[teacherId] = []
        m[teacherId].push(g)
      }
    })
    return m
  }, [groups])

  return (
    <div className="space-y-6">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />

      <PageHeader
        title="O'qituvchilar"
        subtitle="Barcha o'qituvchilar ro'yxati"
        actions={
          <button onClick={openAddModal} className="btn_primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Yangi o'qituvchi
          </button>
        }
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="input_field pl-9"
          placeholder="Ism, login yoki telefon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Teacher list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full skeleton" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 skeleton w-3/4" />
                  <div className="h-3 skeleton w-1/2" />
                </div>
              </div>
              <div className="h-3 skeleton w-1/3" />
            </div>
          ))}
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="card text-center py-16">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {search ? 'O\'qituvchilar topilmadi' : 'Hali o\'qituvchilar mavjud emas'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {search ? 'Qidiruvni o\'zgartiring' : 'Birinchi o\'qituvchini qo\'shing'}
          </p>
          {!search && (
            <button onClick={openAddModal} className="btn_primary">O'qituvchi qo'shish</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map((teacher) => {
            const tGroups = teacherGroupMap[teacher.id] || []
            const isExpanded = expandedTeacher === teacher.id

            return (
              <motion.div
                key={teacher.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="card hover:shadow-lg transition-shadow duration-200 relative overflow-hidden group"
              >
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal(teacher) }}
                    className="w-8 h-8 bg-gray-100 dark:bg-gray-800 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-lg flex items-center justify-center text-gray-500 hover:text-primary-600 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(teacher) }}
                    className="w-8 h-8 bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-start gap-4 mb-4 pr-16">
                  <div className={`w-14 h-14 rounded-full ${getAvatarColor(teacher.name)} flex items-center justify-center text-white font-bold text-xl flex-shrink-0`}>
                    {teacher.name ? teacher.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate">{teacher.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                      <LogIn className="w-3.5 h-3.5" />
                      {teacher.login}
                    </p>
                    {teacher.phone && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3.5 h-3.5" />
                        {teacher.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <BookOpen className="w-4 h-4" />
                  <span>{tGroups.length} ta guruh</span>
                </div>

                <button
                  onClick={() => setExpandedTeacher(isExpanded ? null : teacher.id)}
                  className="mt-3 flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium transition-colors"
                >
                  {isExpanded ? 'Yopish' : 'Guruhlar'}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                        {tGroups.length === 0 ? (
                          <p className="text-xs text-gray-400 py-2">Guruhlar mavjud emas</p>
                        ) : (
                          <div className="space-y-1">
                            {tGroups.map(g => (
                              <div key={g.id} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                                <div>
                                  <p className="font-medium text-gray-700 dark:text-gray-300">{g.name}</p>
                                  <p className="text-gray-400">{g.course} | {g.students?.length || 0} ta o'quvchi</p>
                                </div>
                                <span className="text-gray-400">{g.days} {g.time}</span>
                              </div>
                            ))}
                          </div>
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
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 md:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingTeacher ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi qo'shish"}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none">&times;</button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Login *</label>
                  <input
                    className={`input_field ${formErrors.login ? 'input_error' : ''}`}
                    placeholder="teacher_login"
                    value={formLogin}
                    onChange={(e) => setFormLogin(e.target.value)}
                    disabled={submitting}
                  />
                  {formErrors.login && <p className="text-xs text-red-500 mt-1">{formErrors.login}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Parol {editingTeacher ? "(agar o'zgartirmoqchi bo'lsangiz)" : '*'}
                  </label>
                  <input
                    type="password"
                    className={`input_field ${formErrors.password ? 'input_error' : ''}`}
                    placeholder={editingTeacher ? "Yangi parol (ixtiyoriy)" : 'Parol'}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    disabled={submitting}
                    autoComplete="new-password"
                  />
                  {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ism Familiya *</label>
                  <input
                    className={`input_field ${formErrors.name ? 'input_error' : ''}`}
                    placeholder="Sardor Abdurahmonov"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    disabled={submitting}
                  />
                  {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Telefon</label>
                  <input
                    className="input_field"
                    placeholder="+998901234567"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="btn_secondary flex-1" disabled={submitting}>Bekor qilish</button>
                  <button type="submit" className="btn_primary flex-1" disabled={submitting}>
                    {submitting ? 'Saqlanmoqda...' : editingTeacher ? 'Saqlash' : "Qo'shish"}
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
        title="O'qituvchini o'chirish"
        message={`"${confirmDelete?.name}" o'qituvchisi o'chirilsinmi?`}
        confirmText={deleting ? "O'chirilmoqda..." : "O'chirish"}
        danger
        onConfirm={handleDelete}
        onCancel={() => { if (!deleting) setConfirmDelete(null) }}
      />
    </div>
  )
}
