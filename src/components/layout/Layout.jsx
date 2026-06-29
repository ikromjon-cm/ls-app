import { lazy, Suspense, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { motion } from 'framer-motion'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

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

const ROLE_PAGES = {
  superadmin: ['dashboard', 'groups', 'students', 'payments', 'expenses', 'attendance', 'teachers', 'reports', 'audit', 'notifications', 'settings', 'chat', 'homework', 'grades', 'schedule', 'library', 'exams', 'certificates'],
  admin: ['dashboard', 'groups', 'students', 'payments', 'expenses', 'attendance', 'teachers', 'reports', 'audit', 'notifications', 'chat', 'homework', 'grades', 'schedule', 'library', 'exams', 'certificates'],
  teacher: ['dashboard', 'attendance', 'homework', 'grades', 'schedule', 'chat', 'library', 'exams'],
}

function PageFallback({ title }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
      <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
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
}

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
  chat: 'Xabarlar',
  homework: 'Topshiriqlar',
  grades: 'Baholar',
  schedule: 'Dars jadvali',
  library: 'Kutubxona',
  exams: 'Imtihonlar',
  certificates: 'Sertifikatlar',
}

export default function Layout() {
  const { user } = useAuth()
  const { state, dispatch } = useApp()
  const { currentPage = 'dashboard', sidebarOpen } = state

  if (!user) return null

  const allowedPages = ROLE_PAGES[user.role] || ROLE_PAGES.teacher
  const safePage = allowedPages.includes(currentPage) ? currentPage : 'dashboard'

  useEffect(() => {
    if (safePage !== currentPage) dispatch({ type: 'SET_PAGE', payload: safePage })
  }, [safePage, currentPage, dispatch])

  const PageComponent = pages[safePage]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="flex pt-16 min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <main
          className={`flex-1 p-4 md:p-6 lg:p-8 transition-all duration-300 ${
            sidebarOpen ? 'md:ml-64' : 'md:ml-20'
          }`}
        >
          <Suspense fallback={<PageFallback title={pageTitles[currentPage]} />}>
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <PageComponent />
            </motion.div>
          </Suspense>
        </main>
      </div>
    </div>
  )
}
