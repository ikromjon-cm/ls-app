import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  CalendarCheck,
  Presentation,
  BarChart3,
  ScrollText,
  Settings,
  Bell,
  MessageSquare,
  Award,
  Calendar,
  Book,
  ClipboardList,
  ChevronLeft,
  LogOut,
} from 'lucide-react'
import { useState } from 'react'

const allMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['superadmin', 'admin', 'teacher'] },
  { id: 'students', label: "Talabalar", icon: Users, roles: ['superadmin', 'admin'] },
  { id: 'teachers', label: "O'qituvchilar", icon: Presentation, roles: ['superadmin', 'admin'] },
  { id: 'groups', label: 'Guruhlar', icon: BookOpen, roles: ['superadmin', 'admin', 'teacher'] },
  { id: 'schedule', label: 'Dars jadvali', icon: Calendar, roles: ['superadmin', 'admin', 'teacher'] },
  { id: 'attendance', label: 'Davomat', icon: CalendarCheck, roles: ['superadmin', 'admin', 'teacher'] },
  { id: 'payments', label: "To'lovlar", icon: CreditCard, roles: ['superadmin', 'admin'] },
  { id: 'expenses', label: 'Xarajatlar', icon: CreditCard, roles: ['superadmin', 'admin'] },
  { id: 'homework', label: 'Topshiriqlar', icon: ClipboardList, roles: ['superadmin', 'admin', 'teacher'] },
  { id: 'grades', label: 'Baholar', icon: Award, roles: ['superadmin', 'admin', 'teacher'] },
  { id: 'exams', label: 'Imtihonlar', icon: Book, roles: ['superadmin', 'admin', 'teacher'] },
  { id: 'library', label: 'Kutubxona', icon: BookOpen, roles: ['superadmin', 'admin', 'teacher'] },
  { id: 'certificates', label: 'Sertifikatlar', icon: Award, roles: ['superadmin', 'admin'] },
  { id: 'chat', label: 'Xabarlar', icon: MessageSquare, roles: ['superadmin', 'admin', 'teacher'] },
  { id: 'reports', label: 'Hisobotlar', icon: BarChart3, roles: ['superadmin', 'admin'] },
  { id: 'audit', label: 'Audit', icon: ScrollText, roles: ['superadmin'] },
  { id: 'notifications', label: 'Xabarnomalar', icon: Bell, roles: ['superadmin', 'admin'] },
  { id: 'settings', label: 'Sozlamalar', icon: Settings, roles: ['superadmin'] },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { state, dispatch } = useApp()
  const { currentPage = 'dashboard', sidebarOpen } = state
  const [hoveredItem, setHoveredItem] = useState(null)

  const normalizedRole = user?.role?.replace('org_admin', 'admin').replace('super_admin', 'superadmin')
  const menuItems = allMenuItems.filter((item) => {
    if (!user) return false
    return item.roles.includes(user.role) || item.roles.includes(normalizedRole)
  })

  const handleNav = (id) => {
    dispatch({ type: 'SET_PAGE', payload: id })
    if (window.innerWidth < 768) dispatch({ type: 'TOGGLE_SIDEBAR' })
  }

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-30 md:hidden"
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          />
        )}
      </AnimatePresence>

      <aside
        className={`sidebar-glass fixed top-0 left-0 z-30 h-screen flex flex-col transition-all duration-300 ease-out ${
          sidebarOpen
            ? 'w-[280px] translate-x-0'
            : '-translate-x-full md:translate-x-0 md:w-[80px]'
        }`}
        style={{ width: sidebarOpen ? '280px' : undefined }}
      >
        <div className="flex items-center h-[72px] px-4 border-b border-[#E4E4E7]/50 dark:border-[#27272A]/50 flex-shrink-0">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'md:hidden'}`}>
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              L
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA]">Lighthouse</span>
              <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] -mt-0.5">IT Academy</span>
            </div>
          </div>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            className={`ml-auto p-2 rounded-xl text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] transition-colors ${
              !sidebarOpen && 'md:hidden'
            }`}
            aria-label="Yon panel"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            className="hidden md:flex mx-auto p-2 rounded-xl text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] transition-colors"
            aria-label="Kengaytirish"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
          </button>
        </div>

        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item, index) => {
            const isActive = currentPage === item.id
            const Icon = item.icon
            const isHovered = hoveredItem === item.id

            return (
              <div key={item.id} className="relative group">
                <motion.button
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02, duration: 0.2 }}
                  onClick={() => handleNav(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 relative ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 font-medium'
                      : 'text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] hover:text-[#18181B] dark:hover:text-[#FAFAFA]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-indigo-600 dark:bg-indigo-400"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  <span className={`text-sm font-medium truncate ${!sidebarOpen && 'md:hidden'}`}>
                    {item.label}
                  </span>
                </motion.button>
                {!sidebarOpen && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-xl bg-[#18181B] dark:bg-[#FAFAFA] text-white dark:text-[#18181B] text-xs font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-lg pointer-events-none">
                    {item.label}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="p-3 border-t border-[#E4E4E7]/50 dark:border-[#27272A]/50 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[#71717A] dark:text-[#A1A1AA]">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className={`flex-1 min-w-0 ${!sidebarOpen && 'md:hidden'}`}>
              <p className="text-sm font-medium text-[#18181B] dark:text-[#FAFAFA] truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] capitalize">{user?.role?.replace('_', ' ') || ''}</p>
            </div>
            <button
              onClick={logout}
              className={`p-1.5 rounded-lg hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] transition-colors ${!sidebarOpen && 'md:hidden'}`}
              aria-label="Chiqish"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
