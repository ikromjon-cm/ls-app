import { create } from 'zustand'
import { api } from '../api'

export const useAppStore = create((set, get) => ({
  // Organization
  organization: null,
  setOrganization: (org) => set({ organization: org }),

  // Navigation
  currentPage: 'dashboard',
  sidebarOpen: true,
  setCurrentPage: (page) => set({ currentPage: page }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // Loading
  loading: false,
  setLoading: (loading) => set({ loading }),

  // Command palette
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  // Data
  students: [],
  groups: [],
  payments: [],
  expenses: [],
  attendance: [],
  homework: [],
  grades: [],
  messages: [],
  notifications: [],

  loadData: async () => {
    set({ loading: true })
    try {
      const [students, groups, payments, expenses, attendance, homework, grades, messages, notifications] = await Promise.all([
        api.request('/students', {}),
        api.request('/groups', {}),
        api.request('/payments', {}),
        api.request('/expenses', {}),
        api.request('/attendance', {}),
        api.request('/homework', {}),
        api.request('/grades', {}),
        api.request('/messages', {}),
        api.request('/notifications', {}),
      ])
      set({
        students: Array.isArray(students) ? students : [],
        groups: Array.isArray(groups) ? groups : [],
        payments: Array.isArray(payments) ? payments : [],
        expenses: Array.isArray(expenses) ? expenses : [],
        attendance: Array.isArray(attendance) ? attendance : [],
        homework: Array.isArray(homework) ? homework : [],
        grades: Array.isArray(grades) ? grades : [],
        messages: Array.isArray(messages) ? messages : [],
        notifications: Array.isArray(notifications) ? notifications : [],
      })
    } catch {} finally { set({ loading: false }) }
  },

  // Dispatch for backward compatibility
  dispatch: (action) => {
    const state = get()
    switch (action.type) {
      case 'SET_PAGE': set({ currentPage: action.page }); break
      case 'SET_SIDEBAR': set({ sidebarOpen: action.open }); break
      case 'ADD_PAYMENT': set({ payments: [action.payment, ...state.payments] }); break
      case 'UPDATE_STUDENT': set({ students: state.students.map(s => s.id === action.student.id ? action.student : s) }); break
      default: break
    }
  },
}))
