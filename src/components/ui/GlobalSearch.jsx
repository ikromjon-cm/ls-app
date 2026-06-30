import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Users, GraduationCap, CreditCard, MessageSquare, X, ArrowRight, Loader2 } from 'lucide-react'
import { api } from '../../api'
import { useDebounce } from '../../hooks'

export default function GlobalSearch({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ students: [], groups: [], payments: [], messages: [] })
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const inputRef = useRef(null)

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50) }, [open])
  useEffect(() => { if (!open) setQuery('') }, [open])

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) { setResults({ students: [], groups: [], payments: [], messages: [] }); return }
    setLoading(true)
    const controller = new AbortController()
    Promise.all([
      api.request(`/students?search=${encodeURIComponent(debouncedQuery)}`, { signal: controller.signal }).catch(() => []),
      api.request('/groups', { signal: controller.signal }).catch(() => []),
      api.request('/payments', { signal: controller.signal }).catch(() => []),
      api.request('/messages', { signal: controller.signal }).catch(() => []),
    ]).then(([students, groups, payments, messages]) => {
      const q = debouncedQuery.toLowerCase()
      setResults({
        students: Array.isArray(students) ? students.filter(s => s.name?.toLowerCase().includes(q) || s.phone?.includes(q)) : [],
        groups: Array.isArray(groups) ? groups.filter(g => g.name?.toLowerCase().includes(q)) : [],
        payments: Array.isArray(payments) ? payments.filter(p => p.studentName?.toLowerCase().includes(q)) : [],
        messages: Array.isArray(messages) ? messages.filter(m => m.content?.toLowerCase().includes(q)) : [],
      })
    }).finally(() => setLoading(false))
    return () => controller.abort()
  }, [debouncedQuery])

  const totalResults = results.students.length + results.groups.length + results.payments.length + results.messages.length

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[10vh]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.97 }}
            className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[70vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="O'quvchi, guruh, to'lov yoki xabarlarni qidiring..."
                className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
              />
              {loading && <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />}
              <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {!debouncedQuery || debouncedQuery.length < 2 ? (
                <div className="text-center py-12 text-gray-400">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Qidirish uchun kamida 2 ta belgi kiriting</p>
                </div>
              ) : totalResults === 0 && !loading ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm">"{debouncedQuery}" bo'yicha natija topilmadi</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {results.students.length > 0 && (
                    <Section title="O'quvchilar" icon={GraduationCap} items={results.students.slice(0, 5)} render={s => ({ label: s.name, sub: `${s.phone || ''} | ${s.groupName || ''}`, id: s.id })} />
                  )}
                  {results.groups.length > 0 && (
                    <Section title="Guruhlar" icon={Users} items={results.groups.slice(0, 5)} render={g => ({ label: g.name, sub: `${g.course || ''} | ${g._count?.students || 0} ta o\'quvchi` })} />
                  )}
                  {results.payments.length > 0 && (
                    <Section title="To'lovlar" icon={CreditCard} items={results.payments.slice(0, 5)} render={p => ({ label: `${p.studentName || ''} - ${p.amount?.toLocaleString()} so'm`, sub: p.method })} />
                  )}
                  {results.messages.length > 0 && (
                    <Section title="Xabarlar" icon={MessageSquare} items={results.messages.slice(0, 5)} render={m => ({ label: m.content?.substring(0, 80), sub: new Date(m.createdAt).toLocaleString() })} />
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Section({ title, icon: Icon, items, render }) {
  return (
    <div>
      <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
        <Icon className="w-3.5 h-3.5" /> {title}
      </div>
      {items.map((item, i) => {
        const r = render(item)
        return (
          <button key={item.id || i} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{r.label}</p>
              {r.sub && <p className="text-xs text-gray-400 truncate">{r.sub}</p>}
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300" />
          </button>
        )
      })}
    </div>
  )
}
