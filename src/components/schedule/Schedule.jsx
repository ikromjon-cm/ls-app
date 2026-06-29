import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api'
import { motion } from 'framer-motion'
import { Plus, Calendar, Clock, MapPin, Trash2 } from 'lucide-react'
import PageHeader from '../layout/PageHeader'

const DAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"]

export default function Schedule() {
  const { user } = useAuth()
  const [schedule, setSchedule] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterGroup, setFilterGroup] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ groupId: '', day: '', time: '', subject: '', teacher: '', room: '' })

  const load = useCallback(async () => {
    try {
      const params = filterGroup ? { groupId: filterGroup } : {}
      const [sch, grp] = await Promise.all([api.request(`/schedule?${new URLSearchParams(params)}`, {}), api.getGroups()])
      setSchedule(Array.isArray(sch) ? sch : [])
      setGroups(Array.isArray(grp) ? grp : [])
    } catch {} finally { setLoading(false) }
  }, [filterGroup])

  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!form.groupId || !form.day || !form.time || !form.subject) return
    try {
      await api.request('/schedule', {
        method: 'POST',
        body: JSON.stringify({ ...form, groupId: Number(form.groupId) }),
      })
      setShowForm(false)
      setForm({ groupId: '', day: '', time: '', subject: '', teacher: '', room: '' })
      load()
    } catch {}
  }

  const remove = async (id) => {
    try { await api.request(`/schedule/${id}`, { method: 'DELETE' }); load() } catch {}
  }

  const grouped = {}
  for (const day of DAYS) grouped[day] = []
  for (const s of schedule) {
    if (grouped[s.day]) grouped[s.day].push(s)
  }
  for (const day of DAYS) {
    grouped[day].sort((a, b) => (a.time || '').localeCompare(b.time || ''))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dars jadvali"
        subtitle="Guruhlar bo'yicha dars jadvalini boshqarish"
        actions={user.role !== 'parent' && user.role !== 'student' && (
          <button onClick={() => setShowForm(!showForm)} className="btn_primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Yangi dars
          </button>
        )}
      />

      <div className="flex gap-3 items-center">
        <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)} className="input_field max-w-xs">
          <option value="">Barcha guruhlar</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <span className="text-sm text-gray-400">{schedule.length} ta dars</span>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Guruh</label>
              <select value={form.groupId} onChange={e => setForm({ ...form, groupId: e.target.value })} className="input_field">
                <option value="">Guruhni tanlang</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kun</label>
              <select value={form.day} onChange={e => setForm({ ...form, day: e.target.value })} className="input_field">
                <option value="">Kunni tanlang</option>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vaqt</label>
              <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="input_field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fan</label>
              <input type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Fan nomi" className="input_field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">O'qituvchi</label>
              <input type="text" value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })} placeholder="O'qituvchi ismi" className="input_field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Xona</label>
              <input type="text" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} placeholder="Xona raqami" className="input_field" />
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
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {DAYS.map(day => {
            const lessons = grouped[day] || []
            return (
              <div key={day} className="card">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary-500" /> {day}
                </h3>
                {lessons.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">Darslar mavjud emas</p>
                ) : (
                  <div className="space-y-2">
                    {lessons.map((s, i) => (
                      <div key={s.id || i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 group">
                        <div className="text-center shrink-0">
                          <p className="text-sm font-bold text-primary-500">{s.time || '--:--'}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{s.subject}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            {s.teacher && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.teacher}</span>}
                            {s.room && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.room}</span>}
                          </div>
                        </div>
                        {user.role !== 'parent' && user.role !== 'student' && (
                          <button onClick={() => remove(s.id)} className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
