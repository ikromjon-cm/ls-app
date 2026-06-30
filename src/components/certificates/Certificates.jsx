import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api'
import { motion } from 'framer-motion'
import { Plus, Award, Download, Search } from 'lucide-react'
import PageHeader from '../layout/PageHeader'

export default function Certificates() {
  const { user } = useAuth()
  const [list, setList] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ studentId: '', type: 'completion', issueDate: new Date().toISOString().split('T')[0], description: '' })

  const load = useCallback(async () => {
    try {
      const [certs, students] = await Promise.all([
        api.request('/certificates', {}),
        api.getStudents(),
      ])
      setList(Array.isArray(certs) ? certs : [])
      setStudents(Array.isArray(students) ? students : [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!form.studentId) return
    try {
      await api.request('/certificates', {
        method: 'POST',
        body: JSON.stringify({ ...form, studentId: Number(form.studentId) }),
      })
      setShowForm(false)
      setForm({ studentId: '', type: 'completion', issueDate: new Date().toISOString().split('T')[0], description: '' })
      load()
    } catch {}
  }

  const filtered = list.filter(c =>
    (c.studentName || '').toLowerCase().includes(search.toLowerCase())
  )

  const typeColors = { completion: 'green', achievement: 'yellow', participation: 'blue' }
  const borderColors = { completion: 'border-l-green-500', achievement: 'border-l-yellow-500', participation: 'border-l-blue-500' }
  const typeLabels = { completion: 'Tugallagan', achievement: 'Yutuq', participation: 'Ishtirok' }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sertifikatlar"
        subtitle="O'quvchilar uchun sertifikatlar va yutuqlar"
        actions={user.role !== 'parent' && user.role !== 'student' && (
          <button onClick={() => setShowForm(!showForm)} className="btn_primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Yangi sertifikat
          </button>
        )}
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="O'quvchi bo'yicha qidirish..." className="input_field pl-10" />
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">O'quvchi</label>
              <select value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} className="input_field">
                <option value="">O'quvchini tanlang</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Turi</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input_field">
                <option value="completion">Tugallagan</option>
                <option value="achievement">Yutuq</option>
                <option value="participation">Ishtirok</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sana</label>
              <input type="date" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })} className="input_field" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Tavsif</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="input_field" placeholder="Sertifikat haqida..." />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={create} className="btn_primary">Saqlash</button>
            <button onClick={() => setShowForm(false)} className="btn_secondary">Bekor qilish</button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Award className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">Sertifikatlar mavjud emas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c, i) => (
            <motion.div key={c.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`card group hover:shadow-md transition-all border-l-4 ${borderColors[c.type] || 'border-l-indigo-500'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                    <Award className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{c.studentName || 'N/A'}</h3>
                    <span className={`badge_${typeColors[c.type] || 'blue'} mt-1 inline-block`}>{typeLabels[c.type] || c.type}</span>
                    {c.description && <p className="text-xs text-gray-400 mt-2">{c.description}</p>}
                    <p className="text-xs text-gray-400 mt-1"><strong>Sana:</strong> {c.issueDate || ''}</p>
                    {c.certificateNumber && <p className="text-xs text-gray-400"><strong>№</strong> {c.certificateNumber}</p>}
                  </div>
                </div>
                <button className="p-1.5 text-gray-300 hover:text-primary-500 opacity-0 group-hover:opacity-100 transition-all">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
