import { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const darkMode = true
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Always enforce dark class — no light mode
  useEffect(() => {
    document.documentElement.classList.add('dark')
    localStorage.removeItem('darkMode')
  }, [])

  const toggleDarkMode = () => {}   // no-op kept so existing callers don't break

  return (
    <AppContext.Provider value={{ darkMode, toggleDarkMode, sidebarCollapsed, setSidebarCollapsed }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
