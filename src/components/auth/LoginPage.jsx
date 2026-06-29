import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { motion } from 'framer-motion'
import { LogIn, User, Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const { login, error, loading: authLoading } = useAuth()
  const { refreshAll } = useApp()
  const [loginField, setLoginField] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState('')

  const validate = () => {
    if (!loginField.trim()) return 'Loginni kiriting'
    if (!password) return 'Parolni kiriting'
    if (password.length < 4) return 'Parol kamida 4 belgidan iborat bo\'lishi kerak'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    const validationError = validate()
    if (validationError) {
      setLocalError(validationError)
      return
    }
    try {
      await login(loginField.trim(), password)
      refreshAll()
    } catch {
      // error is set by AuthContext
    }
  }

  const displayError = localError || error || ''

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 opacity-30 dark:opacity-20"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 25%, #3b82f6 50%, #6366f1 75%, #8b5cf6 100%)',
          backgroundSize: '400% 400%',
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      />

      {/* Decorative orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        <div className="card_glass">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg mb-4">
              OC
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">OpenCode CRM</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Tizimga kirish</p>
          </div>

          {/* Error */}
          {displayError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              {displayError}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Login field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Login
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={loginField}
                  onChange={(e) => setLoginField(e.target.value)}
                  placeholder="Loginni kiriting"
                  className={`input_field pl-10 ${localError && !loginField.trim() ? 'input_error' : ''}`}
                  disabled={authLoading}
                  autoFocus
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Parol
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Parolni kiriting"
                  className={`input_field pl-10 pr-10 ${localError && !password ? 'input_error' : ''}`}
                  disabled={authLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={authLoading}
              className="btn_primary w-full flex items-center justify-center gap-2"
            >
              {authLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Kirish...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Kirish
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
            &copy; 2026 OpenCode CRM. Barcha huquqlar himoyalangan.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
