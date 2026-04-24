import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'
import { authService } from '../services/authService'
import { presenceService } from '../services/presenceService'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (supabaseUser) => {
    try {
      const profile = await authService.getUserByEmail(supabaseUser.email)
      setUser({ ...profile, supabaseId: supabaseUser.id })
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    // Restore persisted tasker session
    const stored = localStorage.getItem('tasker_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { localStorage.removeItem('tasker_user') }
    }

    if (USE_MOCK) {
      // Restore persisted admin session in mock mode
      const adminStored = localStorage.getItem('mock_admin_user')
      if (adminStored && !stored) {
        try { setUser(JSON.parse(adminStored)) } catch { localStorage.removeItem('mock_admin_user') }
      }
      setLoading(false)
      return
    }

    // Real Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadProfile(session.user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadProfile(session.user)
      else if (!localStorage.getItem('tasker_user')) setUser(null)
    })

    return () => subscription.unsubscribe()
  }, [loadProfile])

  const adminLogin = async (email, password) => {
    if (USE_MOCK) {
      const { user: profile } = await authService.adminLogin(email, password)
      localStorage.setItem('mock_admin_user', JSON.stringify(profile))
      setUser(profile)
      return
    }
    const { user: sbUser } = await authService.adminLogin(email, password)
    await loadProfile(sbUser)
  }

  const taskerLogin = async (name, pin) => {
    const profile = await authService.taskerLogin(name, pin)
    localStorage.setItem('tasker_user', JSON.stringify(profile))
    setUser(profile)
  }

  // Presence heartbeat — fires immediately on login, then every 30 s
  useEffect(() => {
    if (!user?.id) return
    presenceService.heartbeat(user.id)
    const id = setInterval(() => presenceService.heartbeat(user.id), 30_000)
    return () => clearInterval(id)
  }, [user?.id])

  const logout = async () => {
    if (user?.id) presenceService.clear(user.id)
    await authService.logout()
    localStorage.removeItem('mock_admin_user')
    localStorage.removeItem('tasker_user')
    // timer_state is cleaned up by TimerContext's logout watcher
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, adminLogin, taskerLogin, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
