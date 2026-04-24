import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRealtime } from '../context/RealtimeContext'
import { milestoneService } from '../services/milestoneService'
import { adminService } from '../services/adminService'
import { isAdmin, isSuperAdmin, isAssignable, isTasker } from '../utils/roleGuard'
import { formatDate } from '../utils/formatTime'
import {
  Flag, Plus, Pencil, Trash2, X, ChevronDown, ChevronUp,
  CheckCircle2, Circle, Clock, AlertTriangle, Users, Zap,
  SendHorizontal, ThumbsUp, Undo2,
} from 'lucide-react'
import toast from 'react-hot-toast'

const PRIORITIES = ['low', 'medium', 'high', 'critical']
const CATEGORIES = ['Annotation', 'Research', 'Review', 'Communication', 'Application', 'Training', 'Software Engineering', 'Other']
const STATUSES   = ['pending', 'in_progress', 'submitted', 'done']

const PRIORITY_META = {
  low:      { label: 'Low',      cls: 'bg-slate-700 text-slate-300',          dot: 'bg-slate-400'   },
  medium:   { label: 'Medium',   cls: 'bg-blue-900/50 text-blue-300',          dot: 'bg-blue-400'    },
  high:     { label: 'High',     cls: 'bg-amber-900/50 text-amber-300',        dot: 'bg-amber-400'   },
  critical: { label: 'Critical', cls: 'bg-red-900/50 text-red-300 font-bold',  dot: 'bg-red-500'     },
}

const STATUS_META = {
  pending:     { label: 'Pending',           icon: Circle,          cls: 'bg-slate-700 text-slate-300'        },
  in_progress: { label: 'In Progress',       icon: Zap,             cls: 'bg-blue-900/50 text-blue-300'       },
  submitted:   { label: 'Awaiting Approval', icon: SendHorizontal,  cls: 'bg-amber-900/50 text-amber-300'     },
  done:        { label: 'Done',              icon: CheckCircle2,    cls: 'bg-green-900/50 text-green-300'     },
}

function isOverdue(dueDate, status) {
  if (!dueDate || status === 'done') return false
  return new Date(dueDate) < new Date(new Date().toDateString())
}

function MilestoneForm({ initial, allUsers, currentUser, onSave, onClose }) {
  const admin  = isAdmin(currentUser)
  const tasker = isTasker(currentUser)
  const [form, setForm] = useState({
    title:       initial?.title       || '',
    description: initial?.description || '',
    assigned_to: initial?.assigned_to || (admin ? '' : currentUser.id),
    due_date:    initial?.due_date    || '',
    priority:    initial?.priority    || 'medium',
    category:    initial?.category    || 'Annotation',
    status:      initial?.status      || 'pending',
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.title.trim())               return toast.error('Title is required')
    if (admin && !form.assigned_to)       return toast.error('Select a team member')
    setSaving(true)
    await onSave({ ...form, created_by: initial?.created_by || currentUser.id })
    setSaving(false)
  }

  const taskers = allUsers.filter(u => isAssignable(u))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
          <h2 className="font-bold text-slate-100 flex items-center gap-2">
            <Flag size={16} className="text-blue-400" />
            {initial ? 'Edit Milestone' : tasker ? 'Create Personal Milestone' : 'Create Milestone'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Title <span className="text-red-400">*</span></label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. Complete 300 annotation tasks by Friday"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={3} placeholder="Detailed instructions or context…"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 resize-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {admin && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Assign To <span className="text-red-400">*</span></label>
              <select value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500">
                <option value="">Select team member…</option>
                {taskers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.teams?.name || 'No team'})</option>
                ))}
              </select>
            </div>
          )}
          {tasker && !initial && (
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-lg border border-slate-600">
              <span className="text-xs text-slate-400">This milestone will be assigned to <span className="text-slate-200 font-semibold">you</span>. Your admin will need to approve when you mark it done.</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500">
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Due Date</label>
              <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500" />
            </div>
            {initial && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500">
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s]?.label}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Milestone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MilestoneCard({ m, canManage, onEdit, onDelete, onStatusChange, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false)
  const pm = PRIORITY_META[m.priority] || PRIORITY_META.medium
  const sm = STATUS_META[m.status]     || STATUS_META.pending
  const overdue = isOverdue(m.due_date, m.status)
  const StatusIcon = sm.icon

  const isSubmitted = m.status === 'submitted'
  const isDone      = m.status === 'done'
  const statusLocked = isDone || (isSubmitted && !canManage)

  const handleStatusClick = () => {
    if (m.status === 'pending')     onStatusChange(m.id, 'in_progress')
    else if (m.status === 'in_progress') onStatusChange(m.id, 'submitted')
  }

  return (
    <div className={`bg-slate-800 rounded-2xl border overflow-hidden transition-all
      ${overdue ? 'border-red-500/40 shadow shadow-red-500/10' :
        isSubmitted ? 'border-amber-500/40 shadow shadow-amber-500/10' :
        'border-slate-700'}
      ${isDone ? 'opacity-70' : ''}`}>

      {/* Priority bar */}
      <div className={`h-1 ${
        m.priority === 'critical' ? 'bg-red-500' :
        m.priority === 'high'     ? 'bg-amber-400' :
        m.priority === 'medium'   ? 'bg-blue-500' : 'bg-slate-600'
      }`} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Status toggle */}
          <button
            onClick={handleStatusClick}
            disabled={statusLocked}
            className="mt-0.5 flex-shrink-0"
            title={
              isDone ? 'Completed' :
              isSubmitted ? 'Awaiting admin approval' :
              m.status === 'in_progress' ? 'Click to submit for approval' :
              'Click to start'
            }>
            <StatusIcon size={18} className={
              isDone      ? 'text-green-400' :
              isSubmitted ? 'text-amber-400 animate-pulse' :
              m.status === 'in_progress' ? 'text-blue-400 animate-pulse' : 'text-slate-500'
            } />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className={`font-semibold text-sm leading-snug ${isDone ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                {m.title}
              </p>
              <div className="flex gap-1 flex-shrink-0">
                {canManage && !isSubmitted && (
                  <>
                    <button onClick={() => onEdit(m)} className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-blue-400 transition-colors">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => onDelete(m.id)} className="p-1 rounded hover:bg-red-900/40 text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
                {canManage && isSubmitted && (
                  <>
                    <button onClick={() => onApprove(m.id)}
                      title="Approve & Release"
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-green-900/50 hover:bg-green-700/60 text-green-300 text-xs font-semibold transition-colors">
                      <ThumbsUp size={11} /> Release
                    </button>
                    <button onClick={() => onReject(m.id)}
                      title="Send back to In Progress"
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 text-xs transition-colors">
                      <Undo2 size={11} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sm.cls}`}>
                {sm.label}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${pm.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${pm.dot}`} />
                {pm.label}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-400">{m.category}</span>
              {overdue && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-900/50 text-red-300 font-semibold">
                  <AlertTriangle size={10} /> Overdue
                </span>
              )}
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
              {m.assignee && (
                <span className="flex items-center gap-1">
                  <Users size={11} /> {m.assignee.name}
                </span>
              )}
              {m.due_date && (
                <span className={`flex items-center gap-1 ${overdue ? 'text-red-400' : ''}`}>
                  <Clock size={11} /> Due {formatDate(m.due_date)}
                </span>
              )}
              {m.creator && (
                <span className="text-slate-600">by {m.creator.name}</span>
              )}
            </div>

            {/* Expand description */}
            {m.description && (
              <>
                <button onClick={() => setExpanded(v => !v)}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:underline mt-2">
                  {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {expanded ? 'Hide details' : 'View details'}
                </button>
                {expanded && (
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed border-l-2 border-slate-600 pl-3">
                    {m.description}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Milestones() {
  const { user } = useAuth()
  const { tick, ping } = useRealtime()
  const [milestones, setMilestones] = useState([])
  const [allUsers, setAllUsers]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editItem, setEditItem]     = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterUser, setFilterUser]     = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  const admin = isAdmin(user)
  const SA    = isSuperAdmin(user)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await milestoneService.getAll(user)
      setMilestones(data)
      if (admin) {
        const users = await adminService.getAllUsers()
        setAllUsers(users || [])
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [user, admin])

  useEffect(() => { load() }, [load, tick])

  const handleSave = async data => {
    if (editItem) {
      await milestoneService.update(editItem.id, data)
      toast.success('Milestone updated')
    } else {
      await milestoneService.create(data)
      toast.success('Milestone created')
    }
    setShowForm(false)
    setEditItem(null)
    ping()
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this milestone?')) return
    await milestoneService.remove(id)
    toast.success('Milestone deleted')
    ping()
  }

  const handleStatusChange = async (id, status) => {
    await milestoneService.update(id, { status })
    toast.success(
      status === 'submitted'   ? '📤 Submitted for admin approval!' :
      status === 'in_progress' ? '⚡ In progress!' : '✅ Done!'
    )
    ping()
  }

  const handleApprove = async id => {
    await milestoneService.update(id, { status: 'done' })
    toast.success('✅ Milestone approved and released!')
    ping()
  }

  const handleReject = async id => {
    await milestoneService.update(id, { status: 'in_progress' })
    toast.success('↩ Sent back to in progress')
    ping()
  }

  const filtered = milestones.filter(m => {
    if (filterStatus   && m.status   !== filterStatus)   return false
    if (filterPriority && m.priority !== filterPriority) return false
    if (filterUser     && m.assigned_to !== filterUser)  return false
    return true
  })

  // Group by assignee for admin view
  const grouped = admin
    ? filtered.reduce((acc, m) => {
        const key = m.assigned_to || 'unassigned'
        if (!acc[key]) acc[key] = { assignee: m.assignee, items: [] }
        acc[key].items.push(m)
        return acc
      }, {})
    : null

  const counts = {
    pending:     milestones.filter(m => m.status === 'pending').length,
    in_progress: milestones.filter(m => m.status === 'in_progress').length,
    submitted:   milestones.filter(m => m.status === 'submitted').length,
    done:        milestones.filter(m => m.status === 'done').length,
    overdue:     milestones.filter(m => isOverdue(m.due_date, m.status)).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Flag size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Milestones</h1>
            <p className="text-sm text-slate-500">
              {admin ? 'Action plans assigned to team members' : 'Your assigned action plan & milestones'}
            </p>
          </div>
        </div>
        <button onClick={() => { setEditItem(null); setShowForm(true) }}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow shadow-purple-500/20">
          <Plus size={16} /> {SA ? 'Create Milestone' : 'Add My Milestone'}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Pending',          value: counts.pending,     cls: 'text-slate-300',  bg: 'bg-slate-700'         },
          { label: 'In Progress',      value: counts.in_progress, cls: 'text-blue-300',   bg: 'bg-blue-900/40'       },
          { label: 'Awaiting Approval',value: counts.submitted,   cls: 'text-amber-300',  bg: 'bg-amber-900/40'      },
          { label: 'Done',             value: counts.done,        cls: 'text-green-300',  bg: 'bg-green-900/40'      },
          { label: 'Overdue',          value: counts.overdue,     cls: 'text-red-300',    bg: 'bg-red-900/40'        },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl px-4 py-3 border border-slate-700`}>
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-2xl font-black mt-0.5 ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300 focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s]?.label}</option>)}
          {SA && counts.submitted > 0 && <option value="__needs_review__" disabled>── {counts.submitted} awaiting approval ──</option>}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300 focus:ring-2 focus:ring-blue-500">
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        {admin && (
          <select value={filterUser} onChange={e => setFilterUser(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300 focus:ring-2 focus:ring-blue-500">
            <option value="">All Members</option>
            {allUsers.filter(u => isAssignable(u)).map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-dashed border-slate-700">
          <Flag size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 font-medium">No milestones yet</p>
          <p className="text-slate-600 text-sm mt-1">
            {admin ? 'Create milestones to assign action plans to your team.' : 'Your admin will assign milestones to guide your work.'}
          </p>
        </div>
      ) : admin && grouped ? (
        // Admin: grouped by assignee
        <div className="space-y-8">
          {Object.values(grouped).map(group => (
            <div key={group.assignee?.id || 'unassigned'}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-violet-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{group.assignee?.name?.[0] || '?'}</span>
                </div>
                <span className="font-semibold text-slate-200">{group.assignee?.name || 'Unassigned'}</span>
                <span className="text-xs text-slate-500">{group.items.length} milestone{group.items.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pl-10">
                {group.items.map(m => (
                  <MilestoneCard key={m.id} m={m} canManage={admin}
                    onEdit={item => { setEditItem(item); setShowForm(true) }}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    onApprove={handleApprove}
                    onReject={handleReject} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Tasker: own milestones flat grid
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => (
            <MilestoneCard key={m.id} m={m} canManage={SA}
              onEdit={item => { setEditItem(item); setShowForm(true) }}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onApprove={handleApprove}
              onReject={handleReject} />
          ))}
        </div>
      )}

      {showForm && (
        <MilestoneForm
          initial={editItem}
          allUsers={allUsers}
          currentUser={user}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditItem(null) }}
        />
      )}
    </div>
  )
}
