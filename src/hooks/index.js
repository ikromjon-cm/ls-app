import { useState, useEffect, useCallback } from 'react'

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    function handler(e) {
      for (const { key, ctrl, meta, shift, action } of shortcuts) {
        const pressed = (ctrl && e.ctrlKey) || (meta && e.metaKey)
        if (pressed && e.key.toLowerCase() === key.toLowerCase() && (!shift || e.shiftKey)) {
          e.preventDefault()
          action(e)
          return
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [shortcuts])
}

export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])
  return online
}

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch { return initialValue }
  })
  const set = useCallback((val) => {
    setValue(val)
    localStorage.setItem(key, JSON.stringify(val))
  }, [key])
  return [value, set]
}
