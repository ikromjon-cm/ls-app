import { useEffect, useState } from 'react'
import { useApp } from './context/AppContext'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Groups from './components/Groups'
import Payments from './components/Payments'
import Attendance from './components/Attendance'
import Billing from './components/Billing'
import Toast from './components/Toast'

const pages = {
  dashboard: Dashboard,
  groups: Groups,
  payments: Payments,
  attendance: Attendance,
  billing: Billing,
}

export default function App() {
  const { state } = useApp()
  const { currentPage, sidebarOpen } = state
  const PageComponent = pages[currentPage]
  const [transitionKey, setTransitionKey] = useState(0)

  useEffect(() => {
    setTransitionKey((k) => k + 1)
  }, [currentPage])

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex pt-16 min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <main
          className={`flex-1 p-4 md:p-6 lg:p-8 transition-all duration-300 ${
            sidebarOpen ? 'md:ml-64' : 'md:ml-20'
          }`}
        >
          <div key={transitionKey} className="animate-fade-in">
            <PageComponent />
          </div>
        </main>
      </div>
      <Toast />
    </div>
  )
}
