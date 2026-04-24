import { Play, Pause, Square, Bell, MessageSquare, HelpCircle, Calendar, CheckCheck } from 'lucide-react'
import { useTimer } from '../../context/TimerContext'
import { useAuth } from '../../context/AuthContext'

import { formatSeconds } from '../../utils/formatTime'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { canTrackTime } from '../../utils/roleGuard'
import { notificationService } from '../../services/notificationService'
import { useRealtime } from '../../context/RealtimeContext'

const TYPE_ICON = {
  message: MessageSquare,
  help:    HelpCircle,
  meeting: Calendar,
}
const TYPE_COLOR = {
  message: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  help:    'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  meeting: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
}

function fmtAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000
  if (diff < 60)   return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function StopSessionModal({ isOpen, onClose, onStop }) {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleStop = async () => {
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
          <Button variant="danger" onClick={handleStop} loading={loading} disabled={!description.trim()}>End Session</Button>
        </>
      }>
      <div className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">Describe what you worked on during this session.</p>
        <textarea
          className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-slate-800 dark:border-slate-600 dark:text-gray-100"
          rows={4}
          placeholder="e.g., Reviewed dataset batch #4, completed annotation tasks..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          autoFocus
        />
        {!description.trim() && <p className="text-xs text-red-500">Description is required before ending the session.</p>}
      </div>
    </Modal>
  )
}

function NotificationPanel({ userId, onClose }) {
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const panelRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await notificationService.getNotifications(userId)
    setNotifs(data)
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const handler = e => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const handleRead = async id => {
    await notificationService.markRead(id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const handleReadAll = async () => {
    await notificationService.markAllRead(userId)
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleClick = async notif => {
    await handleRead(notif.id)
    onClose()
    navigate(notif.link || '/dashboard')
  }

  const unread = notifs.filter(n => !n.read).length

  return (
    <div ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900 dark:text-white text-sm">Notifications</span>
          {unread > 0 && (
            <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full font-bold">{unread}</span>
          )}
        </div>
        {unread > 0 && (
          <button onClick={handleReadAll}
            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
            <CheckCheck size={12} /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-700/50">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifs.length === 0 ? (
          <div className="text-center py-10">
            <Bell size={24} className="mx-auto text-gray-300 dark:text-slate-600 mb-2" />
            <p className="text-sm text-gray-400 dark:text-slate-500">All caught up!</p>
          </div>
        ) : notifs.map(n => {
          const Icon = TYPE_ICON[n.type] || Bell
          return (
            <button key={n.id} onClick={() => handleClick(n)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50
                ${!n.read ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${TYPE_COLOR[n.type] || 'bg-gray-100 text-gray-500'}`}>
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-slate-300'}`}>
                  {n.title}
                </p>
                {n.body && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 truncate">{n.body}</p>}
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{fmtAgo(n.created_at)}</p>
              </div>
              {!n.read && <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />}
            </button>
          )
        })}
      </div>

      {notifs.length > 0 && (
        <div className="px-4 py-2.5 border-t border-gray-100 dark:border-slate-700 text-center">
          <p className="text-xs text-gray-400 dark:text-slate-500">{notifs.length} notification{notifs.length !== 1 ? 's' : ''} total</p>
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const { user } = useAuth()

  const { session, elapsed, isRunning, startSession, pauseSession, resumeSession, stopSession } = useTimer()
  const { tick } = useRealtime()
  const [showStop, setShowStop] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return
    notificationService.getNotifications(user.id).then(list => {
      setUnreadCount(list.filter(n => !n.read).length)
    })
  }, [user, tick])

  const handleCloseNotifs = useCallback(() => {
    setShowNotifs(false)
    // Refresh count after panel closes
    if (user) {
      notificationService.getNotifications(user.id).then(list => {
        setUnreadCount(list.filter(n => !n.read).length)
      })
    }
  }, [user])

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-3">
        {canTrackTime(user) && (
          session ? (
            <div className="flex items-center gap-2 bg-slate-900 dark:bg-slate-700 text-white rounded-xl px-3 py-1.5">
              <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
              <span className="font-mono font-bold text-sm tracking-widest">{formatSeconds(elapsed)}</span>
              {isRunning ? (
                <button onClick={pauseSession} className="ml-1 p-1 hover:bg-slate-700 dark:hover:bg-slate-600 rounded" title="Pause">
                  <Pause size={14} />
                </button>
              ) : (
                <button onClick={resumeSession} className="ml-1 p-1 hover:bg-slate-700 dark:hover:bg-slate-600 rounded" title="Resume">
                  <Play size={14} />
                </button>
              )}
              <button onClick={() => setShowStop(true)} className="p-1 hover:bg-red-900/50 rounded" title="End Session">
                <Square size={14} className="text-red-400" />
              </button>
            </div>
          ) : (
            <button onClick={startSession}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 py-1.5 text-sm font-medium transition-colors">
              <Play size={14} /> Start Session
            </button>
          )
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Bell with badge + panel */}
        <div className="relative">
          <button onClick={() => setShowNotifs(v => !v)}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-500 dark:text-gray-400">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifs && (
            <NotificationPanel userId={user?.id} onClose={handleCloseNotifs} />
          )}
        </div>

        <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>
        </div>
      </div>

      <StopSessionModal isOpen={showStop} onClose={() => setShowStop(false)} onStop={stopSession} />
    </header>
  )
}
