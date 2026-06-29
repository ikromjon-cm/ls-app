import { createContext, useContext, useReducer, useEffect, useState } from 'react'
import { api } from '../api'

const AppContext = createContext()

const initialState = {
  currentPage: 'dashboard',
  theme: 'light',
  sidebarOpen: true,
  groups: [],
  payments: [],
  stats: { totalStudents: 0, activeGroups: 0, totalRevenue: 0, debtors: 0, paidCount: 0, presentToday: 0, totalToday: 0, attendancePercent: 0 },
  toast: { show: false, message: '', type: 'success' },
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' }
    case 'SET_GROUPS':
      return { ...state, groups: action.payload }
    case 'SET_PAYMENTS':
      return { ...state, payments: action.payload }
    case 'SET_STATS':
      return { ...state, stats: action.payload }
    case 'ADD_GROUP':
      return { ...state, groups: [...state.groups, action.payload] }
    case 'UPDATE_GROUP':
      return { ...state, groups: state.groups.map((g) => (g.id === action.payload.id ? action.payload : g)) }
    case 'DELETE_GROUP':
      return { ...state, groups: state.groups.filter((g) => g.id !== action.payload) }
    case 'ADD_STUDENT': {
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === action.payload.groupId
            ? { ...g, students: [...g.students, action.payload.student] }
            : g
        ),
      }
    }
    case 'UPDATE_STUDENT': {
      return {
        ...state,
        groups: state.groups.map((g) => ({
          ...g,
          students: g.students.map((s) => (s.id === action.payload.id ? { ...s, ...action.payload.data } : s)),
        })),
      }
    }
    case 'DELETE_STUDENT': {
      return {
        ...state,
        groups: state.groups.map((g) => ({
          ...g,
          students: g.students.filter((s) => s.id !== action.payload),
        })),
      }
    }
    case 'MARK_PAYMENT': {
      const groups = state.groups.map((g) => ({
        ...g,
        students: g.students.map((s) => (s.id === action.payload.studentId ? { ...s, paymentStatus: 'paid' } : s)),
      }))
      return { ...state, groups, payments: [action.payload.payment, ...state.payments] }
    }
    case 'MARK_ATTENDANCE': {
      return {
        ...state,
        groups: state.groups.map((g) => ({
          ...g,
          students: g.students.map((s) => {
            if (s.id === action.payload.studentId) {
              return { ...s, attendance: { ...s.attendance, [action.payload.date]: action.payload.status } }
            }
            return s
          }),
        })),
      }
    }
    case 'SHOW_TOAST':
      return { ...state, toast: { show: true, message: action.payload.message, type: action.payload.type || 'success' } }
    case 'HIDE_TOAST':
      return { ...state, toast: { ...state.toast, show: false } }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const saved = globalThis.localStorage?.getItem('opencode-crm-theme')
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      dispatch({ type: 'TOGGLE_THEME' })
    }
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const [groups, payments, stats] = await Promise.all([
          api.getGroups(),
          api.getPayments(),
          api.getStats(),
        ])
        dispatch({ type: 'SET_GROUPS', payload: groups })
        dispatch({ type: 'SET_PAYMENTS', payload: payments })
        dispatch({ type: 'SET_STATS', payload: stats })
      } catch (err) {
        setError(err.message)
        console.error('Failed to load data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    try {
      globalThis.localStorage?.setItem('opencode-crm-theme', state.theme)
    } catch {}
  }, [state.theme])

  useEffect(() => {
    const root = document.documentElement
    if (state.theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [state.theme])

  async function refreshStats() {
    try {
      const stats = await api.getStats()
      dispatch({ type: 'SET_STATS', payload: stats })
    } catch (err) {
      console.error('Failed to refresh stats:', err)
    }
  }

  async function refreshGroups() {
    try {
      const groups = await api.getGroups()
      dispatch({ type: 'SET_GROUPS', payload: groups })
    } catch (err) {
      console.error('Failed to refresh groups:', err)
    }
  }

  async function refreshPayments() {
    try {
      const payments = await api.getPayments()
      dispatch({ type: 'SET_PAYMENTS', payload: payments })
    } catch (err) {
      console.error('Failed to refresh payments:', err)
    }
  }

  const actions = {
    addGroup: async (data) => {
      const group = await api.createGroup(data)
      dispatch({ type: 'ADD_GROUP', payload: group })
      await refreshStats()
      dispatch({ type: 'SHOW_TOAST', payload: { message: `"${group.name}" guruhi yaratildi!`, type: 'success' } })
    },
    updateGroup: async (id, data) => {
      const group = await api.updateGroup(id, data)
      dispatch({ type: 'UPDATE_GROUP', payload: group })
      await refreshStats()
      dispatch({ type: 'SHOW_TOAST', payload: { message: `"${group.name}" tahrirlandi!`, type: 'success' } })
    },
    deleteGroup: async (id) => {
      await api.deleteGroup(id)
      dispatch({ type: 'DELETE_GROUP', payload: id })
      await refreshStats()
      dispatch({ type: 'SHOW_TOAST', payload: { message: 'Guruh o\'chirildi', type: 'info' } })
    },
    addStudent: async (groupId, data) => {
      const student = await api.addStudent(groupId, data)
      dispatch({ type: 'ADD_STUDENT', payload: { groupId, student } })
      await refreshStats()
      dispatch({ type: 'SHOW_TOAST', payload: { message: `${student.name} guruhga qo'shildi!`, type: 'success' } })
    },
    updateStudent: async (id, data) => {
      await api.updateStudent(id, data)
      dispatch({ type: 'UPDATE_STUDENT', payload: { id, data } })
      dispatch({ type: 'SHOW_TOAST', payload: { message: "Ma'lumotlar tahrirlandi!", type: 'success' } })
    },
    deleteStudent: async (id) => {
      await api.deleteStudent(id)
      dispatch({ type: 'DELETE_STUDENT', payload: id })
      await refreshStats()
      dispatch({ type: 'SHOW_TOAST', payload: { message: 'Talaba o\'chirildi', type: 'info' } })
    },
    markPayment: async (studentId, data) => {
      const payment = await api.markPayment(studentId, data)
      dispatch({ type: 'MARK_PAYMENT', payload: { studentId, payment } })
      await refreshStats()
      dispatch({ type: 'SHOW_TOAST', payload: { message: "To'lov qabul qilindi!", type: 'success' } })
    },
    markAttendance: async (studentId, data) => {
      await api.markAttendance(studentId, data)
      dispatch({ type: 'MARK_ATTENDANCE', payload: { studentId, date: data.date, status: data.status } })
      await refreshStats()
    },
    refreshGroups,
    refreshPayments,
    refreshStats,
    showToast: (payload) => dispatch({ type: 'SHOW_TOAST', payload }),
    hideToast: () => dispatch({ type: 'HIDE_TOAST' }),
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30 animate-pulse">
            <span className="text-2xl font-bold text-white">OC</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">OpenCode CRM</h2>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Yuklanmoqda...
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center max-w-md px-8">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Serverga ulanishda xatolik</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Backend server ishlamayapti. Iltimos, serverni ishga tushiring:
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mb-6 text-left">
            <code className="text-sm text-gray-700 dark:text-gray-300">cd server && npm start</code>
          </div>
          <button onClick={() => window.location.reload()} className="btn_primary">
            Qayta urinish
          </button>
        </div>
      </div>
    )
  }

  return (
    <AppContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
