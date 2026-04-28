import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from './AuthContext'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const RealtimeContext = createContext(null)
const POLL_MS = 10_000

export function RealtimeProvider({ children }) {
  const [tick, setTick] = useState(0)
  const { user } = useAuth()

  // Fallback polling — keeps data fresh even when Realtime isn't available
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), POLL_MS)
    return () => clearInterval(id)
  }, [])

  // Supabase Realtime: push tick immediately when the DB changes for this user
  useEffect(() => {
    if (USE_MOCK || !user?.id) return

    const bump = () => setTick(t => t + 1)

    const channel = supabase
      .channel(`user-realtime-${user.id}`)
      // Any milestone assigned to this user (new assignment, status update)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'milestones',
        filter: `assigned_to=eq.${user.id}`,
      }, bump)
      // New notification for this user (bell badge updates instantly)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, bump)
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
