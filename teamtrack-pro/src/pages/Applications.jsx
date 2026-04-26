import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRealtime } from '../context/RealtimeContext'
import { applicationService } from '../services/applicationService'
import { isAdmin, isViewAdmin } from '../utils/roleGuard'
import KanbanBoard from '../components/applications/KanbanBoard'
import AppTable from '../components/applications/AppTable'
import AppForm from '../components/applications/AppForm'
import AppDetailModal from '../components/applications/AppDetailModal'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { SkeletonCard } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import { exportToCSV } from '../utils/exportCSV'
import toast from 'react-hot-toast'
import {
  LayoutGrid, List, Plus, Search, Download, Briefcase
} from 'lucide-react'

const STATUSES = ['','Wishlist','Applied','Phone Screen','Interview','Technical Test','Offer','Rejected','Withdrawn','Ghosted']
const PRIORITIES = ['','Low','Medium','High','Dream Job']

export default function Applications() {
  const { user } = useAuth()
  const { tick, ping } = useRealtime()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('kanban')
  const [showAdd, setShowAdd] = useState(false)
  const [editApp, setEditApp] = useState(null)
  const [detailApp, setDetailApp] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterUserId, setFilterUserId] = useState('')
  const [allUsers, setAllUsers] = useState([])

  const canEdit = !isViewAdmin(user)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = isAdmin(user)
        ? await applicationService.getAllApplications({ userId: filterUserId || undefined })
        : await applicationService.getApplicationsByUser(user.id)
      setApps(data || [])
    } catch (e) { console.error('loadApplications error:', e); setApps([]) }
    finally { setLoading(false) }
  }, [user, filterUserId])

  useEffect(() => { load() }, [load, tick])

  useEffect(() => {
    if (isAdmin(user)) {
      import('../services/adminService.js').then(({ adminService }) =>
        adminService.getAllUsers().then(users => setAllUsers(users || []))
      )
    }
  }, [user])

  const filtered = apps.filter(a => {
    if (filterStatus && a.status !== filterStatus) return false
    if (filterPriority && a.priority !== filterPriority) return false
    if (search) {
      const q = search.toLowerCase()
      return a.company_name?.toLowerCase().includes(q) ||
        a.job_title?.toLowerCase().includes(q) ||
        a.tags?.toLowerCase().includes(q) ||
        a.notes?.toLowerCase().includes(q)
    }
    return true
  })

  const handleAdd = async (data) => {
    setSaving(true)
    try {
      const app = await applicationService.createApplication(data)
      setApps(prev => [app, ...prev])
      setShowAdd(false)
      toast.success('Application added!')
      ping()
    } catch (e) { console.error('createApplication error:', e); toast.error(e?.message || 'Failed to add application') }
    finally { setSaving(false) }
  }

  const handleUpdate = async (id, data) => {
    try {
      const updated = await applicationService.updateApplication(id, data, user.id)
      setApps(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a))
      if (detailApp?.id === id) setDetailApp(prev => ({ ...prev, ...updated }))
      ping()
      return updated
    } catch (e) {
      console.error('updateApplication error:', e)
      toast.error(e?.message || 'Failed to update application')
      throw e
    }
  }

  const handleDelete = async (id) => {
    await applicationService.deleteApplication(id)
    setApps(prev => prev.filter(a => a.id !== id))
    toast.success('Application deleted')
    ping()
  }

  const handleStatusChange = async (id, newStatus) => {
    await handleUpdate(id, { status: newStatus })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Applications</h1>
          <p className="text-sm text-gray-500 mt-0.5">{apps.length} total applications</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportToCSV(filtered, 'applications')}
            className="p-2 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={16} />
          </button>
          {canEdit && (
            <Button onClick={() => setShowAdd(true)}>
              <Plus size={16} /> Add Application
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-3 flex gap-2 flex-wrap items-center">
        <div className="flex-1 min-w-48 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search company, role, tags..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          {STATUSES.slice(1).map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">All Priorities</option>
          {PRIORITIES.slice(1).map(p => <option key={p}>{p}</option>)}
        </select>
        {isAdmin(user) && (
          <select value={filterUserId} onChange={e => setFilterUserId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="">All Members</option>
            {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
        <div className="flex bg-gray-100 rounded-lg p-1 ml-auto">
          <button onClick={() => setView('kanban')}
            className={`p-1.5 rounded transition-colors ${view === 'kanban' ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}>
            <LayoutGrid size={16} />
          </button>
          <button onClick={() => setView('list')}
            className={`p-1.5 rounded transition-colors ${view === 'list' ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}>
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No applications yet"
          description="Track your job applications and move them through the pipeline."
          action={canEdit && <Button onClick={() => setShowAdd(true)}><Plus size={16} /> Add your first application</Button>}
        />
      ) : view === 'kanban' ? (
        <KanbanBoard
          applications={filtered}
          onStatusChange={handleStatusChange}
          onCardClick={setDetailApp}
        />
      ) : (
        <AppTable
          applications={filtered}
          onEdit={setEditApp}
          onDelete={handleDelete}
          onRowClick={setDetailApp}
          canEdit={canEdit}
        />
      )}

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Job Application" size="lg">
        <AppForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} loading={saving} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editApp} onClose={() => setEditApp(null)} title="Edit Application" size="lg">
        {editApp && (
          <AppForm
            initial={editApp}
            onSubmit={async (data) => { await handleUpdate(editApp.id, data); setEditApp(null) }}
            onCancel={() => setEditApp(null)}
            loading={saving}
          />
        )}
      </Modal>

      {/* Detail Modal */}
      <AppDetailModal
        app={detailApp}
        onClose={() => setDetailApp(null)}
        onUpdate={handleUpdate}
        canEdit={canEdit}
      />
    </div>
  )
}
