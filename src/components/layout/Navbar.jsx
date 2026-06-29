import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  Sun,
  Moon,
  Bell,
  LogOut,
  User,
  ChevronDown,
  X,
} from 'lucide-react'

const pageTitles = {
  dashboard: 'Dashboard',
  groups: 'Guruhlar',
  students: "O'quvchilar",
  payments: "To'lovlar",
  expenses: 'Xarajatlar',
  attendance: 'Davomat',
  teachers: "O'qituvchilar",
  reports: 'Hisobotlar',
  audit: 'Audit Log',
  notifications: 'Xabarnomalar',
  settings: 'Sozlamalar',
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const { state, toggleTheme, toggleSidebar, dispatch } = useApp()
  const { theme, currentPage = 'dashboard', notifications = [], unreadCount = 0 } = state

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

  const handleLogout = () => {
    setShowUserMenu(false)
    logout()
  }

  const markAsRead = (id) => {
    dispatch({ type: 'MARK_NOTIFICATION', id })
  }

  const title = pageTitles[currentPage] || 'Dashboard'

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 glass-effect border-b border-gray-200/50 dark:border-gray-800/50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
              title="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => dispatch({ type: 'SET_PAGE', payload: 'dashboard' })}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                OC
              </div>
              <span className="hidden sm:block text-lg font-bold text-gray-900 dark:text-white">
                OpenCode CRM
              </span>
            </div>
          </div>

          {/* Center: page title */}
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h1>
          </div>

          {/* Right: theme toggle, notifications, user */}
          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
              title={theme === 'light' ? 'Qorong\'i rejim' : 'Yorug\' rejim'}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                title="Xabarnomalar"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] min-h-[18px]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right"
                  >
                    <div className="card_glass p-0 max-h-96 overflow-y-auto shadow-xl">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Xabarnomalar</h3>
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          Xabarnomalar mavjud emas
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                          {notifications.map((notif) => (
                            <button
                              key={notif.id}
                              onClick={() => markAsRead(notif.id)}
                              className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                                !notif.read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                              }`}
                            >
                              <p className={`text-sm ${!notif.read ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                {notif.message}
                              </p>
                              {notif.createdAt && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {new Date(notif.createdAt).toLocaleString('uz-UZ')}
                                </p>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 pl-2 pr-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold">
                  {user?.login ? user.login.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                  {user?.login || 'Foydalanuvchi'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 origin-top-right"
                  >
                    <div className="card_glass p-1 shadow-xl">
                      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.login}</p>
                        <p className="text-xs text-gray-400 capitalize">{user?.role || 'Foydalanuvchi'}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Chiqish
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
