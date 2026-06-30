import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { api } from '../api'

const AppContext = createContext()

const initialState = {
  currentPage: 'dashboard',
  theme: localStorage.getItem('theme') || 'light',
  sidebarOpen: true,
  groups: [],
  students: [],
  payments: [],
  expenses: [],
  attendance: [],
  stats: null,
  notifications: [],
  unreadCount: 0,
  auditLogs: [],
  reports: [],
  users: [],
  loading: true,
  error: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_INITIAL':
      return { ...state, ...action.data, unreadCount: action.data.notifications ? action.data.notifications.filter(n => !n.read).length : state.unreadCount, loading: false }
    case 'REFRESH_DATA':
      return { ...state, ...action.data, unreadCount: action.data.notifications ? action.data.notifications.filter(n => !n.read).length : state.unreadCount }
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload }
    case 'SET_THEME':
      return { ...state, theme: action.theme }
    case 'SET_SIDEBAR':
      return { ...state, sidebarOpen: action.open }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }
    case 'SET_LOADING':
      return { ...state, loading: action.loading }
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false }
    case 'ADD_GROUP':
      return { ...state, groups: [...state.groups, action.group] }
    case 'UPDATE_GROUP':
      return { ...state, groups: state.groups.map(g => g.id === action.group.id ? action.group : g) }
    case 'DELETE_GROUP':
      return { ...state, groups: state.groups.filter(g => g.id !== action.id) }
    case 'ADD_STUDENT':
      return { ...state, students: [...state.students, action.student] }
    case 'UPDATE_STUDENT':
      return { ...state, students: state.students.map(s => s.id === action.student.id ? action.student : s) }
    case 'DELETE_STUDENT':
      return { ...state, students: state.students.filter(s => s.id !== action.id) }
    case 'ADD_PAYMENT':
      return { ...state, payments: [action.payment, ...state.payments] }
    case 'ADD_EXPENSE':
      return { ...state, expenses: [action.expense, ...state.expenses] }
    case 'DELETE_EXPENSE':
      return { ...state, expenses: state.expenses.filter(e => e.id !== action.id) }
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.notifications, unreadCount: action.notifications.filter(n => !n.read).length }
    case 'MARK_NOTIFICATION':
      return { ...state, notifications: state.notifications.map(n => n.id === action.id ? { ...n, read: true } : n), unreadCount: Math.max(0, state.unreadCount - 1) }
    case 'SET_AUDIT_LOGS':
      return { ...state, auditLogs: action.logs }
    case 'SET_REPORTS':
      return { ...state, reports: action.reports }
    case 'SET_STATS':
      return { ...state, stats: action.stats }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    const root = document.documentElement
    if (state.theme === 'dark') { root.classList.add('dark'); localStorage.setItem('theme', 'dark') }
    else { root.classList.remove('dark'); localStorage.setItem('theme', 'light') }
  }, [state.theme])

  const loadInitial = useCallback(async () => {
    try {
      const [groups, students, payments, expenses, stats, notifications, users] = await Promise.all([
        api.getGroups(), api.getStudents({}), api.getPayments({}),
        api.getExpenses({}), api.getDashboard(), api.getNotifications(), api.getUsers(),
      ])
      dispatch({ type: 'SET_INITIAL', data: { groups, students, payments, expenses, stats, notifications, users } })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err.message })
    }
  }, [])

  useEffect(() => { loadInitial() }, [loadInitial])

  // Refresh functions
  const refreshGroups = useCallback(async () => { const groups = await api.getGroups(); dispatch({ type: 'SET_INITIAL', data: { groups } }) }, [])
  const refreshStudents = useCallback(async () => { const students = await api.getStudents({}); dispatch({ type: 'SET_INITIAL', data: { students } }) }, [])
  const refreshPayments = useCallback(async () => { const payments = await api.getPayments({}); dispatch({ type: 'SET_INITIAL', data: { payments } }) }, [])
  const refreshExpenses = useCallback(async () => { const expenses = await api.getExpenses({}); dispatch({ type: 'SET_INITIAL', data: { expenses } }) }, [])
  const refreshStats = useCallback(async () => { const stats = await api.getDashboard(); dispatch({ type: 'SET_STATS', stats }) }, [])
  const refreshNotifications = useCallback(async () => { const n = await api.getNotifications(); dispatch({ type: 'SET_NOTIFICATIONS', notifications: n }) }, [])
  const refreshAuditLogs = useCallback(async (filters) => { const logs = await api.getAuditLogs(filters); dispatch({ type: 'SET_AUDIT_LOGS', logs }) }, [])
  const refreshReports = useCallback(async (filters) => { const r = await api.getReports(filters); dispatch({ type: 'SET_REPORTS', reports: r }) }, [])

  const refreshAll = useCallback(async () => {
    try {
      const [groups, students, payments, expenses, stats, notifications] = await Promise.all([
        api.getGroups(), api.getStudents({}), api.getPayments({}),
        api.getExpenses({}), api.getDashboard(), api.getNotifications(),
      ])
      dispatch({ type: 'REFRESH_DATA', data: { groups, students, payments, expenses, stats, notifications } })
    } catch {}
  }, [])

  // Auto-refresh every 30 seconds after initial load so all users see real-time changes
  useEffect(() => {
    if (state.loading) return
    const interval = setInterval(refreshAll, 30000)
    return () => clearInterval(interval)
  }, [state.loading, refreshAll])

  const toggleTheme = () => dispatch({ type: 'SET_THEME', theme: state.theme === 'dark' ? 'light' : 'dark' })
  const toggleSidebar = () => dispatch({ type: 'TOGGLE_SIDEBAR' })

  return (
    <AppContext.Provider value={{
      state, dispatch,
      toggleTheme, toggleSidebar,
      refreshGroups, refreshStudents, refreshPayments, refreshExpenses, refreshStats,
      refreshNotifications, refreshAuditLogs, refreshReports, refreshAll,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
