import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRealtime } from '../context/RealtimeContext'
import { useOnlineUsers } from '../hooks/useOnlineUsers'
import { adminService } from '../services/adminService'
import { milestoneService } from '../services/milestoneService'
import { isSuperAdmin, isViewAdmin } from '../utils/roleGuard'
import { formatSeconds } from '../utils/formatTime'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { ConfirmModal } from '../components/ui/Modal'
import { SkeletonTable } from '../components/ui/Skeleton'
import { exportToCSV } from '../utils/exportCSV'
import { formatDateTime } from '../utils/formatTime'
import toast from 'react-hot-toast'
import {
  Users, Shield, UserPlus, RefreshCw, ToggleLeft, ToggleRight,
  Download, Eye, Database, ArrowUp, ArrowDown, Activity, StopCircle,
} from 'lucide-react'

const ROLES = ['tasker', 'view_admin', 'super_admin']
const ROLE_LABELS = { tasker: 'Tasker', view_admin: 'View Admin', super_admin: 'Super Admin' }
const ROLE_RANK = { tasker: 0, view_admin: 1, super_admin: 2 }

function RoleModal({ target, currentUser, onClose, onChangeRole }) {
  const [selected, setSelected] = useState(target?.role || 'tasker')
  const [saving, setSaving] = useState(false)

  if (!target) return null

  const isSelf = target.id === currentUser.id
  const currentRank = ROLE_RANK[target.role]

  const handle = async () => {
    if (selected === target.role) return onClose()
    setSaving(true)
    await onChangeRole(target.id, selected)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-gray-900 dark:text-white">Change Role</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
            <span className="text-gray-400 text-lg leading-none">×</span>
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-xl">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {target.name[0]}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{target.name}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">{target.email || 'PIN login'}</p>
            </div>
          </div>

          <div className="space-y-2">
            {ROLES.map(role => {
              const rank = ROLE_RANK[role]
              const isCurrentRole = role === target.role
              const isSelected = role === selected
              const wouldPromote = rank > currentRank
              const wouldDemote = rank < currentRank

              return (
                <button key={role} onClick={() => !isSelf && setSelected(role)} disabled={isSelf}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all
                    ${isSelf ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-100 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500'}`}>
                  <div>
                    <p className={`text-sm font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-slate-200'}`}>
                      {ROLE_LABELS[role]}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                      {role === 'super_admin' && 'Full access — manage users, roles, all data'}
                      {role === 'view_admin' && 'Read-only admin — view all data, no changes'}
                      {role === 'tasker' && 'Standard member — own data only'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    {isCurrentRole && (
                      <span className="text-xs bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded-full">Current</span>
                    )}
                    {!isCurrentRole && wouldPromote && (
                      <span className="flex items-center gap-0.5 text-xs text-green-600 dark:text-green-400 font-medium">
                        <ArrowUp size={11} /> Promote
                      </span>
                    )}
                    {!isCurrentRole && wouldDemote && (
                      <span className="flex items-center gap-0.5 text-xs text-red-500 dark:text-red-400 font-medium">
                        <ArrowDown size={11} /> Demote
                      </span>
                    )}
                    {isSelected && !isCurrentRole && (
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {isSelf && (
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
              You cannot change your own role.
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">
              Cancel
            </button>
            <button onClick={handle} disabled={saving || isSelf || selected === target.role}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium text-white disabled:opacity-50">
              {saving ? 'Saving…' : 'Confirm Change'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function UserRow({ u, onResetPin, onToggle, onChangeRole, canEdit, isOnline }) {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-7 h-7 bg-blue-700 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{u.name[0]}</span>
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800 ${isOnline(u.id) ? 'bg-green-400' : 'bg-slate-400'}`} />
          </div>
          <span className="font-medium text-gray-800 dark:text-slate-200">{u.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{u.email || '—'}</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          u.role === 'super_admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
          u.role === 'view_admin'  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                   : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'
        }`}>{ROLE_LABELS[u.role] || u.role}</span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{u.teams?.name || '—'}</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
          {u.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-3">
        {canEdit && (
          <div className="flex gap-1">
            <button onClick={() => onChangeRole(u)} title="Change role"
              className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors">
              <ArrowUp size={13} />
            </button>
            <button onClick={() => onResetPin(u)} title="Reset PIN"
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors">
              <RefreshCw size={13} />
            </button>
            <button onClick={() => onToggle(u)} title={u.is_active ? 'Deactivate' : 'Activate'}
              className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors">
              {u.is_active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

function ResetPinModal({ user: target, onClose, onReset }) {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    if (!pin || pin.length < 4) return toast.error('PIN must be at least 4 digits')
    setLoading(true)
    await onReset(target.id, pin)
    setPin('')
    setLoading(false)
    onClose()
  }

  return (
    <Modal isOpen={!!target} onClose={onClose} title={`Reset PIN — ${target?.name}`} size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handle} loading={loading}>Set PIN</Button>
        </>
      }>
      <div className="space-y-3">
        <p className="text-sm text-gray-500">Enter a new PIN for {target?.name}.</p>
        <input type="password" value={pin} onChange={e => setPin(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center tracking-[0.5em] text-xl focus:ring-2 focus:ring-blue-500"
          placeholder="• • • •" maxLength={8} autoFocus />
      </div>
    </Modal>
  )
}

export default function Admin() {
  const { user } = useAuth()
  const { tick, ping } = useRealtime()
  const { isOnline } = useOnlineUsers()
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [teams, setTeams] = useState([])
  const [auditLog, setAuditLog] = useState([])
  const [activeSessions, setActiveSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [pinTarget, setPinTarget] = useState(null)
  const [toggleTarget, setToggleTarget] = useState(null)
  const [roleTarget, setRoleTarget] = useState(null)
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'tasker', team_id: '', pin_hash: '1234' })

  const canEdit = isSuperAdmin(user)
  const isView = isViewAdmin(user)

  useEffect(() => { loadData() }, [tab, tick])

  const loadData = async () => {
    setLoading(true)
    try {
      if (tab === 'users')    setUsers(await adminService.getAllUsers())
      if (tab === 'teams')    setTeams(await adminService.getAllTeams())
      if (tab === 'audit')    setAuditLog(await adminService.getAuditLog())
      if (tab === 'sessions') setActiveSessions(await milestoneService.getActiveSessions())
    } catch {}
    finally { setLoading(false) }
  }

  const handleRoleChange = async (userId, newRole) => {
    const target = users.find(u => u.id === userId)
    if (!target) return
    const oldRole = target.role
    await adminService.updateUser(userId, { role: newRole }, user.id)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    const direction = ROLE_RANK[newRole] > ROLE_RANK[oldRole] ? 'promoted' : 'demoted'
    toast.success(`${target.name} ${direction} to ${ROLE_LABELS[newRole]}`)
    ping()
  }

  const handleResetPin = async (userId, pin) => {
    await adminService.resetPin(userId, pin, user.id)
    toast.success('PIN reset!')
  }

  const handleToggle = async () => {
    const u = toggleTarget
    await adminService.updateUser(u.id, { is_active: !u.is_active }, user.id)
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: !u.is_active } : x))
    toast.success(`${u.name} ${u.is_active ? 'deactivated' : 'activated'}`)
    setToggleTarget(null)
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    try {
      const u = await adminService.createUser({ ...newUser, team_id: newUser.team_id || null })
      setUsers(prev => [...prev, u])
      setShowAddUser(false)
      setNewUser({ name: '', email: '', role: 'tasker', team_id: '', pin_hash: '1234' })
      toast.success('User created!')
    } catch { toast.error('Failed to create user') }
  }

  const handleForceStop = async (sessionId, userName) => {
    if (!window.confirm(`Force-stop ${userName}'s active session?`)) return
    await milestoneService.forceStop(sessionId)
    toast.success(`${userName}'s session force-stopped`)
    ping()
  }

  const TABS = [
    { id: 'users',    label: 'Users',           icon: Users    },
    { id: 'teams',    label: 'Teams',           icon: Shield   },
    { id: 'audit',    label: 'Audit Log',       icon: Database },
    ...(canEdit ? [{ id: 'sessions', label: 'Active Sessions', icon: Activity }] : []),
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Admin Panel</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isView ? 'View-only access — no modifications allowed' : 'Manage users, teams, and system settings'}
          </p>
        </div>
        {isView && (
          <span className="flex items-center gap-1 px-3 py-1.5 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full border border-yellow-200">
            <Eye size={12} /> View Only
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${tab === id ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{users.length} team members</p>
            <div className="flex gap-2">
              <button onClick={() => exportToCSV(users, 'users')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
                <Download size={14} /> Export
              </button>
              {canEdit && (
                <Button size="sm" onClick={() => setShowAddUser(true)}>
                  <UserPlus size={14} /> Add User
                </Button>
              )}
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            {loading ? <div className="p-4"><SkeletonTable rows={6} cols={5} /></div> : (
              <table className="w-full text-sm">
                <thead className="bg-slate-800 border-b border-slate-700">
                  <tr>
                    {['Name','Email','Role','Team','Status','Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map(u => (
                    <UserRow key={u.id} u={u}
                      onResetPin={setPinTarget} onToggle={setToggleTarget}
                      onChangeRole={setRoleTarget} canEdit={canEdit} isOnline={isOnline} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Teams Tab */}
      {tab === 'teams' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading ? [1,2].map(i => <div key={i} className="h-32 skeleton rounded-xl" />) :
            teams.map(team => (
              <div key={team.id} className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-900/40 rounded-xl flex items-center justify-center">
                    <Shield size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-100">{team.name}</h3>
                    <p className="text-xs text-slate-500">Lead: {team.users?.name || 'Unknown'}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  {users.filter(u => u.team_id === team.id).map(u => (
                    <div key={u.id} className="flex items-center gap-2 text-sm text-slate-400">
                      <div className="w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center text-xs font-medium text-slate-300">{u.name[0]}</div>
                      {u.name}
                    </div>
                  ))}
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Audit Log Tab */}
      {tab === 'audit' && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-slate-800">
            <h3 className="font-semibold text-slate-200">Audit Log</h3>
            <button onClick={() => exportToCSV(auditLog, 'audit-log')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 border border-slate-700 rounded-lg hover:bg-slate-800">
              <Download size={14} /> Export
            </button>
          </div>
          {loading ? <div className="p-4"><SkeletonTable rows={8} cols={4} /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 border-b border-slate-700">
                  <tr>
                    {['Admin','Action','Table','Record','When'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {auditLog.map(log => (
                    <tr key={log.id} className="hover:bg-slate-800/60">
                      <td className="px-4 py-2.5 text-slate-300">{log.users?.name || 'System'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          log.action === 'create' ? 'bg-green-900/40 text-green-400' :
                          log.action === 'delete' ? 'bg-red-900/40 text-red-400' : 'bg-blue-900/40 text-blue-400'
                        }`}>{log.action}</span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{log.table_name}</td>
                      <td className="px-4 py-2.5 text-slate-600 font-mono text-xs truncate max-w-32">{log.record_id?.slice(0,8)}...</td>
                      <td className="px-4 py-2.5 text-slate-500 text-xs">{formatDateTime(log.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Active Sessions Tab — super admin only */}
      {tab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-amber-900/30 border border-amber-700/40 rounded-xl px-4 py-3">
            <Activity size={16} className="text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-300">
              Force-stopping a session saves it immediately with an admin note. The tasker's timer will reset on their next page load.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeSessions.length === 0 ? (
            <div className="text-center py-16 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
              <Activity size={32} className="mx-auto text-slate-600 mb-2" />
              <p className="text-slate-400 font-medium">No active sessions right now</p>
              <p className="text-slate-600 text-sm mt-1">All team members are idle.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSessions.map(s => (
                <div key={s.id} className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold">
                        {s.user?.name?.[0] || '?'}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-800 ${s.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-100 text-sm">{s.user?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500 capitalize">{s.status}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                    <div className="flex justify-between">
                      <span>Duration</span>
                      <span className="font-mono text-slate-200">{formatSeconds(s.total_seconds || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Started</span>
                      <span className="text-slate-300">{s.start_time ? new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date</span>
                      <span className="text-slate-300">{s.date}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleForceStop(s.id, s.user?.name || 'user')}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-900/40 hover:bg-red-800/60 border border-red-700/40 text-red-300 text-xs font-semibold transition-colors">
                    <StopCircle size={13} /> Force Stop Session
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add User Modal */}
      <Modal isOpen={showAddUser} onClose={() => setShowAddUser(false)} title="Add Team Member" size="sm">
        <form onSubmit={handleAddUser} className="space-y-3">
          {[['Name *','name','text'],['Email','email','email']].map(([label, key, type]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input type={type} value={newUser[key]} onChange={e => setNewUser(p => ({...p,[key]:e.target.value}))} required={label.includes('*')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
            <select value={newUser.role} onChange={e => setNewUser(p => ({...p,role:e.target.value}))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              {ROLES.map(r => <option key={r} value={r}>{r.replace('_',' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Default PIN (taskers)</label>
            <input type="password" value={newUser.pin_hash} onChange={e => setNewUser(p => ({...p,pin_hash:e.target.value}))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="1234" maxLength={8} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowAddUser(false)}>Cancel</Button>
            <Button type="submit">Create User</Button>
          </div>
        </form>
      </Modal>

      <ResetPinModal user={pinTarget} onClose={() => setPinTarget(null)} onReset={handleResetPin} />

      <RoleModal
        target={roleTarget}
        currentUser={user}
        onClose={() => setRoleTarget(null)}
        onChangeRole={handleRoleChange}
      />

      <ConfirmModal isOpen={!!toggleTarget} onClose={() => setToggleTarget(null)} onConfirm={handleToggle}
        title={toggleTarget?.is_active ? 'Deactivate User' : 'Activate User'}
        message={`${toggleTarget?.is_active ? 'Deactivate' : 'Activate'} ${toggleTarget?.name}?`}
        danger={toggleTarget?.is_active}
        confirmLabel={toggleTarget?.is_active ? 'Deactivate' : 'Activate'}
      />
    </div>
  )
}
