import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api'
import { motion } from 'framer-motion'
import { Plus, Award, Search, TrendingUp } from 'lucide-react'
import PageHeader from '../layout/PageHeader'

export default function Grades() {
  const { user } = useAuth()
  const [grades, setGrades] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ studentId: '', subject: '', grade: '' })

  const load = useCallback(async () => {
    try {
      const [g, s] = await Promise.all([api.request('/grades', {}), api.getStudents({})])
      setGrades(Array.isArray(g) ? g : [])
      const studentsArr = Array.isArray(s) ? s : []
      setStudents(studentsArr)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!form.studentId || !form.subject || !form.grade) return
    try {
      await api.request('/grades', {
        method: 'POST',
        body: JSON.stringify({ ...form, studentId: Number(form.studentId), grade: Number(form.grade) }),
      })
      setShowForm(false)
      setForm({ studentId: '', subject: '', grade: '' })
      load()
    } catch {}
  }

  const filtered = grades.filter(g => {
    const s = students.find(st => st.id === g.studentId)
    return (s?.name || '').toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Baholar"
        subtitle="O'quvchilar baholarini boshqarish"
        actions={user.role !== 'parent' && user.role !== 'student' && (
          <button onClick={() => setShowForm(!showForm)} className="btn_primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Yangi baho
          </button>
        )}
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="O'quvchi bo'yicha qidirish..." className="input_field pl-10" />
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">O'quvchi</label>
              <select value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} className="input_field">
                <option value="">O'quvchini tanlang</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fan</label>
              <input type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Fan nomi" className="input_field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Baho</label>
              <input type="number" min="1" max="5" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} placeholder="1-5" className="input_field" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={create} className="btn_primary">Saqlash</button>
            <button onClick={() => setShowForm(false)} className="btn_secondary">Bekor qilish</button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Award className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">Baholar mavjud emas</p>
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table_base">
              <thead>
                <tr>
                  <th>O'quvchi</th>
                  <th>Fan</th>
                  <th>Baho</th>
                  <th>Sana</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g, i) => {
                  const s = students.find(st => st.id === g.studentId)
                  return (
                    <motion.tr
                      key={g.id || i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <td className="font-medium">{s?.name || 'Noma\'lum'}</td>
                      <td>{g.subject}</td>
                      <td>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          g.grade >= 4 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                          g.grade >= 3 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          <TrendingUp className="w-3 h-3" /> {g.grade}
                        </span>
                      </td>
                      <td className="text-gray-400 text-xs">{g.createdAt ? new Date(g.createdAt).toLocaleDateString('uz-UZ') : ''}</td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
