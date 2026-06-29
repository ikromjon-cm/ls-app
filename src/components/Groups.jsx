import { useState } from 'react'
import { useApp } from '../context/AppContext'
import ConfirmModal from './ConfirmModal'

const emptyForm = { name: '', teacher: '', price: '', days: '', time: '' }

export default function Groups() {
  const { state, actions } = useApp()
  const { groups } = state
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [editingGroup, setEditingGroup] = useState(null)

  const [showStudentForm, setShowStudentForm] = useState(null)
  const [studentForm, setStudentForm] = useState({ name: '', phone: '' })
  const [studentErrors, setStudentErrors] = useState({})
  const [editingStudent, setEditingStudent] = useState(null)

  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmDeleteStudent, setConfirmDeleteStudent] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Guruh nomi majburiy'
    if (!form.teacher.trim()) errs.teacher = "O'qituvchi ismi majburiy"
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) errs.price = 'Narx notog\'ri'
    if (!form.days.trim()) errs.days = 'Kunlar majburiy'
    if (!form.time.trim()) errs.time = 'Vaqt majburiy'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const openAddForm = () => {
    setEditingGroup(null)
    setForm(emptyForm)
    setErrors({})
    setShowForm(true)
  }

  const openEditForm = (group) => {
    setEditingGroup(group)
    setForm({
      name: group.name,
      teacher: group.teacher,
      price: String(group.price),
      days: group.days,
      time: group.time,
    })
    setErrors({})
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate() || submitting) return
    setSubmitting(true)
    try {
      const data = {
        name: form.name.trim(),
        teacher: form.teacher.trim(),
        price: Number(form.price),
        days: form.days.trim(),
        time: form.time.trim(),
      }
      if (editingGroup) {
        await actions.updateGroup(editingGroup.id, data)
      } else {
        await actions.addGroup(data)
      }
      setForm(emptyForm)
      setEditingGroup(null)
      setShowForm(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteGroup = async () => {
    if (!confirmDelete || submitting) return
    setSubmitting(true)
    try {
      await actions.deleteGroup(confirmDelete.id)
      setConfirmDelete(null)
    } finally {
      setSubmitting(false)
    }
  }

  const validateStudent = () => {
    const errs = {}
    if (!studentForm.name.trim()) errs.name = 'Ism majburiy'
    if (!studentForm.phone.trim()) errs.phone = 'Telefon majburiy'
    else if (!/^\+998\d{9}$/.test(studentForm.phone.trim())) errs.phone = 'Format: +998 XX XXX XX XX'
    setStudentErrors(errs)
    return Object.keys(errs).length === 0
  }

  const openAddStudent = (groupId) => {
    setEditingStudent(null)
    setStudentForm({ name: '', phone: '' })
    setStudentErrors({})
    setShowStudentForm(groupId)
  }

  const openEditStudent = (group, student) => {
    setEditingStudent(student)
    setStudentForm({ name: student.name, phone: student.phone })
    setStudentErrors({})
    setShowStudentForm(group.id)
  }

  const handleStudentSubmit = async (groupId) => {
    if (!validateStudent() || submitting) return
    setSubmitting(true)
    try {
      const data = { name: studentForm.name.trim(), phone: studentForm.phone.trim() }
      if (editingStudent) {
        await actions.updateStudent(editingStudent.id, data)
      } else {
        await actions.addStudent(groupId, data)
      }
      setStudentForm({ name: '', phone: '' })
      setEditingStudent(null)
      setShowStudentForm(null)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteStudent = async () => {
    if (!confirmDeleteStudent || submitting) return
    setSubmitting(true)
    try {
      await actions.deleteStudent(confirmDeleteStudent.id)
      setConfirmDeleteStudent(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="section_title">Guruhlar</h1>
          <p className="section_subtitle">Barcha guruhlarni boshqaring</p>
        </div>
        <button onClick={openAddForm} className="btn_primary flex items-center gap-2 self-start" disabled={submitting}>
          <span className="text-lg leading-none">+</span>
          Yangi guruh
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="card text-center py-16">
          <span className="text-6xl block mb-4">📚</span>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Hali guruhlar mavjud emas</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Birinchi guruhni yaratish orqali boshlang!</p>
          <button onClick={openAddForm} className="btn_primary">Guruh yaratish</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => {
            const paid = group.students.filter((s) => s.paymentStatus === 'paid').length
            const debtors = group.students.filter((s) => s.paymentStatus === 'debt').length
            return (
              <div key={group.id} className="card hover:shadow-md transition-shadow duration-200 relative group/card">
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditForm(group)}
                    className="w-8 h-8 bg-gray-100 dark:bg-gray-800 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-lg flex items-center justify-center text-gray-500 hover:text-primary-600 dark:text-gray-400 transition-colors"
                    title="Tahrirlash"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setConfirmDelete(group)}
                    className="w-8 h-8 bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-600 dark:text-gray-400 transition-colors"
                    title="O'chirish"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg pr-16">{group.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">👨‍🏫 {group.teacher}</p>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 px-2.5 py-1 rounded-full">
                    {new Intl.NumberFormat('uz-UZ').format(group.price)} so'm
                  </span>
                </div>

                <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <p>📅 {group.days}</p>
                  <p>⏰ {group.time}</p>
                  <p>👥 {group.students.length} ta o'quvchi</p>
                </div>

                <div className="flex items-center gap-3 text-xs mb-4">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">✅ {paid} to\'lagan</span>
                  <span className="text-red-600 dark:text-red-400 font-medium">⏳ {debtors} qarzdor</span>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                  <button
                    onClick={() => openAddStudent(group.id)}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950 px-3 py-1.5 rounded-lg transition-colors font-medium w-full text-left"
                  >
                    + Talaba qo'shish
                  </button>

                  {group.students.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {group.students.map((s) => (
                        <div key={s.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 group/student">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.paymentStatus === 'paid' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{s.name}</span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover/student:opacity-100 transition-opacity flex-shrink-0">
                            <button
                              onClick={() => openEditStudent(group, s)}
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-primary-500"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setConfirmDeleteStudent(s)}
                              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => { if (!submitting) { setShowForm(false); setEditingGroup(null) } }}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 md:p-8 animate-bounce-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingGroup ? "Guruhni tahrirlash" : 'Yangi guruh yaratish'}
              </h2>
              <button onClick={() => { if (!submitting) { setShowForm(false); setEditingGroup(null) } }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Kurs nomi</label>
                <input className={`input_field ${errors.name ? 'input_error' : ''}`} placeholder="Frontend" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={submitting} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">O'qituvchi</label>
                <input className={`input_field ${errors.teacher ? 'input_error' : ''}`} placeholder="Sardorov S." value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} disabled={submitting} />
                {errors.teacher && <p className="text-xs text-red-500 mt-1">{errors.teacher}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Narxi (so'm)</label>
                <input type="number" className={`input_field ${errors.price ? 'input_error' : ''}`} placeholder="500000" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} disabled={submitting} />
                {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Kunlari</label>
                  <input className={`input_field ${errors.days ? 'input_error' : ''}`} placeholder="Dushanba / Chorshanba" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} disabled={submitting} />
                  {errors.days && <p className="text-xs text-red-500 mt-1">{errors.days}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Vaqti</label>
                  <input className={`input_field ${errors.time ? 'input_error' : ''}`} placeholder="15:00 - 17:00" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} disabled={submitting} />
                  {errors.time && <p className="text-xs text-red-500 mt-1">{errors.time}</p>}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { if (!submitting) { setShowForm(false); setEditingGroup(null) } }} className="btn_secondary flex-1" disabled={submitting}>Bekor qilish</button>
                <button type="submit" className="btn_primary flex-1" disabled={submitting}>
                  {submitting ? 'Saqlanmoqda...' : editingGroup ? 'Saqlash' : 'Yaratish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStudentForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => { if (!submitting) { setShowStudentForm(null); setEditingStudent(null) } }}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-bounce-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {editingStudent ? "Talabani tahrirlash" : 'Yangi talaba qo\'shish'}
            </h3>
            <div className="space-y-3">
              <div>
                <input className={`input_field text-sm ${studentErrors.name ? 'input_error' : ''}`} placeholder="Ism" value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} disabled={submitting} />
                {studentErrors.name && <p className="text-xs text-red-500 mt-1">{studentErrors.name}</p>}
              </div>
              <div>
                <input className={`input_field text-sm ${studentErrors.phone ? 'input_error' : ''}`} placeholder="+998 XX XXX XX XX" value={studentForm.phone} onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })} disabled={submitting} />
                {studentErrors.phone && <p className="text-xs text-red-500 mt-1">{studentErrors.phone}</p>}
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => { if (!submitting) { setShowStudentForm(null); setEditingStudent(null) } }} className="btn_secondary flex-1 text-sm" disabled={submitting}>Bekor qilish</button>
                <button onClick={() => handleStudentSubmit(showStudentForm)} className="btn_primary flex-1 text-sm" disabled={submitting}>
                  {submitting ? 'Saqlanmoqda...' : editingStudent ? 'Saqlash' : "Qo'shish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title="Guruhni o'chirish"
        message={`"${confirmDelete?.name}" guruhi va undagi barcha talabalar o'chiriladi.`}
        confirmText={submitting ? 'O\'chirilmoqda...' : "O'chirish"}
        danger={true}
        onConfirm={handleDeleteGroup}
        onCancel={() => { if (!submitting) setConfirmDelete(null) }}
      />

      <ConfirmModal
        open={!!confirmDeleteStudent}
        title="Talabani o'chirish"
        message={`${confirmDeleteStudent?.name} o'chirilsinmi?`}
        confirmText={submitting ? 'O\'chirilmoqda...' : "O'chirish"}
        danger={true}
        onConfirm={handleDeleteStudent}
        onCancel={() => { if (!submitting) setConfirmDeleteStudent(null) }}
      />
    </div>
  )
}
