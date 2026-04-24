import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTimer } from '../context/TimerContext'
import { sessionService } from '../services/sessionService'
import { formatSeconds, formatDuration } from '../utils/formatTime'
import { TZ_KENYA, todayInTz, fmtDateTimeInTz, tzLabel } from '../utils/timezone'
import { useRealtime } from '../context/RealtimeContext'
import { isAdmin } from '../utils/roleGuard'
import ActivityEntryForm from '../components/timer/ActivityEntryForm'
import EntryFeed from '../components/timer/EntryFeed'
import SessionCard from '../components/timer/SessionCard'
import StatsCard from '../components/ui/StatsCard'
import { SkeletonCard } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { exportToCSV } from '../utils/exportCSV'
import { Clock, Play, Pause, Square, Users, Download, Calendar } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { startOfWeek, addDays, format } from 'date-fns'
import toast from 'react-hot-toast'

function StopModal({ isOpen, onClose, onStop }) {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const handle = async () => {
    if (!description.trim()) return
    setLoading(true)
    await onStop(description.trim())
    setLoading(false)
    onClose()
    setDescription('')
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="End Session"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={handle} loading={loading} disabled={!description.trim()}>
            Stop & Save
          </Button>
        </>
      }>
      <div className="space-y-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">Briefly describe what you worked on — required to save.</p>
        <textarea
          value={description} onChange={e => setDescription(e.target.value)}
          rows={4} autoFocus
          placeholder="e.g. Reviewed dataset batch #4, completed annotation tasks for Project X..."
          className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm resize-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-gray-100 dark:placeholder:text-slate-500"
        />
        {!description.trim() && (
          <p className="text-xs text-red-500">Session description is required.</p>
        )}
      </div>
    </Modal>
  )
}

export default function TimeTracker() {
  const { user } = useAuth()
  const { session, elapsed, isRunning, entries, startSession, pauseSession, resumeSession, stopSession } = useTimer()
  const { tick, ping } = useRealtime()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterUser, setFilterUser] = useState(user?.id)
  const [allUsers, setAllUsers] = useState([])
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [showStop, setShowStop] = useState(false)

  useEffect(() => {
    loadSessions()
    if (isAdmin(user)) loadAllUsers()
  }, [user, filterUser, dateRange, tick])

  const loadSessions = async () => {
    setLoading(true)
    try {
      const data = isAdmin(user)
        ? await sessionService.getAllSessions({ userId: filterUser || undefined, ...dateRange })
        : await sessionService.getSessionsByUser(user.id, dateRange)
      setSessions(data || [])
    } catch { setSessions([]) }
    finally { setLoading(false) }
  }

  const loadAllUsers = async () => {
    const { adminService } = await import('../services/adminService.js')
    const users = await adminService.getAllUsers()
    setAllUsers(users || [])
  }

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i)
    const dayStr = format(day, 'yyyy-MM-dd')
    const total = sessions.filter(s => s.date === dayStr).reduce((acc, s) => acc + (s.total_seconds || 0), 0)
    return { day: format(day, 'EEE'), hours: +(total / 3600).toFixed(1) }
  })

  const handleStop = async (desc) => { await stopSession(desc); ping() }

  const userTz   = TZ_KENYA
  const todayStr = todayInTz(TZ_KENYA)
  const completedSessions = sessions.filter(s => s.status === 'completed')
  const todaySecs = sessions.filter(s => s.date === todayStr).reduce((acc, s) => acc + (s.total_seconds || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Time Tracker</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Log sessions and track your productivity</p>
        </div>
        <button
          onClick={() => exportToCSV(completedSessions.map(s => ({
            date: s.date, duration: formatDuration(s.total_seconds || 0),
            description: s.description, entries: (s.activity_entries || []).length,
            user: s.users?.name || user?.name,
          })), 'sessions')}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Today" value={formatDuration(todaySecs)} icon={Clock} color="blue"
          subtitle={<span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-0.5">
            <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">{tzLabel(userTz)}</span>
          </span>} />
        <StatsCard title="This Week" value={formatDuration(weekData.reduce((a, d) => a + d.hours * 3600, 0))} icon={Calendar} color="purple"
          subtitle={<span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-0.5">
            <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">{tzLabel(userTz)}</span>
          </span>} />
        <StatsCard title="Total Sessions" value={completedSessions.length} icon={Users} color="green" />
      </div>

      {/* Active session */}
      {session ? (
        <div className="bg-gradient-to-br from-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
              <span className="font-semibold">{isRunning ? 'Session Running' : 'Session Paused'}</span>
            </div>
            <span className="text-blue-200 text-xs">
              {fmtDateTimeInTz(new Date().toISOString(), userTz)} · {tzLabel(userTz)}
            </span>
          </div>

          {/* Big timer */}
          <div className="font-mono text-6xl font-black tracking-widest text-center py-4">
            {formatSeconds(elapsed)}
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-3 mt-2 mb-6">
            {isRunning ? (
              <button
                onClick={() => { pauseSession(); toast('Session paused', { icon: '⏸' }) }}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border border-white/20"
              >
                <Pause size={16} /> Pause
              </button>
            ) : (
              <button
                onClick={() => { resumeSession(); toast('Session resumed', { icon: '▶️' }) }}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow"
              >
                <Play size={16} /> Resume
              </button>
            )}
            <button
              onClick={() => setShowStop(true)}
              className="flex items-center gap-2 bg-red-500/80 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border border-red-400/40"
            >
              <Square size={16} /> Stop & Save
            </button>
          </div>

          <ActivityEntryForm />
          <EntryFeed entries={entries} />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700 p-10 text-center">
          <Clock size={44} className="mx-auto text-gray-200 dark:text-slate-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">No active session. Start one to begin tracking.</p>
          <button
            onClick={startSession}
            className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors shadow"
          >
            <Play size={16} /> Start Session
          </button>
        </div>
      )}

      {/* Weekly chart */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-5">
        <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Weekly Activity</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weekData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} unit="h" />
            <Tooltip
              formatter={(v) => [`${v}h`, 'Hours']}
              contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }}
            />
            <Bar dataKey="hours" fill="#1E40AF" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Session history */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-5">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">Session History</h2>
          <div className="flex gap-2 flex-wrap">
            {isAdmin(user) && (
              <select value={filterUser} onChange={e => setFilterUser(e.target.value)}
                className="border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 rounded-lg px-3 py-1.5 text-sm">
                <option value="">All Users</option>
                {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            )}
            <input type="date" value={dateRange.start}
              onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))}
              className="border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 rounded-lg px-3 py-1.5 text-sm" />
            <input type="date" value={dateRange.end}
              onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
              className="border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 rounded-lg px-3 py-1.5 text-sm" />
          </div>
        </div>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
        ) : sessions.length === 0 ? (
          <EmptyState icon={Clock} title="No sessions yet" description="Start your first session to see it here." />
        ) : (
          <div className="space-y-3">
            {sessions.map(s => <SessionCard key={s.id} session={s} tz={userTz} />)}
          </div>
        )}
      </div>

      <StopModal isOpen={showStop} onClose={() => setShowStop(false)} onStop={handleStop} />
    </div>
  )
}
