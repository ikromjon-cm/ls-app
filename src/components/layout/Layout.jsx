import { lazy, Suspense, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { useAppStore } from '../../store'
import { useKeyboardShortcuts } from '../../hooks'
import { motion } from 'framer-motion'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import CommandPalette from '../ui/CommandPalette'
import GlobalSearch from '../ui/GlobalSearch'

const Dashboard = lazy(() => import('../dashboard/Dashboard'))
const Groups = lazy(() => import('../groups/Groups'))
const Students = lazy(() => import('../students/Students'))
const Payments = lazy(() => import('../payments/Payments'))
const Expenses = lazy(() => import('../expenses/Expenses'))
const Attendance = lazy(() => import('../attendance/Attendance'))
const Teachers = lazy(() => import('../teachers/Teachers'))
const Reports = lazy(() => import('../reports/Reports'))
const Audit = lazy(() => import('../audit/AuditLogs'))
const Notifications = lazy(() => import('../notifications/NotificationPage'))
const Settings = lazy(() => import('../settings/Settings'))
const Chat = lazy(() => import('../chat/Chat'))
const Homework = lazy(() => import('../homework/Homework'))
const Grades = lazy(() => import('../grades/Grades'))
const Schedule = lazy(() => import('../schedule/Schedule'))
const Library = lazy(() => import('../library/Library'))
const Exams = lazy(() => import('../exams/Exams'))
const Certificates = lazy(() => import('../certificates/Certificates'))
const PaymentSettings = lazy(() => import('../payments/PaymentSettings'))

const ROLE_PAGES = {
  superadmin: ['dashboard', 'groups', 'students', 'payments', 'expenses', 'attendance', 'teachers', 'reports', 'audit', 'notifications', 'settings', 'chat', 'homework', 'grades', 'schedule', 'library', 'exams', 'certificates', 'payment-settings'],
  super_admin: ['dashboard', 'groups', 'students', 'payments', 'expenses', 'attendance', 'teachers', 'reports', 'audit', 'notifications', 'settings', 'chat', 'homework', 'grades', 'schedule', 'library', 'exams', 'certificates', 'payment-settings'],
  admin: ['dashboard', 'groups', 'students', 'payments', 'expenses', 'attendance', 'teachers', 'reports', 'audit', 'notifications', 'chat', 'homework', 'grades', 'schedule', 'library', 'exams', 'certificates'],
  org_admin: ['dashboard', 'groups', 'students', 'payments', 'expenses', 'attendance', 'teachers', 'reports', 'audit', 'notifications', 'chat', 'homework', 'grades', 'schedule', 'library', 'exams', 'certificates'],
  teacher: ['dashboard', 'attendance', 'homework', 'grades', 'schedule', 'chat', 'library', 'exams'],
}

function PageFallback({ title }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-[#71717A] dark:text-[#A1A1AA]">
      <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3" />
      <p className="text-sm">{title} yuklanmoqda...</p>
    </div>
  )
}

const pages = {
  dashboard: Dashboard,
  groups: Groups,
  students: Students,
  payments: Payments,
  expenses: Expenses,
  attendance: Attendance,
  teachers: Teachers,
  reports: Reports,
  audit: Audit,
  notifications: Notifications,
  settings: Settings,
  chat: Chat,
  homework: Homework,
  grades: Grades,
  schedule: Schedule,
  library: Library,
  exams: Exams,
  certificates: Certificates,
  'payment-settings': PaymentSettings,
}

const pageTitles = {
  dashboard: 'Dashboard',
  groups: 'Guruhlar',
  students: "Talabalar",
  payments: "To'lovlar",
  expenses: 'Xarajatlar',
  attendance: 'Davomat',
  teachers: "O'qituvchilar",
  reports: 'Hisobotlar',
  audit: 'Audit',
  notifications: 'Xabarnomalar',
  settings: 'Sozlamalar',
  chat: 'Xabarlar',
  homework: 'Topshiriqlar',
  grades: 'Baholar',
  schedule: 'Dars jadvali',
  library: 'Kutubxona',
  exams: 'Imtihonlar',
  certificates: 'Sertifikatlar',
  'payment-settings': "To'lov tizimlari",
}

export default function Layout() {
  const { user } = useAuth()
  const { state, dispatch } = useApp()
  const { currentPage = 'dashboard', sidebarOpen } = state
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore()
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false)

  useKeyboardShortcuts([
    { key: 'k', meta: true, action: () => setCommandPaletteOpen(!commandPaletteOpen) },
    { key: 'k', ctrl: true, action: () => setCommandPaletteOpen(!commandPaletteOpen) },
    { key: '/', ctrl: true, action: () => setGlobalSearchOpen(true) },
    { key: '/', meta: true, action: () => setGlobalSearchOpen(true) },
    { key: 'b', ctrl: true, action: () => dispatch({ type: 'SET_SIDEBAR', open: !sidebarOpen }) },
    { key: 'b', meta: true, action: () => dispatch({ type: 'SET_SIDEBAR', open: !sidebarOpen }) },
  ])

  useEffect(() => {
    if (!user) return
    const rolePages = ROLE_PAGES[user.role] || ROLE_PAGES.teacher
    if (!rolePages.includes(currentPage)) dispatch({ type: 'SET_PAGE', payload: rolePages[0] || 'dashboard' })
  }, [user, currentPage, dispatch])

  if (!user) return null

  const allowedPages = ROLE_PAGES[user.role] || ROLE_PAGES.teacher
  const safePage = allowedPages.includes(currentPage) ? currentPage : 'dashboard'
  const PageComponent = pages[safePage]

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B]">
      <CommandPalette />
      <GlobalSearch open={globalSearchOpen} onClose={() => setGlobalSearchOpen(false)} />
      <Sidebar />
      <Navbar onSearchClick={() => setGlobalSearchOpen(true)} />
      <BottomNav />
      <main
        className={`pt-[72px] min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'md:pl-[280px]' : 'md:pl-[80px]'
        }`}
      >
        <div className="p-4 md:p-6 lg:p-8 max-w-[1440px] mx-auto pb-20 md:pb-8">
          <Suspense fallback={<PageFallback title={pageTitles[safePage]} />}>
            <motion.div
              key={safePage}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <PageComponent />
            </motion.div>
          </Suspense>
        </div>
      </main>
    </div>
  )
}
