import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api'
import { motion } from 'framer-motion'
import { Plus, ClipboardList, CheckCircle, XCircle, Clock } from 'lucide-react'
import PageHeader from '../layout/PageHeader'

export default function Exams() {
  const { user } = useAuth()
  const [exams, setExams] = useState([])
  const [results, setResults] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('exams')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ groupId: '', title: '', date: '', maxScore: '' })

  const load = useCallback(async () => {
    try {
      const [e, r, g] = await Promise.all([
        api.request('/exams', {}),
        api.request('/exam-results', {}),
        api.getGroups(),
      ])
      setExams(Array.isArray(e) ? e : [])
      setResults(Array.isArray(r) ? r : [])
      setGroups(Array.isArray(g) ? g : [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!form.title || !form.date) return
    try {
      await api.request('/exams', {
        method: 'POST',
        body: JSON.stringify({ ...form, groupId: Number(form.groupId), maxScore: Number(form.maxScore) }),
      })
      setShowForm(false)
      setForm({ groupId: '', title: '', date: '', maxScore: '' })
      load()
    } catch {}
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Imtihonlar"
        subtitle="Imtihonlar va natijalarni boshqarish"
        actions={user.role !== 'parent' && user.role !== 'student' && (
          <button onClick={() => setShowForm(!showForm)} className="btn_primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Yangi imtihon
          </button>
        )}
      />

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {['exams', 'results'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            tab === t ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}>
            {t === 'exams' ? 'Imtihonlar' : 'Natijalar'}
          </button>
        ))}
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Guruh</label>
              <select value={form.groupId} onChange={e => setForm({ ...form, groupId: e.target.value })} className="input_field">
                <option value="">Guruhni tanlang</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sana</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input_field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Imtihon nomi</label>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input_field" placeholder="Imtihon nomi" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Maksimal ball</label>
              <input type="number" value={form.maxScore} onChange={e => setForm({ ...form, maxScore: e.target.value })} className="input_field" placeholder="100" />
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
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      ) : tab === 'exams' ? (
        exams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <ClipboardList className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">Imtihonlar mavjud emas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exams.map((exam, i) => (
              <motion.div key={exam.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="card flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20">
                    <ClipboardList className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{exam.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{exam.date || 'N/A'}</span>
                      <span>Max: {exam.maxScore || 100} ball</span>
                    </div>
                  </div>
                </div>
                <span className="badge_blue">{results.filter(r => r.examId === exam.id).length} ta natija</span>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <CheckCircle className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">Natijalar mavjud emas</p>
          </div>
        ) : (
          <div className="card !p-0 overflow-hidden">
            <table className="table_base">
              <thead>
                <tr>
                  <th>Imtihon</th>
                  <th>O'quvchi</th>
                  <th>Ball</th>
                  <th>Holat</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const exam = exams.find(e => e.id === r.examId)
                  const passed = r.score >= (exam?.maxScore || 100) * 0.6
                  return (
                    <tr key={r.id || i}>
                      <td className="font-medium">{exam?.title || 'N/A'}</td>
                      <td>{r.studentName || 'N/A'}</td>
                      <td><span className="font-bold">{r.score}/{exam?.maxScore || 100}</span></td>
                      <td>{passed ? <span className="badge_green flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" />O'tdi</span> : <span className="badge_red flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" />Yiqildi</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
