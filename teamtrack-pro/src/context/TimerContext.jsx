import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { sessionService } from '../services/sessionService'
import { useAuth } from './AuthContext'
import { TZ_KENYA, todayInTz } from '../utils/timezone'
import toast from 'react-hot-toast'

const TimerContext = createContext(null)

const STORAGE_KEY = 'timer_state'

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function TimerProvider({ children }) {
  const { user } = useAuth()
  const [session, setSession] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [entries, setEntries] = useState([])
  const [sessionEvents, setSessionEvents] = useState([])
  const intervalRef = useRef(null)
  const startTimeRef = useRef(null)
  const baseElapsedRef = useRef(0)

  // Keep refs in sync so the logout effect never captures stale values
  const sessionRef       = useRef(session)
  const elapsedRef       = useRef(elapsed)
  const sessionEventsRef = useRef(sessionEvents)
  const userRef          = useRef(user)
  useEffect(() => { sessionRef.current       = session       }, [session])
  useEffect(() => { elapsedRef.current       = elapsed       }, [elapsed])
  useEffect(() => { sessionEventsRef.current = sessionEvents }, [sessionEvents])
  useEffect(() => { userRef.current          = user          }, [user])

  // Restore persisted timer on mount
  useEffect(() => {
    if (!user) return
    const saved = loadPersistedState()
    if (saved && saved.userId === user.id && saved.session) {
      setSession(saved.session)
      setElapsed(saved.elapsed || 0)
      setSessionEvents(saved.sessionEvents || [])
      baseElapsedRef.current = saved.elapsed || 0
      if (saved.isRunning) {
        startTimeRef.current = Date.now() - (saved.elapsed * 1000)
        setIsRunning(true)
      }
    }
  }, [user])

  // Auto-stop session when user logs out
  useEffect(() => {
    if (user || !sessionRef.current) return
    // User just became null (logged out) while a session was active
    const prevUser    = userRef.current
    const activeSession = sessionRef.current
    const currentElapsed = elapsedRef.current
    const currentEvents  = sessionEventsRef.current || []

    clearInterval(intervalRef.current)
    setIsRunning(false)
    const stopEvent = { type: 'stop', at: new Date().toISOString(), elapsed: currentElapsed, reason: 'logout' }
    ;(async () => {
      try {
        await sessionService.stopSession(
          activeSession.id,
          'Auto-saved on logout',
          currentElapsed,
          [...currentEvents, stopEvent],
          prevUser,
        )
      } catch {}
      setSession(null)
      setElapsed(0)
      setEntries([])
      setSessionEvents([])
      localStorage.removeItem(STORAGE_KEY)
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const now = Date.now()
        const newElapsed = Math.floor((now - startTimeRef.current) / 1000)
        setElapsed(newElapsed)
        persistState(newElapsed)
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [isRunning])

  const persistState = (currentElapsed, events) => {
    if (!session || !user) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      userId: user.id,
      session,
      elapsed: currentElapsed,
      isRunning: true,
      sessionEvents: events,
    }))
  }

  const startSession = useCallback(async () => {
    if (!user) return
    try {
      const localDate = todayInTz(TZ_KENYA)
      const newSession = await sessionService.createSession(user.id, localDate)
      const startEvent = { type: 'start', at: new Date().toISOString(), elapsed: 0 }
      setSession(newSession)
      setElapsed(0)
      setSessionEvents([startEvent])
      baseElapsedRef.current = 0
      startTimeRef.current = Date.now()
      setIsRunning(true)
      setEntries([])
      toast.success('Session started!')
    } catch {
      toast.error('Failed to start session')
    }
  }, [user])

  const pauseSession = useCallback(async () => {
    if (!session) return
    clearInterval(intervalRef.current)
    setIsRunning(false)
    baseElapsedRef.current = elapsed
    const pauseEvent = { type: 'pause', at: new Date().toISOString(), elapsed }
    setSessionEvents(prev => {
      const updated = [...prev, pauseEvent]
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        userId: user?.id, session, elapsed, isRunning: false, sessionEvents: updated,
      }))
      return updated
    })
    await sessionService.pauseSession(session.id, user)
    toast('Session paused', { icon: '⏸' })
  }, [session, elapsed, user])

  const resumeSession = useCallback(async () => {
    if (!session) return
    startTimeRef.current = Date.now() - (elapsed * 1000)
    setIsRunning(true)
    const resumeEvent = { type: 'resume', at: new Date().toISOString(), elapsed }
    setSessionEvents(prev => {
      const updated = [...prev, resumeEvent]
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        userId: user?.id, session, elapsed, isRunning: true, sessionEvents: updated,
      }))
      return updated
    })
    await sessionService.resumeSession(session.id, user)
    toast('Session resumed', { icon: '▶️' })
  }, [session, elapsed, user])

  const stopSession = useCallback(async (description) => {
    if (!session) return
    clearInterval(intervalRef.current)
    setIsRunning(false)
    const stopEvent = { type: 'stop', at: new Date().toISOString(), elapsed }
    const finalEvents = [...sessionEvents, stopEvent]
    await sessionService.stopSession(session.id, description, elapsed, finalEvents, user)
    setSession(null)
    setElapsed(0)
    setEntries([])
    setSessionEvents([])
    localStorage.removeItem(STORAGE_KEY)
    toast.success('Session saved!')
  }, [session, elapsed, sessionEvents])

  const addEntry = useCallback(async (entryData) => {
    if (!session || !user) return
    const entry = await sessionService.addActivityEntry({
      ...entryData,
      session_id: session.id,
      user_id: user.id,
    })
    setEntries(prev => [entry, ...prev])
    return entry
  }, [session, user])

  return (
    <TimerContext.Provider value={{
      session, elapsed, isRunning, entries, setEntries, sessionEvents,
      startSession, pauseSession, resumeSession, stopSession, addEntry,
    }}>
      {children}
    </TimerContext.Provider>
  )
}

export function useTimer() {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error('useTimer must be used within TimerProvider')
  return ctx
}
