import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { useAppStore } from '../../store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Command, Sun, Moon, Bell, LogOut, ChevronDown, Plus,
} from 'lucide-react'

const pageTitles = {
  dashboard: 'Dashboard', groups: 'Guruhlar', students: "Talabalar",
  payments: "To'lovlar", expenses: 'Xarajatlar', attendance: 'Davomat',
  teachers: "O'qituvchilar", reports: 'Hisobotlar', audit: 'Audit',
  notifications: 'Xabarnomalar', settings: 'Sozlamalar', chat: 'Xabarlar',
  homework: 'Topshiriqlar', grades: 'Baholar', schedule: 'Dars jadvali',
  library: 'Kutubxona', exams: 'Imtihonlar', certificates: 'Sertifikatlar',
  'payment-settings': "To'lov tizimlari",
}

export default function Navbar({ onSearchClick }) {
  const { user, logout } = useAuth()
  const { state, toggleTheme, dispatch } = useApp()
  const { theme, currentPage = 'dashboard', notifications = [], sidebarOpen, unreadCount = 0 } = state
  const { setCommandPaletteOpen } = useAppStore()

  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const notifRef = useRef(null)
  const userMenuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => { setShowUserMenu(false); logout() }
  const markAsRead = (id) => dispatch({ type: 'MARK_NOTIFICATION', id })

  const title = pageTitles[currentPage] || 'Dashboard'

  const breadcrumbs = [
    { label: 'Dashboard', page: 'dashboard' },
    ...(currentPage !== 'dashboard' ? [{ label: title, page: currentPage }] : []),
  ]

  return (
    <header className="glass-effect fixed top-0 right-0 left-0 md:left-[80px] z-20 h-[72px] px-4 md:px-6 lg:px-8 flex items-center justify-between gap-4 transition-all duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={() => dispatch({ type: 'SET_SIDEBAR', open: !sidebarOpen })}
          className="md:hidden p-2 rounded-xl text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] transition-colors"
          aria-label="Yon panel"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <nav className="flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.page} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-[#D4D4D8] dark:text-[#3F3F46]">/</span>}
              <button
                onClick={() => dispatch({ type: 'SET_PAGE', payload: crumb.page })}
                className={`hover:text-[#18181B] dark:hover:text-[#FAFAFA] transition-colors ${
                  i === breadcrumbs.length - 1
                    ? 'text-[#18181B] dark:text-[#FAFAFA] font-medium'
                    : 'text-[#71717A] dark:text-[#A1A1AA]'
                }`}
              >
                {crumb.label}
              </button>
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSearchClick}
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#F4F4F5] dark:bg-[#27272A] text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#E4E4E7] dark:hover:bg-[#3F3F46] transition-all w-56 lg:w-64 text-sm"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left">Qidirish...</span>
          <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-white dark:bg-[#18181B] rounded-lg border border-[#E4E4E7] dark:border-[#3F3F46]">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="md:hidden p-2 rounded-xl text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] transition-colors"
          aria-label="Buyruqlar"
        >
          <Command className="w-5 h-5" />
        </button>

        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] transition-colors"
          aria-label="Tema"
        >
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-2xl text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] transition-colors relative"
            aria-label="Xabarnomalar"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 modal-glass rounded-3xl shadow-soft-xl max-h-96 overflow-y-auto"
              >
                <div className="p-4 border-b border-[#E4E4E7] dark:border-[#27272A]">
                  <p className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA]">Xabarnomalar</p>
                </div>
                {(!notifications || notifications.length === 0) ? (
                  <div className="p-6 text-center text-sm text-[#71717A] dark:text-[#A1A1AA]">
                    Xabarnomalar mavjud emas
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`w-full text-left px-4 py-3 border-b border-[#F4F4F5] dark:border-[#27272A]/50 hover:bg-[#F4F4F5] dark:hover:bg-[#27272A]/50 transition-colors ${
                        !n.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                      }`}
                    >
                      <p className="text-sm font-medium text-[#18181B] dark:text-[#FAFAFA]">{n.title}</p>
                      <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-[#A1A1AA] dark:text-[#52525B] mt-1">
                        {new Date(n.createdAt).toLocaleString('uz-UZ')}
                      </p>
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-2xl hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] transition-colors"
          >
            <div className="w-[30px] h-[30px] rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-medium text-[#18181B] dark:text-[#FAFAFA] leading-tight">{user?.name || 'User'}</p>
              <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] capitalize">{user?.role?.replace('_', ' ') || ''}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
          </button>
          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 modal-glass rounded-3xl shadow-soft-xl overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-[#E4E4E7] dark:border-[#27272A]">
                  <p className="text-sm font-medium text-[#18181B] dark:text-[#FAFAFA]">{user?.name}</p>
                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{user?.email || user?.login}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Chiqish
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
