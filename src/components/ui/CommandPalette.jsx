import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, LayoutDashboard, Users, GraduationCap, CreditCard, Settings, MessageSquare, BookOpen, Award, Calendar, ArrowRight, Command } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAppStore } from '../../store'

const PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, keywords: 'bosh sahifa asosiy' },
  { id: 'groups', label: 'Guruhlar', icon: Users, keywords: 'groups guruhlar sinf' },
  { id: 'students', label: "Talabalar", icon: GraduationCap, keywords: 'students oquvchilar talabalar' },
  { id: 'payments', label: "To'lovlar", icon: CreditCard, keywords: 'payments tolovlar pul' },
  { id: 'chat', label: 'Xabarlar', icon: MessageSquare, keywords: 'chat xabarlar messages' },
  { id: 'homework', label: 'Topshiriqlar', icon: BookOpen, keywords: 'homework topshiriqlar uy vazifa' },
  { id: 'grades', label: 'Baholar', icon: Award, keywords: 'grades baholar natijalar' },
  { id: 'schedule', label: 'Dars jadvali', icon: Calendar, keywords: 'schedule jadval dars' },
  { id: 'settings', label: 'Sozlamalar', icon: Settings, keywords: 'settings sozlamalar' },
]

export default function CommandPalette() {
  const { state, dispatch } = useApp()
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore()
  const { currentPage } = state
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
    dispatch({ type: 'SET_PAGE', payload: item.id })
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[12vh]"
          onClick={() => setCommandPaletteOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="w-full max-w-lg modal-glass rounded-3xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E4E4E7] dark:border-[#27272A]">
              <Search className="w-4 h-4 text-[#A1A1AA]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Sahifa yoki buyruqni qidirish..."
                className="flex-1 bg-transparent border-none outline-none text-[#18181B] dark:text-[#FAFAFA] placeholder-[#A1A1AA] text-base"
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-[#A1A1AA] bg-[#F4F4F5] dark:bg-[#27272A] rounded-lg border border-[#E4E4E7] dark:border-[#3F3F46]">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            </div>
            <div className="max-h-72 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-[#71717A] dark:text-[#A1A1AA] text-sm">Natija topilmadi</div>
              ) : (
                filtered.map((item, i) => (
                  <button
                    key={item.id}
                    onClick={() => select(item)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all ${
                      i === selectedIndex
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                        : 'text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A]'
                    }`}
                  >
                    <div className={`p-1.5 rounded-xl ${i === selectedIndex ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'bg-[#F4F4F5] dark:bg-[#27272A]'}`}>
                      <item.icon className={`w-4 h-4`} />
                    </div>
                    <span className="flex-1 font-medium text-sm">{item.label}</span>
                    {item.id === currentPage && <span className="text-[10px] text-indigo-500">Hozirgi</span>}
                    <ArrowRight className="w-3.5 h-3.5 text-[#D4D4D8] dark:text-[#3F3F46]" />
                  </button>
                ))
              )}
            </div>
            <div className="flex items-center gap-4 px-5 py-3 border-t border-[#E4E4E7] dark:border-[#27272A] text-[10px] text-[#A1A1AA]">
              <span><kbd className="px-1 py-0.5 bg-[#F4F4F5] dark:bg-[#27272A] rounded-lg border border-[#E4E4E7] dark:border-[#3F3F46]">↑↓</kbd> Navigatsiya</span>
              <span><kbd className="px-1 py-0.5 bg-[#F4F4F5] dark:bg-[#27272A] rounded-lg border border-[#E4E4E7] dark:border-[#3F3F46]">↵</kbd> Tanlash</span>
              <span><kbd className="px-1 py-0.5 bg-[#F4F4F5] dark:bg-[#27272A] rounded-lg border border-[#E4E4E7] dark:border-[#3F3F46]">Esc</kbd> Yopish</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
