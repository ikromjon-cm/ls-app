import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { api, setTokens, clearTokens, getToken } from '../api'

const AuthContext = createContext()

const initialState = { user: null, token: null, loading: true, error: null }

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return { ...state, user: action.user, token: action.token, loading: false, error: null }
    case 'LOGOUT':
      return { ...initialState, loading: false }
    case 'SET_USER':
      return { ...state, user: action.user, loading: false }
    case 'AUTH_ERROR':
      return { ...state, error: action.error, loading: false }
    case 'SET_LOADING':
      return { ...state, loading: action.loading }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const validateSession = useCallback(async () => {
    const token = getToken()
    if (!token) {
      dispatch({ type: 'SET_LOADING', loading: false })
      return
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.exp * 1000 <= Date.now()) {
        clearTokens()
        dispatch({ type: 'SET_LOADING', loading: false })
        return
      }
      // Try to restore session with API call
      try {
        const data = await api.getDashboard().catch(() => null)
        if (data) {
          dispatch({ type: 'SET_USER', user: payload })
          return
        }
      } catch {}
      // Fallback: use JWT payload for basic info
      dispatch({ type: 'SET_USER', user: { id: payload.id, role: payload.role, name: payload.name, login: payload.login } })
    } catch {
      clearTokens()
      dispatch({ type: 'SET_LOADING', loading: false })
    }
  }, [])

  useEffect(() => { validateSession() }, [validateSession])

  const login = async (login, password) => {
    dispatch({ type: 'SET_LOADING', loading: true })
    try {
      const data = await api.login(login, password)
      setTokens(data.token, data.refreshToken)
      dispatch({ type: 'LOGIN_SUCCESS', user: data.user, token: data.token })
      return data.user
    } catch (err) {
      dispatch({ type: 'AUTH_ERROR', error: err.message })
      throw err
    }
  }

  const logout = useCallback(() => {
    clearTokens()
    dispatch({ type: 'LOGOUT' })
  }, [])

  // Listen for forced logout from api.js
  useEffect(() => {
    const handler = () => logout()
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [logout])

  const hasRole = (...roles) => state.user && roles.includes(state.user.role)

  return (
    <AuthContext.Provider value={{ ...state, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
