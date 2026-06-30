import { lazy, Suspense } from 'react'
import { useAuth } from './context/AuthContext'
import { AnimatePresence, motion } from 'framer-motion'
import LoginPage from './components/auth/LoginPage'
import { ToastProvider } from './components/common/Toast'

const Layout = lazy(() => import('./components/layout/Layout'))

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#09090B]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-200 dark:border-indigo-900/30 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] font-medium">Yuklanmoqda...</p>
      </div>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingSpinner />

  return (
    <ToastProvider>
      <AnimatePresence mode="wait">
        {user ? (
          <Suspense fallback={<LoadingSpinner />}>
            <motion.div
              key="layout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Layout />
            </motion.div>
          </Suspense>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <LoginPage />
          </motion.div>
        )}
      </AnimatePresence>
    </ToastProvider>
  )
}
