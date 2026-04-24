import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRealtime } from '../context/RealtimeContext'
import { helpService } from '../services/helpService'
import { adminService } from '../services/adminService'
import { isSuperAdmin } from '../utils/roleGuard'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { ConfirmModal } from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonCard } from '../components/ui/Skeleton'
import { formatDateTime } from '../utils/formatTime'
import toast from 'react-hot-toast'
import {
  HelpCircle, Send, CheckCircle, Clock,
  MessageSquare, Plus, Trash2, ChevronDown, ChevronUp, X,
} from 'lucide-react'

const CATEGORIES = ['General', 'Personas', 'Account', 'Team', 'Applications', 'Technical', 'Other']
const PRIORITIES = ['low', 'medium', 'high']

const priorityConfig = {
  low:    { label: 'Low',    cls: 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400' },
  medium: { label: 'Medium', cls: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
  high:   { label: 'High',   cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
}

function NewQueryModal({ isOpen, onClose, onSubmit, admins }) {
  const [form, setForm] = useState({ subject: '', message: '', category: 'General', priority: 'medium', to_user_id: '' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handle = async (e) => {
    e.preventDefault()
    if (!form.subject.trim() || !form.message.trim()) return
    setLoading(true)
    await onSubmit(form)
    setForm({ subject: '', message: '', category: 'General', priority: 'medium', to_user_id: '' })
    setLoading(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit a Query" size="md">
      <form onSubmit={handle} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Send To</label>
          <select value={form.to_user_id} onChange={e => set('to_user_id', e.target.value)}
            className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm dark:bg-slate-800 dark:text-gray-200">
            <option value="">Anyone (Vincent or Judy)</option>
            {admins.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm dark:bg-slate-800 dark:text-gray-200">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Priority</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value)}
              className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm dark:bg-slate-800 dark:text-gray-200">
              {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Subject</label>
          <input value={form.subject} onChange={e => set('subject', e.target.value)} required
            className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm dark:bg-slate-800 dark:text-gray-200"
            placeholder="Brief title for your query" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Message</label>
          <textarea value={form.message} onChange={e => set('message', e.target.value)} required rows={5}
            className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm resize-none dark:bg-slate-800 dark:text-gray-200"
            placeholder="Describe your question or issue in detail..." />
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}><Send size={14} /> Send Query</Button>
        </div>
      </form>
    </Modal>
  )
}

function ResolveModal({ query, onClose, onResolve }) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const handle = async () => {
    setLoading(true)
    await onResolve(query.id, note)
    setLoading(false)
    onClose()
    setNote('')
  }
  return (
    <Modal isOpen={!!query} onClose={onClose} title="Resolve Query" size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="success" onClick={handle} loading={loading}><CheckCircle size={14} /> Mark Resolved</Button>
        </>
      }>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Resolving: <strong className="text-gray-800 dark:text-gray-200">{query?.subject}</strong>
      </p>
      <textarea value={note} onChange={e => setNote(e.target.value)} rows={4}
        className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm resize-none dark:bg-slate-800 dark:text-gray-200"
        placeholder="Add a resolution note (optional but helpful)..." />
    </Modal>
  )
}

function QueryCard({ query, currentUser, onResolve, onDelete, onReply, isAdmin }) {
  const [expanded, setExpanded] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)
  const [showReplyBox, setShowReplyBox] = useState(false)

  const handleReply = async () => {
    if (!replyText.trim()) return
    setReplying(true)
    await onReply(query.id, replyText.trim())
    setReplyText('')
    setShowReplyBox(false)
    setReplying(false)
  }

  const pCfg = priorityConfig[query.priority] || priorityConfig.medium
  const isOwn = query.from_user_id === currentUser.id
  const canDelete = isAdmin || isOwn
  const canResolve = isAdmin && query.status === 'pending'

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border transition-all ${
      query.status === 'resolved'
        ? 'border-green-100 dark:border-green-900/30'
        : 'border-gray-100 dark:border-slate-800'
    }`}>
      {/* Header */}
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(p => !p)}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{query.from_user?.name?.[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{query.subject}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pCfg.cls}`}>{pCfg.label}</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">{query.category}</span>
              {query.status === 'resolved'
                ? <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400"><CheckCircle size={11}/>Resolved</span>
                : <span className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400"><Clock size={11}/>Pending</span>
              }
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              From <strong>{query.from_user?.name}</strong>
              {query.to_user ? <> → <strong>{query.to_user.name}</strong></> : ' → Any admin'}
              {' · '}{formatDateTime(query.created_at)}
              {query.replies?.length > 0 && <> · <span className="text-blue-600 dark:text-blue-400">{query.replies.length} {query.replies.length === 1 ? 'reply' : 'replies'}</span></>}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {canDelete && (
              <button onClick={e => { e.stopPropagation(); onDelete(query.id) }}
                className="p-1 text-gray-300 dark:text-slate-600 hover:text-red-500 transition-colors rounded">
                <Trash2 size={13} />
              </button>
            )}
            {expanded ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
          </div>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 dark:border-slate-800 pt-3 space-y-3">
          {/* Original message */}
          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {query.message}
          </div>

          {/* Replies thread */}
          {query.replies?.length > 0 && (
            <div className="space-y-2 pl-4 border-l-2 border-blue-100 dark:border-blue-900/40">
              {query.replies.map(r => (
                <div key={r.id} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{r.from_user?.name?.[0]}</span>
                  </div>
                  <div className="flex-1 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-lg p-2.5">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{r.from_user?.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{r.text}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(r.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resolution note */}
          {query.status === 'resolved' && query.resolution_note && (
            <div className="flex gap-2 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/40 rounded-xl p-3">
              <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-green-700 dark:text-green-400">Resolution Note</p>
                <p className="text-sm text-green-800 dark:text-green-300 mt-0.5">{query.resolution_note}</p>
              </div>
            </div>
          )}

          {/* Reply box */}
          {showReplyBox ? (
            <div className="flex gap-2">
              <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                className="flex-1 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-gray-200"
                rows={2} placeholder="Type a reply..." autoFocus />
              <div className="flex flex-col gap-1">
                <button onClick={handleReply} disabled={replying || !replyText.trim()}
                  className="p-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors disabled:opacity-40">
                  <Send size={14} />
                </button>
                <button onClick={() => { setShowReplyBox(false); setReplyText('') }}
                  className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 text-gray-600 dark:text-gray-400 rounded-lg transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              {query.status === 'pending' && (
                <button onClick={() => setShowReplyBox(true)}
                  className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  <MessageSquare size={13} /> Reply
                </button>
              )}
              {canResolve && (
                <button onClick={() => onResolve(query)}
                  className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 hover:underline ml-auto">
                  <CheckCircle size={13} /> Mark as Resolved
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function HelpDesk() {
  const { user } = useAuth()
  const { tick, ping } = useRealtime()
  const [queries, setQueries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [resolveTarget, setResolveTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [admins, setAdmins] = useState([])
  const [tab, setTab] = useState('all')

  const isAdmin = isSuperAdmin(user)

  useEffect(() => { load() }, [user, tick])
  useEffect(() => {
    adminService.getAllUsers()
      .then(all => setAdmins((all || []).filter(u => u.role === 'super_admin')))
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      // Admins see all; taskers see their own + ones directed to any admin
      const data = isAdmin
        ? await helpService.getQueries()
        : await helpService.getQueries({ from_user_id: user.id })
      setQueries(data || [])
    } catch { setQueries([]) }
    finally { setLoading(false) }
  }

  const handleCreate = async (formData) => {
    const q = await helpService.createQuery({
      ...formData,
      from_user_id: user.id,
      to_user_id: formData.to_user_id || null,
    })
    setQueries(prev => [q, ...prev])
    toast.success('Query sent!')
    ping()
  }

  const handleResolve = async (id, note) => {
    const updated = await helpService.resolveQuery(id, user.id, note)
    setQueries(prev => prev.map(q => q.id === id ? { ...q, ...updated } : q))
    toast.success('Query resolved!')
  }

  const handleReply = async (queryId, text) => {
    const reply = await helpService.addReply(queryId, user.id, text)
    setQueries(prev => prev.map(q =>
      q.id === queryId
        ? { ...q, replies: [...(q.replies || []), reply] }
        : q
    ))
    toast.success('Reply sent!')
  }

  const handleDelete = async () => {
    await helpService.deleteQuery(deleteTarget)
    setQueries(prev => prev.filter(q => q.id !== deleteTarget))
    setDeleteTarget(null)
    toast.success('Query deleted')
  }

  const tabs = [
    { id: 'all',      label: 'All',      filter: () => true },
    { id: 'pending',  label: 'Pending',  filter: q => q.status === 'pending' },
    { id: 'resolved', label: 'Resolved', filter: q => q.status === 'resolved' },
    { id: 'mine',     label: 'My Queries', filter: q => q.from_user_id === user.id },
  ]

  const filtered = queries.filter(tabs.find(t => t.id === tab)?.filter || (() => true))
  const pendingCount = queries.filter(q => q.status === 'pending').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <HelpCircle size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Help Desk</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {isAdmin ? 'Manage team queries and support requests' : 'Ask Vincent or Judy for help'}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus size={15} /> New Query
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Queries',  value: queries.length, color: 'text-blue-700 dark:text-blue-400' },
          { label: 'Pending',        value: queries.filter(q => q.status === 'pending').length,  color: 'text-yellow-600 dark:text-yellow-400' },
          { label: 'Resolved',       value: queries.filter(q => q.status === 'resolved').length, color: 'text-green-600 dark:text-green-400' },
          { label: 'High Priority',  value: queries.filter(q => q.priority === 'high' && q.status === 'pending').length, color: 'text-red-600 dark:text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-4 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-800 gap-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
              ${tab === t.id
                ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>
            {t.label}
            {t.id === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Queries list */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={HelpCircle} title="No queries here"
          description={tab === 'pending' ? 'All caught up! No pending queries.' : 'No queries to show.'}
          action={tab === 'all' && <Button onClick={() => setShowNew(true)}><Plus size={14}/>Submit a query</Button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(q => (
            <QueryCard key={q.id} query={q} currentUser={user}
              isAdmin={isAdmin}
              onResolve={setResolveTarget}
              onDelete={id => setDeleteTarget(id)}
              onReply={handleReply}
            />
          ))}
        </div>
      )}

      <NewQueryModal isOpen={showNew} onClose={() => setShowNew(false)}
        onSubmit={handleCreate} admins={admins} currentUser={user} />

      <ResolveModal query={resolveTarget} onClose={() => setResolveTarget(null)}
        onResolve={handleResolve} />

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} title="Delete Query"
        message="Delete this query? This cannot be undone." />
    </div>
  )
}
