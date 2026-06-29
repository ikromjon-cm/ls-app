import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api'
import { motion } from 'framer-motion'
import { Plus, BookOpen, Calendar, Clock, Trash2, FileText } from 'lucide-react'
import PageHeader from '../layout/PageHeader'

export default function Homework() {
  const { user } = useAuth()
  const [homework, setHomework] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ groupId: '', title: '', description: '', deadline: '' })

  const load = useCallback(async () => {
    try {
      const [hw, grp] = await Promise.all([api.request('/homework', {}), api.getGroups()])
      setHomework(Array.isArray(hw) ? hw : [])
      setGroups(Array.isArray(grp) ? grp : [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!form.title || !form.deadline) return
    try {
      await api.request('/homework', {
        method: 'POST',
        body: JSON.stringify({ ...form, groupId: Number(form.groupId) }),
      })
      setShowForm(false)
      setForm({ groupId: '', title: '', description: '', deadline: '' })
      load()
    } catch {}
  }

  const remove = async (id) => {
    try { await api.request(`/homework/${id}`, { method: 'DELETE' }); load() } catch {}
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Topshiriqlar"
        subtitle="Uy vazifalari va topshiriqlarni boshqarish"
        actions={user.role !== 'parent' && (
          <button onClick={() => setShowForm(!showForm)} className="btn_primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Yangi topshiriq
          </button>
        )}
      />

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Guruh</label>
              <select value={form.groupId} onChange={e => setForm({ ...form, groupId: e.target.value })} className="input_field">
                <option value="">Guruhni tanlang</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sana</label>
              <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} className="input_field" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mavzu</label>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Topshiriq mavzusi" className="input_field" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tavsif</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Topshiriq tavsifi..." className="input_field" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={create} className="btn_primary">Saqlash</button>
            <button onClick={() => setShowForm(false)} className="btn_secondary">Bekor qilish</button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      ) : homework.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <BookOpen className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">Topshiriqlar mavjud emas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {homework.map((hw, i) => (
            <motion.div
              key={hw.id || i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20">
                    <FileText className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{hw.title}</h3>
                    {hw.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{hw.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {hw.deadline || 'N/A'}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {hw.createdAt ? new Date(hw.createdAt).toLocaleDateString('uz-UZ') : ''}</span>
                    </div>
                  </div>
                </div>
                {user.role !== 'parent' && user.role !== 'student' && (
                  <button onClick={() => remove(hw.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
