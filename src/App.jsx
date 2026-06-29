import { useAuth } from './context/AuthContext'
import { AnimatePresence, motion } from 'framer-motion'
import LoginPage from './components/auth/LoginPage'
import Layout from './components/layout/Layout'

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">Yuklanmoqda...</p>
      </div>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingSpinner />

  return (
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
  )
}
