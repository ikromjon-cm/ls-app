import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { useAppStore } from '../../store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, Sun, Moon, Bell, LogOut, User, ChevronDown, X, Search, Command,
} from 'lucide-react'

const pageTitles = {
  dashboard: 'Dashboard', groups: 'Guruhlar', students: "O'quvchilar",
  payments: "To'lovlar", expenses: 'Xarajatlar', attendance: 'Davomat',
  teachers: "O'qituvchilar", reports: 'Hisobotlar', audit: 'Audit Log',
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch({ type: 'SET_SIDEBAR', open: !sidebarOpen })}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>
          </div>
        </div>

        {/* Center - Search */}
        <button
          onClick={onSearchClick}
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all w-64 lg:w-80"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left text-sm">Qidirish...</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">
            <Command className="w-2.5 h-2.5" />/
          </kbd>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Keyboard shortcut hint */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Command className="w-3 h-3" />K
          </button>

          {/* Theme toggle */}
          <button onClick={toggleTheme} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto"
                >
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <p className="font-semibold text-gray-900 dark:text-white">Xabarnomalar</p>
                  </div>
                  {(!notifications || notifications.length === 0) ? (
                    <div className="p-6 text-center text-sm text-gray-400">Xabarnomalar mavjud emas</div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!n.read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                      >
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-gray-300 mt-1">{new Date(n.createdAt).toLocaleString('uz-UZ')}</p>
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{user?.name || 'User'}</p>
                <p className="text-[10px] text-gray-400 capitalize">{user?.role || ''}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                    <p className="text-xs text-gray-400">{user?.email || user?.login}</p>
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
      </div>
    </nav>
  )
}
