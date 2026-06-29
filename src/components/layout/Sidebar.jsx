import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CreditCard,
  Wallet,
  CalendarCheck,
  Presentation,
  BarChart3,
  ScrollText,
  Settings,
  Bell,
} from 'lucide-react'

const allMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['superadmin', 'admin', 'teacher'] },
  { id: 'groups', label: 'Guruhlar', icon: Users, roles: ['superadmin', 'admin', 'teacher'] },
  { id: 'students', label: "O'quvchilar", icon: GraduationCap, roles: ['superadmin', 'admin', 'teacher'] },
  { id: 'payments', label: "To'lovlar", icon: CreditCard, roles: ['superadmin', 'admin', 'teacher'] },
  { id: 'expenses', label: 'Xarajatlar', icon: Wallet, roles: ['superadmin', 'admin', 'teacher'] },
  { id: 'attendance', label: 'Davomat', icon: CalendarCheck, roles: ['superadmin', 'admin', 'teacher'] },
  { id: 'teachers', label: "O'qituvchilar", icon: Presentation, roles: ['superadmin', 'admin'] },
  { id: 'reports', label: 'Hisobotlar', icon: BarChart3, roles: ['superadmin', 'admin'] },
  { id: 'audit', label: 'Audit Log', icon: ScrollText, roles: ['superadmin'] },
  { id: 'notifications', label: 'Xabarnomalar', icon: Bell, roles: ['superadmin'] },
]

export default function Sidebar() {
  const { user } = useAuth()
  const { state, dispatch } = useApp()
  const { currentPage = 'dashboard', sidebarOpen } = state

  const menuItems = allMenuItems.filter((item) => {
    if (!user) return false
    return item.roles.includes(user.role)
  })

  const handleNav = (id) => {
    dispatch({ type: 'SET_PAGE', payload: id })
    if (window.innerWidth < 768) dispatch({ type: 'TOGGLE_SIDEBAR' })
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] glass-effect border-r border-gray-200/50 dark:border-gray-800/50 transition-all duration-300 flex flex-col ${
          sidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0 md:w-20'
        }`}
      >
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {menuItems.map((item, index) => {
              const isActive = currentPage === item.id
              const Icon = item.icon

              return (
                <motion.button
                  layout
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500/10 to-primary-600/5 dark:from-primary-500/20 dark:to-primary-600/10 text-primary-600 dark:text-primary-400 font-semibold shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <div className={`flex-shrink-0 w-5 h-5 ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-sm font-medium truncate ${
                      !sidebarOpen && 'md:hidden'
                    }`}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.span
                      layoutId="activeIndicator"
                      className="ml-auto w-1.5 h-6 rounded-full bg-primary-500 hidden md:block"
                    />
                  )}
                </motion.button>
              )
            })}
          </AnimatePresence>
        </nav>
      </aside>
    </>
  )
}
