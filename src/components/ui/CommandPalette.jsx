import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, LayoutDashboard, Users, GraduationCap, CreditCard, Settings, MessageSquare, BookOpen, Award, Calendar, ArrowRight, Command } from 'lucide-react'
import { useAppStore } from '../../store'

const PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, keywords: 'bosh sahifa asosiy' },
  { id: 'groups', label: 'Guruhlar', icon: Users, keywords: 'groups guruhlar sinf' },
  { id: 'students', label: "O'quvchilar", icon: GraduationCap, keywords: 'students oquvchilar talabalar' },
  { id: 'payments', label: "To'lovlar", icon: CreditCard, keywords: 'payments tolovlar pul' },
  { id: 'chat', label: 'Xabarlar', icon: MessageSquare, keywords: 'chat xabarlar messages' },
  { id: 'homework', label: 'Topshiriqlar', icon: BookOpen, keywords: 'homework topshiriqlar uy vazifa' },
  { id: 'grades', label: 'Baholar', icon: Award, keywords: 'grades baholar natijalar' },
  { id: 'schedule', label: 'Dars jadvali', icon: Calendar, keywords: 'schedule jadval dars' },
  { id: 'settings', label: 'Sozlamalar', icon: Settings, keywords: 'settings sozlamalar' },
]

export default function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, setCurrentPage, currentPage } = useAppStore()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setSelectedIndex(0)
    }
  }, [commandPaletteOpen])

  const filtered = query.trim()
    ? PAGES.filter(p =>
        p.label.toLowerCase().includes(query.toLowerCase()) ||
        p.keywords.toLowerCase().includes(query.toLowerCase()) ||
        p.id.toLowerCase().includes(query.toLowerCase())
      )
    : PAGES

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  function select(item) {
    setCurrentPage(item.id)
    setCommandPaletteOpen(false)
  }

  function handleKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && filtered[selectedIndex]) { select(filtered[selectedIndex]) }
    if (e.key === 'Escape') { setCommandPaletteOpen(false) }
  }

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
          onClick={() => setCommandPaletteOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Sahifa yoki buyruqni qidirish..."
                className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 text-lg"
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md">
                <Command className="w-3 h-3" />K
              </kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Natija topilmadi</div>
              ) : (
                filtered.map((item, i) => (
                  <button
                    key={item.id}
                    onClick={() => select(item)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                      i === selectedIndex
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${i === selectedIndex ? 'bg-primary-100 dark:bg-primary-900/40' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      <item.icon className={`w-4 h-4 ${i === selectedIndex ? 'text-primary-600' : 'text-gray-500'}`} />
                    </div>
                    <span className="flex-1 font-medium">{item.label}</span>
                    {item.id === currentPage && <span className="text-xs text-primary-500">Hozirgi</span>}
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                  </button>
                ))
              )}
            </div>
            <div className="flex items-center gap-4 px-5 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400">
              <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↑↓</kbd> Navigatsiya</span>
              <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↵</kbd> Tanlash</span>
              <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Esc</kbd> Yopish</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
