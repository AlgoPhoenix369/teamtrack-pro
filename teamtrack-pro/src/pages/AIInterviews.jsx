import { useState, useEffect, useCallback } from 'react'
import { aiInterviewService, PLATFORMS, STATUS_META, PLATFORM_COLORS } from '../services/aiInterviewService'
import { useAuth } from '../context/AuthContext'
import { useRealtime } from '../context/RealtimeContext'
import { isAdmin } from '../utils/roleGuard'
import { db } from '../services/mockDb'
import toast from 'react-hot-toast'
import {
  Bot, Plus, X, ExternalLink, Trash2, Edit2,
  Calendar, Clock, CheckCircle, AlertTriangle, Hourglass,
  ChevronDown, ChevronUp,
} from 'lucide-react'

// ── helpers ───────────────────────────────────────────────────────────
const fmtDT = iso => iso ? new Date(iso).toLocaleString([], {
  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
}) : '—'

const scoreColor = s =>
  s == null ? 'text-gray-400 dark:text-slate-500'
  : s >= 80  ? 'text-green-600 dark:text-green-400'
  : s >= 60  ? 'text-amber-600 dark:text-amber-400'
  : 'text-red-600 dark:text-red-400'

const ScoreBar = ({ score }) => {
  if (score == null) return <span className="text-xs text-gray-400 dark:text-slate-500">No score yet</span>
  const pct = Math.min(score, 100)
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-400' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-sm font-bold ${scoreColor(score)}`}>{score}</span>
    </div>
  )
}

// ── InterviewForm ─────────────────────────────────────────────────────
function InterviewForm({ onClose, onSave, initial, applications, currentUser }) {
  const myApps = isAdmin(currentUser)
    ? applications
    : applications.filter(a => a.owner_id === currentUser.id)

  const [form, setForm] = useState({
    application_id: initial?.application_id || '',
    user_id:        initial?.user_id        || currentUser.id,
    platform:       initial?.platform       || 'HireVue',
    status:         initial?.status         || 'scheduled',
    scheduled_at:   initial?.scheduled_at ? initial.scheduled_at.slice(0,16) : '',
    completed_at:   initial?.completed_at ? initial.completed_at.slice(0,16) : '',
    duration_minutes: initial?.duration_minutes || 45,
    score:          initial?.score ?? '',
    feedback:       initial?.feedback       || '',
    link:           initial?.link           || '',
    prep_notes:     initial?.prep_notes     || '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.application_id) return toast.error('Select an application')
    if (!form.scheduled_at)   return toast.error('Scheduled time is required')
    setSaving(true)
    try {
      const payload = {
        ...form,
        score: form.score === '' ? null : Number(form.score),
        scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
        completed_at: form.completed_at ? new Date(form.completed_at).toISOString() : null,
        duration_minutes: Number(form.duration_minutes),
      }
      await onSave(payload)
      onClose()
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const allStatuses = Object.entries(STATUS_META)

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
            <Bot size={18} className="text-blue-600" />
            {initial ? 'Edit AI Interview' : 'Log AI Interview'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
            <X size={18} className="text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Application */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Application *</label>
            <select className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.application_id} onChange={e => set('application_id', e.target.value)}>
              <option value="">Select application…</option>
              {myApps.map(a => (
                <option key={a.id} value={a.id}>{a.company_name} — {a.job_title}</option>
              ))}
            </select>
          </div>

          {/* Platform + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Platform</label>
              <select className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.platform} onChange={e => set('platform', e.target.value)}>
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Status</label>
              <select className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.status} onChange={e => set('status', e.target.value)}>
                {allStatuses.map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Scheduled *</label>
              <input type="datetime-local"
                className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.scheduled_at} onChange={e => set('scheduled_at', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Duration (min)</label>
              <input type="number"
                className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.duration_minutes} onChange={e => set('duration_minutes', e.target.value)} min={1} max={240} />
            </div>
          </div>

          {/* Completed at + Score (only if relevant) */}
          {['completed','failed','pending_review'].includes(form.status) && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Completed At</label>
                <input type="datetime-local"
                  className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.completed_at} onChange={e => set('completed_at', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Score (0–100)</label>
                <input type="number"
                  className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.score} onChange={e => set('score', e.target.value)} min={0} max={100}
                  placeholder="Optional" />
              </div>
            </div>
          )}

          {/* Interview link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Interview Link</label>
            <input className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.link} onChange={e => set('link', e.target.value)} placeholder="https://…" />
          </div>

          {/* Feedback */}
          {['completed','failed','pending_review'].includes(form.status) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Feedback / Result</label>
              <textarea
                className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3} value={form.feedback} onChange={e => set('feedback', e.target.value)}
                placeholder="Notes on how it went, AI feedback received…" />
            </div>
          )}

          {/* Prep notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Prep Notes</label>
            <textarea
              className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2} value={form.prep_notes} onChange={e => set('prep_notes', e.target.value)}
              placeholder="What you studied or prepared…" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium text-white disabled:opacity-60">
              {saving ? 'Saving…' : initial ? 'Update' : 'Log Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Interview card ────────────────────────────────────────────────────
function InterviewCard({ item, currentUser, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const statusMeta = STATUS_META[item.status] || STATUS_META.scheduled
  const canManage = isAdmin(currentUser) || item.user_id === currentUser.id
  const platformColor = PLATFORM_COLORS[item.platform] || '#6B7280'

  const statusIcon = {
    scheduled:      <Calendar size={13} />,
    in_progress:    <Clock size={13} />,
    completed:      <CheckCircle size={13} />,
    pending_review: <Hourglass size={13} />,
    failed:         <AlertTriangle size={13} />,
    cancelled:      <X size={13} />,
  }[item.status] || <Calendar size={13} />

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-all">
      {/* Platform colour strip */}
      <div className="h-1" style={{ backgroundColor: platformColor }} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Company + role */}
            <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
              {item.application?.company_name || 'Unknown Company'}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
              {item.application?.job_title || '—'}
              {item.user && isAdmin(currentUser) && (
                <span className="ml-2 text-gray-400 dark:text-slate-500">· {item.user.name}</span>
              )}
            </p>
          </div>
          {canManage && (
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => onEdit(item)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-400">
                <Edit2 size={13} />
              </button>
              <button onClick={() => onDelete(item.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500">
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Platform + status row */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: platformColor }}>
            <Bot size={11} /> {item.platform}
          </span>
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusMeta.color}`}>
            {statusIcon} {statusMeta.label}
          </span>
          {item.duration_minutes && (
            <span className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
              <Clock size={11} /> {item.duration_minutes}m
            </span>
          )}
        </div>

        {/* Score bar */}
        {(item.status === 'completed' || item.status === 'pending_review') && (
          <div className="mt-3">
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Score</p>
            <ScoreBar score={item.score} />
          </div>
        )}

        {/* Date */}
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 flex items-center gap-1">
          <Calendar size={10} />
          {item.status === 'scheduled' ? 'Scheduled: ' : 'Completed: '}
          {fmtDT(item.status === 'scheduled' ? item.scheduled_at : (item.completed_at || item.scheduled_at))}
        </p>

        {/* Link */}
        {item.link && (
          <a href={item.link} target="_blank" rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
            <ExternalLink size={11} /> Open Interview
          </a>
        )}

        {/* Expandable details */}
        {(item.feedback || item.prep_notes) && (
          <>
            <button onClick={() => setExpanded(v => !v)}
              className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200">
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? 'Less' : 'Details'}
            </button>
            {expanded && (
              <div className="mt-3 space-y-2 text-xs">
                {item.feedback && (
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3">
                    <p className="font-semibold text-gray-700 dark:text-slate-300 mb-1">AI Feedback</p>
                    <p className="text-gray-600 dark:text-slate-400 leading-relaxed">{item.feedback}</p>
                  </div>
                )}
                {item.prep_notes && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                    <p className="font-semibold text-blue-700 dark:text-blue-400 mb-1">Prep Notes</p>
                    <p className="text-blue-600 dark:text-blue-300 leading-relaxed">{item.prep_notes}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Stats bar ─────────────────────────────────────────────────────────
function StatsBar({ stats }) {
  const items = [
    { label: 'Total',          value: stats.total,     color: 'text-gray-800 dark:text-white'          },
    { label: 'Scheduled',      value: stats.scheduled, color: 'text-blue-600 dark:text-blue-400'       },
    { label: 'Completed',      value: stats.completed, color: 'text-green-600 dark:text-green-400'     },
    { label: 'Did Not Pass',   value: stats.failed,    color: 'text-red-600 dark:text-red-400'         },
    { label: 'Avg Score',      value: stats.avgScore != null ? `${stats.avgScore}` : '—', color: scoreColor(stats.avgScore) },
    { label: 'Pass Rate',      value: `${stats.passRate}%`, color: 'text-purple-600 dark:text-purple-400' },
  ]
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {items.map(({ label, value, color }) => (
        <div key={label} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-3 text-center shadow-sm">
          <p className="text-xs text-gray-500 dark:text-slate-400">{label}</p>
          <p className={`text-xl font-black mt-0.5 ${color}`}>{value}</p>
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────
export default function AIInterviews() {
  const { user } = useAuth()
  const { tick, ping } = useRealtime()
  const [interviews, setInterviews] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('')
  const [filterUserId, setFilterUserId] = useState('')
  const [allUsers, setAllUsers] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    const filters = {}
    if (!isAdmin(user)) filters.user_id = user.id
    else if (filterUserId) filters.user_id = filterUserId
    const [data, apps, users] = await Promise.all([
      aiInterviewService.getAll(filters),
      Promise.resolve(db.getApplications(isAdmin(user) ? {} : { owner_id: user.id })),
      Promise.resolve(db.getUsers()),
    ])
    setInterviews(data)
    setApplications(apps)
    setAllUsers(users)
    setLoading(false)
  }, [user, filterUserId])

  useEffect(() => { load() }, [load, tick])

  const handleSave = async data => {
    if (editItem) {
      const updated = await aiInterviewService.update(editItem.id, data)
      setInterviews(prev => prev.map(x => x.id === editItem.id ? updated : x))
      toast.success('Interview updated')
    } else {
      const created = await aiInterviewService.create(data)
      setInterviews(prev => [created, ...prev])
      toast.success('Interview logged')
    }
    ping()
    setEditItem(null)
  }

  const handleDelete = async id => {
    if (!confirm('Delete this AI interview record?')) return
    await aiInterviewService.delete(id)
    setInterviews(prev => prev.filter(x => x.id !== id))
    toast.success('Deleted')
  }

  const openEdit = item => { setEditItem(item); setShowForm(true) }

  const filtered = interviews.filter(x => {
    if (filterStatus   && x.status   !== filterStatus)   return false
    if (filterPlatform && x.platform !== filterPlatform) return false
    return true
  })

  const stats = aiInterviewService.computeStats(filtered)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Interviews</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Track and review AI-guided interview sessions</p>
          </div>
        </div>
        <button onClick={() => { setEditItem(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
          <Plus size={15} /> Log AI Interview
        </button>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} />

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-3 flex gap-2 flex-wrap items-center">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 focus:outline-none">
          <option value="">All Statuses</option>
          {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}
          className="border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 focus:outline-none">
          <option value="">All Platforms</option>
          {PLATFORMS.map(p => <option key={p}>{p}</option>)}
        </select>
        {isAdmin(user) && (
          <select value={filterUserId} onChange={e => setFilterUserId(e.target.value)}
            className="border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 focus:outline-none">
            <option value="">All Members</option>
            {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
        <span className="ml-auto text-xs text-gray-400 dark:text-slate-500">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-gray-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Bot size={40} className="mx-auto text-gray-300 dark:text-slate-600 mb-3" />
          <p className="text-gray-500 dark:text-slate-400">No AI interviews logged yet.</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
            Log your first one
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <InterviewCard key={item.id} item={item} currentUser={user} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showForm && (
        <InterviewForm
          onClose={() => { setShowForm(false); setEditItem(null) }}
          onSave={handleSave}
          initial={editItem}
          applications={applications}
          currentUser={user}
        />
      )}
    </div>
  )
}
