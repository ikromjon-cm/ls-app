import { useAuth } from './context/AuthContext'
import { AnimatePresence, motion } from 'framer-motion'
import LoginPage from './components/auth/LoginPage'
import Layout from './components/layout/Layout'
import { ToastProvider } from './components/common/Toast'
import { Loader2 } from 'lucide-react'

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 dark:border-primary-900/30 border-t-primary-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse" />
          </div>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Yuklanmoqda...</p>
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
          <motion.div
            key="layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Layout />
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <LoginPage />
          </motion.div>
        )}
      </AnimatePresence>
    </ToastProvider>
  )
}
