import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const RealtimeContext = createContext(null)

const POLL_MS = 10_000 // 10-second heartbeat

export function RealtimeProvider({ children }) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), POLL_MS)
    return () => clearInterval(id)
  }, [])

  // Call after any mutation (create / update / delete) to trigger an immediate refresh.
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
