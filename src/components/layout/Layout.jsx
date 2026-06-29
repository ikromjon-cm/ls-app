import { lazy, Suspense } from 'react'
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
}

export default function Layout() {
  const { user } = useAuth()
  const { state } = useApp()
  const { currentPage = 'dashboard', sidebarOpen } = state

  if (!user) return null

  const PageComponent = pages[currentPage]

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
