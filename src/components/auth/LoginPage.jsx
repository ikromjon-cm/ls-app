import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { motion } from 'framer-motion'
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

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
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-[#FAFAFA] dark:bg-[#09090B]">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/3 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative w-full max-w-sm"
      >
        <div className="bg-white dark:bg-[#18181B] rounded-3xl shadow-soft-lg border border-[#E4E4E7] dark:border-[#27272A] p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md mb-4">
              L
            </div>
            <h1 className="text-xl font-semibold text-[#18181B] dark:text-[#FAFAFA]">Lighthouse IT Academy</h1>
            <p className="text-[#71717A] dark:text-[#A1A1AA] text-sm mt-1">
              Tizimga kirish
            </p>
          </div>

          {displayError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-sm flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              {displayError}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-field" className="block text-sm font-medium text-[#18181B] dark:text-[#FAFAFA] mb-1.5">
                Login
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
                <input
                  id="login-field"
                  name="login"
                  type="text"
                  value={loginField}
                  onChange={(e) => setLoginField(e.target.value)}
                  placeholder="Login yoki telefon raqam"
                  className="input_field pl-10"
                  disabled={authLoading}
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password-field" className="block text-sm font-medium text-[#18181B] dark:text-[#FAFAFA] mb-1.5">
                Parol
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
                <input
                  id="password-field"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Parolni kiriting"
                  className="input_field pl-10 pr-10"
                  disabled={authLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#71717A] transition-colors"
                  tabIndex={-1}
                  aria-label="Ko'rsatish/Yashirish"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="btn_primary w-full flex items-center justify-center gap-2 py-2.5"
            >
              {authLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Kirish
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#E4E4E7] dark:border-[#27272A]">
            <p className="text-center text-[10px] text-[#A1A1AA] dark:text-[#52525B]">
              &copy; {new Date().getFullYear()} Lighthouse IT Academy. Barcha huquqlar himoyalangan.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
