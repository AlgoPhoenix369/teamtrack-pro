import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from './AuthContext'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const RealtimeContext = createContext(null)
const POLL_MS = 10_000      // fallback poll
const CHANNEL  = 'taskoenix-refresh'

export function RealtimeProvider({ children }) {
  const [tick, setTick] = useState(0)
  const { user } = useAuth()

  // Fallback polling — keeps data fresh if broadcast is missed
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), POLL_MS)
    return () => clearInterval(id)
  }, [])

  // Supabase Realtime broadcast — free-tier compatible, no DB replication needed.
  // Admin sends broadcastRefresh(userId) after any mutation; matching clients
  // bump their tick immediately so Dashboard and Navbar re-fetch.
  useEffect(() => {
    if (USE_MOCK || !user?.id) return

    const bump = () => setTick(t => t + 1)
    const id   = user.id

    const channel = supabase
      .channel(CHANNEL)
      .on('broadcast', { event: 'refresh' }, ({ payload }) => {
        if (payload?.target === id) bump()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  const ping = useCallback(() => setTick(t => t + 1), [])

  return (
    <RealtimeContext.Provider value={{ tick, ping }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext)
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider')
  return ctx
}
