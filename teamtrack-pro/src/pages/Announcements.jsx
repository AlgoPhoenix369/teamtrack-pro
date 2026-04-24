import { useState, useEffect, useCallback } from 'react'
import { announcementService } from '../services/announcementService'
import { useAuth } from '../context/AuthContext'
import { useRealtime } from '../context/RealtimeContext'
import { isSuperAdmin } from '../utils/roleGuard'
import toast from 'react-hot-toast'
import { Megaphone, Pin, PinOff, Trash2, Plus, X, Eye } from 'lucide-react'

// ── helpers ───────────────────────────────────────────────────────────
const fmtDate = iso => new Date(iso).toLocaleDateString([], {
  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
})
const fmtTime = iso => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const PRIORITY_META = {
  normal:    { label: 'Normal',    pill: 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400', bar: 'bg-gray-300 dark:bg-slate-600' },
  important: { label: 'Important', pill: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400', bar: 'bg-blue-500' },
  urgent:    { label: 'Urgent',    pill: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',   bar: 'bg-red-500' },
}

// ── Compose modal ─────────────────────────────────────────────────────
function ComposeModal({ onClose, onSave, editItem, currentUser }) {
  const [form, setForm] = useState({
    title:    editItem?.title    || '',
    body:     editItem?.body     || '',
    priority: editItem?.priority || 'normal',
    pinned:   editItem?.pinned   || false,
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim()) return toast.error('Title and body are required')
    setSaving(true)
    try {
      await onSave({ ...form, author_id: currentUser.id })
      onClose()
    } catch { toast.error('Failed to save announcement') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg">
            {editItem ? 'Edit Announcement' : 'New Announcement'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
            <X size={18} className="text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Title *</label>
            <input
              className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.title} onChange={e => set('title', e.target.value)} placeholder="Announcement title" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Message *</label>
            <textarea
              className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={5} value={form.body} onChange={e => set('body', e.target.value)}
              placeholder="Write your announcement here…" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Priority</label>
              <select
                className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <div onClick={() => set('pinned', !form.pinned)}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${form.pinned ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-600'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.pinned ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-gray-700 dark:text-slate-300">Pin to top</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium text-white disabled:opacity-60">
              {saving ? 'Saving…' : editItem ? 'Update' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Announcement card ─────────────────────────────────────────────────
function AnnouncementCard({ item, currentUser, onDelete, onTogglePin, onMarkRead }) {
  const canManage   = isSuperAdmin(currentUser)
  const isRead      = item.reads.includes(currentUser.id)
  const meta        = PRIORITY_META[item.priority] || PRIORITY_META.normal

  useEffect(() => {
    if (!isRead) onMarkRead(item.id)
  }, [item.id])  // mark as read on mount

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md
      ${item.pinned ? 'border-blue-300 dark:border-blue-700' : 'border-gray-100 dark:border-slate-700'}
      ${!isRead ? 'ring-2 ring-blue-400/30 dark:ring-blue-500/20' : ''}`}>
      {/* Priority bar */}
      <div className={`h-1 ${meta.bar}`} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {item.pinned && (
                <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <Pin size={11} /> Pinned
                </span>
              )}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.pill}`}>
                {meta.label}
              </span>
              {!isRead && (
                <span className="text-xs font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full">New</span>
              )}
            </div>

            <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug">{item.title}</h3>
            <p className="text-sm text-gray-600 dark:text-slate-300 mt-2 leading-relaxed whitespace-pre-wrap">{item.body}</p>
          </div>

          {/* Actions */}
          {canManage && (
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => onTogglePin(item)}
                title={item.pinned ? 'Unpin' : 'Pin'}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-400 dark:text-slate-500">
                {item.pinned ? <PinOff size={14} /> : <Pin size={14} />}
              </button>
              <button onClick={() => onDelete(item.id)}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{item.author?.name?.[0]}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">{item.author?.name}</span>
              <span className="text-xs text-gray-400 dark:text-slate-500 ml-2">{fmtDate(item.created_at)} · {fmtTime(item.created_at)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
            <Eye size={12} />
            <span>{item.reads.length} read</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────
export default function Announcements() {
  const { user } = useAuth()
  const { tick, ping } = useRealtime()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCompose, setShowCompose] = useState(false)
  const [filter, setFilter] = useState('all')   // all | unread | pinned

  const load = useCallback(async () => {
    setLoading(true)
    const data = await announcementService.getAll()
    setItems(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load, tick])

  const handleCreate = async data => {
    const item = await announcementService.create(data)
    ping()
    if (item) setItems(prev => [item, ...prev].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.created_at.localeCompare(a.created_at)
    }))
    toast.success('Announcement posted')
  }

  const handleDelete = async id => {
    if (!confirm('Delete this announcement?')) return
    await announcementService.delete(id)
    setItems(prev => prev.filter(a => a.id !== id))
    toast.success('Announcement deleted')
  }

  const handleTogglePin = async item => {
    const updated = await announcementService.update(item.id, { pinned: !item.pinned })
    if (updated) {
      setItems(prev => prev.map(a => a.id === item.id ? updated : a)
        .sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
          return b.created_at.localeCompare(a.created_at)
        }))
    }
  }

  const handleMarkRead = async id => {
    await announcementService.markRead(id, user.id)
    setItems(prev => prev.map(a =>
      a.id === id && !a.reads.includes(user.id)
        ? { ...a, reads: [...a.reads, user.id] } : a
    ))
  }

  const canManage = isSuperAdmin(user)
  const unreadCount = items.filter(a => !a.reads.includes(user.id)).length

  const filtered = items.filter(a => {
    if (filter === 'unread') return !a.reads.includes(user.id)
    if (filter === 'pinned') return a.pinned
    return true
  })

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Megaphone size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Team-wide updates from admins
              {unreadCount > 0 && <span className="ml-2 font-semibold text-blue-600 dark:text-blue-400">{unreadCount} unread</span>}
            </p>
          </div>
        </div>
        {canManage && (
          <button onClick={() => setShowCompose(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
            <Plus size={15} /> Post Announcement
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {[['all','All'], ['unread','Unread'], ['pinned','Pinned']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${filter === val
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}>
            {label}
            {val === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full font-bold">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-40 bg-gray-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Megaphone size={40} className="mx-auto text-gray-300 dark:text-slate-600 mb-3" />
          <p className="text-gray-500 dark:text-slate-400">
            {filter === 'unread' ? 'All caught up — no unread announcements.' :
             filter === 'pinned' ? 'No pinned announcements.' :
             'No announcements yet.'}
          </p>
          {canManage && filter === 'all' && (
            <button onClick={() => setShowCompose(true)}
              className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Post the first one
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(item => (
            <AnnouncementCard
              key={item.id}
              item={item}
              currentUser={user}
              onDelete={handleDelete}
              onTogglePin={handleTogglePin}
              onMarkRead={handleMarkRead}
            />
          ))}
        </div>
      )}

      {showCompose && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
          onSave={handleCreate}
          currentUser={user}
        />
      )}
    </div>
  )
}
