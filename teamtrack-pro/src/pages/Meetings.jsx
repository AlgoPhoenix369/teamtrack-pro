import { useState, useEffect, useCallback } from 'react'
import { meetingService } from '../services/meetingService'
import { useAuth } from '../context/AuthContext'
import { useRealtime } from '../context/RealtimeContext'
import { isAdmin } from '../utils/roleGuard'
import { db } from '../services/mockDb'
import toast from 'react-hot-toast'
import {
  Video, Plus, X, Calendar, Clock, Users, ExternalLink,
  ChevronLeft, ChevronRight, AlertTriangle, Trash2,
  Edit2, Link as LinkIcon, Maximize2, Minimize2,
} from 'lucide-react'

// ── helpers ───────────────────────────────────────────────────────────
const fmt = iso => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
const fmtDate = iso => new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
const toLocal = iso => iso ? iso.slice(0, 16) : ''            // datetime-local value
const toISO = local => local ? new Date(local).toISOString() : ''

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8)    // 08:00–20:00
const COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316']

function colorLabel(hex) {
  const map = {
    '#3B82F6': 'Blue', '#10B981': 'Green', '#F59E0B': 'Amber',
    '#EF4444': 'Red',  '#8B5CF6': 'Purple','#EC4899': 'Pink',
    '#14B8A6': 'Teal', '#F97316': 'Orange',
  }
  return map[hex] || hex
}

// Convert ISO to fractional hour offset from 08:00
function hourOffset(iso) {
  const d = new Date(iso)
  return d.getHours() + d.getMinutes() / 60 - 8
}

function dateStr(d) {
  return d.toISOString().slice(0, 10)
}

// ── ScheduleModal ─────────────────────────────────────────────────────
function ScheduleModal({ onClose, onSave, editMeeting, allUsers, currentUser }) {
  const [form, setForm] = useState({
    title: editMeeting?.title || '',
    description: editMeeting?.description || '',
    meet_link: editMeeting?.meet_link || '',
    start_time: toLocal(editMeeting?.start_time) || '',
    end_time: toLocal(editMeeting?.end_time) || '',
    attendees: editMeeting?.attendees || [currentUser.id],
    color: editMeeting?.color || COLORS[0],
  })
  const [conflicts, setConflicts] = useState([])
  const [checking, setChecking] = useState(false)
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleAttendee = id => {
    set('attendees', form.attendees.includes(id)
      ? form.attendees.filter(x => x !== id)
      : [...form.attendees, id]
    )
  }

  useEffect(() => {
    if (!form.start_time || !form.end_time) { setConflicts([]); return }
    const start = toISO(form.start_time)
    const end   = toISO(form.end_time)
    if (new Date(start) >= new Date(end)) { setConflicts([]); return }
    let cancelled = false
    setChecking(true)
    meetingService.getConflicts(start, end, editMeeting?.id).then(res => {
      if (!cancelled) { setConflicts(res); setChecking(false) }
    })
    return () => { cancelled = true }
  }, [form.start_time, form.end_time, editMeeting?.id])

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    if (!form.start_time || !form.end_time) return toast.error('Start and end time required')
    if (new Date(form.start_time) >= new Date(form.end_time)) return toast.error('End must be after start')
    if (form.attendees.length === 0) return toast.error('Add at least one attendee')
    setSaving(true)
    try {
      const data = {
        ...form,
        start_time: toISO(form.start_time),
        end_time: toISO(form.end_time),
        organizer_id: currentUser.id,
      }
      await onSave(data)
      onClose()
    } catch { toast.error('Failed to save meeting') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg">
            {editMeeting ? 'Edit Meeting' : 'Schedule Meeting'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
            <X size={18} className="text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Title *</label>
            <input
              className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.title} onChange={e => set('title', e.target.value)} placeholder="Meeting title" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Description</label>
            <textarea
              className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          {/* Google Meet Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Google Meet Link</label>
            <div className="relative">
              <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full border border-gray-200 dark:border-slate-600 rounded-lg pl-8 pr-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.meet_link} onChange={e => set('meet_link', e.target.value)}
                placeholder="https://meet.google.com/abc-defg-hij" />
            </div>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Start *</label>
              <input type="datetime-local"
                className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.start_time} onChange={e => set('start_time', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">End *</label>
              <input type="datetime-local"
                className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.end_time} onChange={e => set('end_time', e.target.value)} />
            </div>
          </div>

          {/* Conflict warning */}
          {checking && (
            <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
              <Clock size={12} /> Checking conflicts…
            </p>
          )}
          {!checking && conflicts.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium text-sm mb-1">
                <AlertTriangle size={14} /> {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} detected
              </div>
              {conflicts.map(c => (
                <p key={c.id} className="text-xs text-amber-600 dark:text-amber-500 ml-5">
                  {c.title} · {fmt(c.start_time)} – {fmt(c.end_time)}
                </p>
              ))}
            </div>
          )}

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => set('color', c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-500 scale-110' : 'hover:scale-110'}`}
                  title={colorLabel(c)} />
              ))}
            </div>
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Attendees ({form.attendees.length} selected)
            </label>
            <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-200 dark:border-slate-600 rounded-lg p-2">
              {allUsers.map(u => (
                <label key={u.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.attendees.includes(u.id)}
                    onChange={() => toggleAttendee(u.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: u.color || '#3B82F6' }}>
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-800 dark:text-slate-200">{u.name}</span>
                  <span className="text-xs text-gray-400 dark:text-slate-500 capitalize ml-auto">{u.role?.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium text-white disabled:opacity-60">
              {saving ? 'Saving…' : editMeeting ? 'Update Meeting' : 'Schedule Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── MeetEmbed ──────────────────────────────────────────────────────────
function MeetEmbed({ meeting, onClose }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`fixed ${expanded ? 'inset-0 z-50' : 'bottom-6 right-6 z-40 w-[480px]'} bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col transition-all duration-300`}>
      {/* header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-slate-700">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: meeting.color || '#3B82F6' }} />
        <span className="font-semibold text-sm text-gray-800 dark:text-white flex-1 truncate">{meeting.title}</span>
        <button onClick={() => setExpanded(e => !e)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500 dark:text-slate-400">
          {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500 dark:text-slate-400">
          <X size={14} />
        </button>
      </div>

      {/* embed area */}
      <div className="flex-1 relative overflow-hidden rounded-b-2xl" style={{ minHeight: expanded ? undefined : '280px' }}>
        {meeting.meet_link ? (
          <>
            <iframe
              src={meeting.meet_link}
              className="w-full h-full absolute inset-0"
              allow="camera; microphone; fullscreen; display-capture"
              title={meeting.title}
            />
            {/* Google blocks iframes — overlay shows the fallback */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-700 dark:to-slate-800">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Video size={28} className="text-white" />
              </div>
              <div className="text-center px-6">
                <p className="font-semibold text-gray-800 dark:text-white">{meeting.title}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  {fmtDate(meeting.start_time)} · {fmt(meeting.start_time)} – {fmt(meeting.end_time)}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                  Google Meet can't be embedded — open in a new tab to join.
                </p>
              </div>
              <a href={meeting.meet_link} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-white text-sm font-semibold shadow-md transition-colors">
                <ExternalLink size={15} /> Open Google Meet
              </a>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
            <Video size={32} className="text-gray-300 dark:text-slate-600" />
            <p className="text-sm text-gray-500 dark:text-slate-400">No Google Meet link for this meeting.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── AvailabilityGrid ───────────────────────────────────────────────────
function AvailabilityGrid({ date, allUsers }) {
  const [busy, setBusy] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!date) return
    setLoading(true)
    meetingService.getAvailability(date).then(b => { setBusy(b); setLoading(false) })
  }, [date])

  if (loading) return (
    <div className="flex items-center justify-center h-32">
      <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  )

  const gridH = 360  // px for 8:00–20:00

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Time axis header */}
        <div className="flex border-b border-gray-200 dark:border-slate-700 mb-1">
          <div className="w-28 flex-shrink-0" />
          <div className="flex-1 relative" style={{ height: 20 }}>
            {HOURS.map(h => (
              <span key={h} className="absolute text-xs text-gray-400 dark:text-slate-500 -translate-x-1/2"
                style={{ left: `${((h - 8) / 12) * 100}%` }}>
                {h}:00
              </span>
            ))}
          </div>
        </div>

        {/* Rows */}
        {allUsers.map(u => {
          const slots = busy[u.id] || []
          return (
            <div key={u.id} className="flex items-center mb-2 gap-2">
              {/* Name */}
              <div className="w-28 flex-shrink-0 flex items-center gap-2 pr-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: u.color || '#3B82F6' }}>
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-xs text-gray-700 dark:text-slate-300 truncate">{u.name?.split(' ')[0]}</span>
              </div>

              {/* Timeline bar */}
              <div className="flex-1 relative bg-gray-100 dark:bg-slate-700 rounded-md" style={{ height: 28 }}>
                {/* Hour gridlines */}
                {HOURS.slice(1).map(h => (
                  <div key={h} className="absolute top-0 bottom-0 w-px bg-gray-200 dark:bg-slate-600"
                    style={{ left: `${((h - 8) / 12) * 100}%` }} />
                ))}
                {/* Busy blocks */}
                {slots.map((s, i) => {
                  const startH = hourOffset(s.start)
                  const endH   = hourOffset(s.end)
                  const clampStart = Math.max(0, startH)
                  const clampEnd   = Math.min(12, endH)
                  if (clampEnd <= clampStart) return null
                  const left  = (clampStart / 12) * 100
                  const width = ((clampEnd - clampStart) / 12) * 100
                  return (
                    <div key={i}
                      className="absolute top-1 bottom-1 rounded text-white text-xs flex items-center px-1 overflow-hidden"
                      style={{ left: `${left}%`, width: `${width}%`, backgroundColor: s.color || '#3B82F6' }}
                      title={`${s.title} · ${fmt(s.start)}–${fmt(s.end)}`}>
                      <span className="truncate">{s.title}</span>
                    </div>
                  )
                })}
                {slots.length === 0 && (
                  <span className="absolute inset-0 flex items-center px-2 text-xs text-gray-400 dark:text-slate-500">Free all day</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── MeetingCard ────────────────────────────────────────────────────────
function MeetingCard({ meeting, currentUser, onEdit, onDelete, onJoin }) {
  const canManage = isAdmin(currentUser) || meeting.organizer_id === currentUser.id
  const now = new Date()
  const start = new Date(meeting.start_time)
  const end   = new Date(meeting.end_time)
  const isLive = now >= start && now <= end
  const isPast = now > end

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md
      ${isLive ? 'border-green-400 dark:border-green-500' : 'border-gray-200 dark:border-slate-700'}`}>
      {/* color bar */}
      <div className="h-1.5" style={{ backgroundColor: meeting.color || '#3B82F6' }} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isLive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE
                </span>
              )}
              {isPast && (
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 text-xs rounded-full">Past</span>
              )}
              {meeting.status === 'cancelled' && (
                <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-full">Cancelled</span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{meeting.title}</h3>
            {meeting.description && (
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">{meeting.description}</p>
            )}
          </div>
          {canManage && (
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => onEdit(meeting)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-400 dark:text-slate-500">
                <Edit2 size={13} />
              </button>
              <button onClick={() => onDelete(meeting.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500">
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Time */}
        <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500 dark:text-slate-400">
          <Calendar size={12} />
          <span>{fmtDate(meeting.start_time)}</span>
          <Clock size={12} className="ml-1" />
          <span>{fmt(meeting.start_time)} – {fmt(meeting.end_time)}</span>
        </div>

        {/* Attendees */}
        <div className="flex items-center gap-1.5 mt-2">
          <Users size={12} className="text-gray-400 dark:text-slate-500 flex-shrink-0" />
          <div className="flex -space-x-1.5">
            {(meeting.attendee_users || []).slice(0, 6).map(u => (
              <div key={u.id} title={u.name}
                className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: u.color || '#3B82F6' }}>
                {u.name?.[0]?.toUpperCase()}
              </div>
            ))}
            {(meeting.attendee_users?.length || 0) > 6 && (
              <div className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 bg-gray-200 dark:bg-slate-600 flex items-center justify-center text-gray-600 dark:text-slate-300 text-xs">
                +{meeting.attendee_users.length - 6}
              </div>
            )}
          </div>
          <span className="text-xs text-gray-400 dark:text-slate-500 ml-1">
            {meeting.attendee_users?.length || 0} attendee{meeting.attendee_users?.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Actions */}
        {meeting.meet_link && meeting.status !== 'cancelled' && (
          <div className="flex gap-2 mt-3">
            <a href={meeting.meet_link} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-xs font-medium">
              <ExternalLink size={11} /> Open in Google Meet
            </a>
            <button onClick={() => onJoin(meeting)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 text-xs font-medium">
              <Video size={11} /> View in App
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function Meetings() {
  const { user } = useAuth()
  const { tick, ping } = useRealtime()
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [allUsers, setAllUsers] = useState([])
  const [showSchedule, setShowSchedule] = useState(false)
  const [editMeeting, setEditMeeting] = useState(null)
  const [activeMeet, setActiveMeet] = useState(null)      // meeting displayed in embed
  const [tab, setTab] = useState('upcoming')              // upcoming | past | all
  const [availDate, setAvailDate] = useState(dateStr(new Date()))
  const [showAvail, setShowAvail] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await meetingService.getMeetings()
    setMeetings(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    setAllUsers(db.getUsers())
  }, [load, tick])

  const handleSave = async data => {
    if (editMeeting) {
      await meetingService.updateMeeting(editMeeting.id, data)
      toast.success('Meeting updated')
    } else {
      await meetingService.createMeeting(data)
      toast.success('Meeting scheduled')
    }
    setEditMeeting(null)
    load()
    ping()
  }

  const handleDelete = async id => {
    if (!confirm('Delete this meeting?')) return
    await meetingService.deleteMeeting(id)
    toast.success('Meeting deleted')
    ping()
    if (activeMeet?.id === id) setActiveMeet(null)
    load()
  }

  const openEdit = m => { setEditMeeting(m); setShowSchedule(true) }

  const now = new Date()
  const filtered = meetings.filter(m => {
    const end = new Date(m.end_time)
    if (tab === 'upcoming') return end >= now && m.status !== 'cancelled'
    if (tab === 'past')     return end < now
    return true
  })

  // Stats
  const upcoming = meetings.filter(m => new Date(m.end_time) >= now && m.status !== 'cancelled')
  const today = meetings.filter(m => dateStr(new Date(m.start_time)) === dateStr(now))
  const live   = meetings.filter(m => now >= new Date(m.start_time) && now <= new Date(m.end_time))

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meetings</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">Schedule and manage Google Meet sessions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAvail(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors
              ${showAvail
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
            <Users size={15} /> Availability
          </button>
          <button onClick={() => { setEditMeeting(null); setShowSchedule(true) }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
            <Plus size={15} /> Schedule Meeting
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Upcoming', value: upcoming.length, color: 'blue' },
          { label: 'Today',    value: today.length,    color: 'indigo' },
          { label: 'Live Now', value: live.length,     color: 'green' },
          { label: 'Total',    value: meetings.length, color: 'slate' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{label}</p>
            <p className={`text-2xl font-bold mt-1 text-${color}-600 dark:text-${color}-400`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Availability Grid */}
      {showAvail && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users size={16} /> Team Availability
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={() => {
                const d = new Date(availDate); d.setDate(d.getDate() - 1); setAvailDate(dateStr(d))
              }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                <ChevronLeft size={16} className="text-gray-500 dark:text-slate-400" />
              </button>
              <input type="date" value={availDate} onChange={e => setAvailDate(e.target.value)}
                className="text-sm border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={() => {
                const d = new Date(availDate); d.setDate(d.getDate() + 1); setAvailDate(dateStr(d))
              }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                <ChevronRight size={16} className="text-gray-500 dark:text-slate-400" />
              </button>
            </div>
          </div>
          <AvailabilityGrid date={availDate} allUsers={allUsers} />
        </div>
      )}

      {/* Meetings list */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-gray-100 dark:bg-slate-700 p-1 rounded-xl w-fit">
          {['upcoming', 'past', 'all'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors
                ${tab === t
                  ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Video size={36} className="mx-auto text-gray-300 dark:text-slate-600 mb-3" />
            <p className="text-gray-500 dark:text-slate-400 text-sm">
              {tab === 'upcoming' ? 'No upcoming meetings. Schedule one!' : 'No meetings found.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(m => (
              <MeetingCard
                key={m.id}
                meeting={m}
                currentUser={user}
                onEdit={openEdit}
                onDelete={handleDelete}
                onJoin={setActiveMeet}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals / Panels */}
      {showSchedule && (
        <ScheduleModal
          onClose={() => { setShowSchedule(false); setEditMeeting(null) }}
          onSave={handleSave}
          editMeeting={editMeeting}
          allUsers={allUsers}
          currentUser={user}
        />
      )}

      {activeMeet && (
        <MeetEmbed meeting={activeMeet} onClose={() => setActiveMeet(null)} />
      )}
    </div>
  )
}
