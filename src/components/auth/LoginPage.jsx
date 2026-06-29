import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { motion } from 'framer-motion'
import { LogIn, User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

const GRADIENT_BG = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 25%, #3b82f6 50%, #6366f1 75%, #8b5cf6 100%)'

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
    if (validationError) { setLocalError(validationError); return }
    try {
      await login(loginField.trim(), password)
      refreshAll()
    } catch {}
  }

  const displayError = localError || error || ''

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 opacity-30 dark:opacity-20"
        style={{ background: GRADIENT_BG, backgroundSize: '400% 400%' }}
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      />
      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        <div className="card_glass shadow-soft-lg">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/20 mb-4 ring-4 ring-primary-100 dark:ring-primary-900/30">
              OC
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">OpenCode CRM</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1.5">
              Tizimga kirish
            </p>
          </div>

          {/* Error */}
          {displayError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-sm flex items-center gap-2.5"
            >
              <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
              {displayError}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Login
              </label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="text"
                  value={loginField}
                  onChange={(e) => setLoginField(e.target.value)}
                  placeholder="Login yoki telefon raqam"
                  className={`input_field pl-11 ${localError && !loginField.trim() ? 'input_error' : ''}`}
                  disabled={authLoading}
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Parol
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Parolni kiriting"
                  className={`input_field pl-11 pr-11 ${localError && !password ? 'input_error' : ''}`}
                  disabled={authLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="btn_primary w-full flex items-center justify-center gap-2 py-3"
            >
              {authLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Kirish...
                </>
              ) : (
                <>
                  Kirish
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              &copy; {new Date().getFullYear()} OpenCode CRM. Barcha huquqlar himoyalangan.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
