import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api'
import { motion } from 'framer-motion'
import { Plus, Book, Download, Trash2, Search } from 'lucide-react'
import PageHeader from '../layout/PageHeader'

export default function Library() {
  const { user } = useAuth()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', author: '', category: '', description: '' })

  const load = useCallback(async () => {
    try {
      const data = await api.request('/library', {})
      setBooks(Array.isArray(data) ? data : [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!form.title) return
    try {
      await api.request('/library', { method: 'POST', body: JSON.stringify(form) })
      setShowForm(false)
      setForm({ title: '', author: '', category: '', description: '' })
      load()
    } catch {}
  }

  const remove = async (id) => {
    try { await api.request(`/library/${id}`, { method: 'DELETE' }); load() } catch {}
  }

  const filtered = books.filter(b =>
    (b.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.author || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kutubxona"
        subtitle="O'quv materiallari va kitoblar"
        actions={user.role !== 'parent' && user.role !== 'student' && (
          <button onClick={() => setShowForm(!showForm)} className="btn_primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Yangi kitob
          </button>
        )}
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Kitob yoki muallif bo'yicha qidirish..." className="input_field pl-10" />
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Kitob nomi</label>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input_field" placeholder="Kitob nomi" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Muallif</label>
              <input type="text" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} className="input_field" placeholder="Muallif ismi" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kategoriya</label>
              <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input_field" placeholder="Kategoriya" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Tavsif</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="input_field" placeholder="Qisqa tavsif..." />
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
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Book className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">Kitoblar mavjud emas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((book, i) => (
            <motion.div key={book.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="card group hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20">
                    <Book className="w-6 h-6 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{book.title}</h3>
                    {book.author && <p className="text-sm text-gray-500 mt-0.5">{book.author}</p>}
                    {book.category && <span className="badge_blue mt-1 inline-block">{book.category}</span>}
                    {book.description && <p className="text-xs text-gray-400 mt-2">{book.description}</p>}
                  </div>
                </div>
                {user.role !== 'parent' && user.role !== 'student' && (
                  <button onClick={() => remove(book.id)} className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {book.fileUrl && (
                <a href={book.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 mt-3 text-xs text-primary-500 hover:text-primary-600">
                  <Download className="w-3 h-3" /> Yuklab olish
                </a>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
