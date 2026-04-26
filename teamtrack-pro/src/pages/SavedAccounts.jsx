import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRealtime } from '../context/RealtimeContext'
import { savedAccountsService } from '../services/savedAccountsService'
import { isSuperAdmin, isAssignable } from '../utils/roleGuard'
import { KeyRound, Plus, Eye, EyeOff, Pencil, Trash2, Copy, Shield, Users, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const PLATFORMS = [
  'LinkedIn', 'Indeed', 'Glassdoor', 'ZipRecruiter', 'Monster',
  'Handshake', 'AngelList / Wellfound', 'Dice', 'SimplyHired',
  'Upwork', 'Toptal', 'Fiverr', 'Greenhouse', 'Lever', 'Workday',
  'Email', 'Google', 'GitHub', 'Other',
]

function AccountForm({ initial, currentUserId, allUsers, isSA, onSave, onClose }) {
  const [form, setForm] = useState({
    platform:    initial?.platform    || '',
    custom_platform: initial?.custom_platform || '',
    username:    initial?.username    || '',
    email:       initial?.email       || '',
    password:    initial?.password    || '',
    notes:       initial?.notes       || '',
    user_id:     initial?.user_id     || currentUserId,
  })
  const [showPw, setShowPw]   = useState(false)
  const [saving, setSaving]   = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.platform) return toast.error('Select a platform')
    if (!form.username && !form.email) return toast.error('Username or email is required')
    if (!form.password) return toast.error('Password is required')
    setSaving(true)
    const payload = { ...form }
    if (form.platform !== 'Other') delete payload.custom_platform
    await onSave(payload)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="font-bold text-slate-100 flex items-center gap-2">
            <KeyRound size={16} className="text-blue-400" />
            {initial ? 'Edit Account' : 'Save New Account'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Owner — super admin can assign to anyone */}
          {isSA && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Account Owner</label>
              <select value={form.user_id} onChange={e => set('user_id', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500">
                {allUsers.filter(u => isAssignable(u)).map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role.replace('_', ' ')})</option>
                ))}
              </select>
            </div>
          )}

          {/* Platform */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Platform / Site</label>
            <select value={form.platform} onChange={e => set('platform', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500">
              <option value="">Select platform…</option>
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {form.platform === 'Other' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Platform Name</label>
              <input value={form.custom_platform} onChange={e => set('custom_platform', e.target.value)}
                placeholder="e.g. TalentHunt, Remote.co…"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500" />
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Username (if any)</label>
            <input value={form.username} onChange={e => set('username', e.target.value)}
              placeholder="@handle or display name"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Sign-up Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="email used to register"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Password <span className="text-red-400">*</span></label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="Account password"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 pr-10 text-sm text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Notes (optional)</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={2} placeholder="e.g. Used persona Sarah Johnson, US jobs only…"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 resize-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : initial ? 'Save Changes' : 'Save Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AccountRow({ account, canReveal, onEdit, onDelete, isSA }) {
  const [showPw, setShowPw]       = useState(false)
  const [copied, setCopied]       = useState(null) // 'email' | 'password'

  const copy = async (text, field) => {
    await navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 1500)
  }

  const displayPlatform = account.platform === 'Other'
    ? (account.custom_platform || 'Other')
    : account.platform

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-900/40 border border-blue-700/30 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-300 font-bold text-sm">{displayPlatform[0]}</span>
          </div>
          <div>
            <p className="font-semibold text-slate-100">{displayPlatform}</p>
            {isSA && account.user && (
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Users size={10} /> {account.user.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={() => onEdit(account)}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition-colors" title="Edit">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(account.id)}
            className="p-1.5 rounded-lg hover:bg-red-900/40 text-slate-400 hover:text-red-400 transition-colors" title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 text-sm">
        {account.email && (
          <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
            <span className="text-slate-500 text-xs w-16 flex-shrink-0">Email</span>
            <span className="text-slate-200 flex-1 truncate font-mono text-xs">{account.email}</span>
            <button onClick={() => copy(account.email, 'email')}
              className="text-slate-400 hover:text-blue-400 transition-colors flex-shrink-0" title="Copy email">
              {copied === 'email' ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
            </button>
          </div>
        )}

        {account.username && (
          <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
            <span className="text-slate-500 text-xs w-16 flex-shrink-0">Username</span>
            <span className="text-slate-200 flex-1 truncate font-mono text-xs">{account.username}</span>
          </div>
        )}

        <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
          <span className="text-slate-500 text-xs w-16 flex-shrink-0">Password</span>
          <span className={`flex-1 font-mono text-xs ${showPw ? 'text-slate-200' : 'text-slate-500 tracking-widest'}`}>
            {showPw ? account.password : '••••••••••'}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {canReveal && (
              <button onClick={() => setShowPw(v => !v)}
                className="text-slate-400 hover:text-slate-200 transition-colors" title={showPw ? 'Hide' : 'Show'}>
                {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            )}
            {showPw && (
              <button onClick={() => copy(account.password, 'password')}
                className="text-slate-400 hover:text-blue-400 transition-colors" title="Copy password">
                {copied === 'password' ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {account.notes && (
        <p className="text-xs text-slate-500 px-1">{account.notes}</p>
      )}
    </div>
  )
}

export default function SavedAccounts() {
  const { user } = useAuth()
  const { tick, ping } = useRealtime()
  const [accounts, setAccounts]   = useState([])
  const [allUsers, setAllUsers]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [editItem, setEditItem]   = useState(null)
  const [filterUser, setFilterUser] = useState('')
  const [search, setSearch]       = useState('')

  const SA = isSuperAdmin(user)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await savedAccountsService.getAccounts(user)
      setAccounts(data)
      if (SA) {
        const { adminService } = await import('../services/adminService.js')
        const users = await adminService.getAllUsers()
        setAllUsers(users || [])
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [user, SA])

  useEffect(() => { load() }, [load, tick])

  const handleSave = async data => {
    try {
      if (editItem) {
        await savedAccountsService.update(editItem.id, data)
        toast.success('Account updated')
      } else {
        await savedAccountsService.create({ ...data, user_id: data.user_id || user.id })
        toast.success('Account saved')
      }
      setShowForm(false)
      setEditItem(null)
      ping()
    } catch (e) {
      console.error('savedAccounts save error:', e)
      toast.error(e?.message || 'Failed to save account')
    }
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this saved account?')) return
    await savedAccountsService.remove(id)
    toast.success('Account deleted')
    ping()
  }

  const handleEdit = item => { setEditItem(item); setShowForm(true) }

  const filtered = accounts.filter(a => {
    if (filterUser && a.user_id !== filterUser) return false
    const q = search.toLowerCase()
    if (!q) return true
    const plat = (a.platform === 'Other' ? a.custom_platform : a.platform) || ''
    return plat.toLowerCase().includes(q)
      || a.email?.toLowerCase().includes(q)
      || a.username?.toLowerCase().includes(q)
      || a.notes?.toLowerCase().includes(q)
  })

  // Group by user if super admin
  const grouped = SA
    ? filtered.reduce((acc, a) => {
        const key = a.user_id
        if (!acc[key]) acc[key] = { user: a.user, items: [] }
        acc[key].items.push(a)
        return acc
      }, {})
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <KeyRound size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Account Vault</h1>
            <p className="text-sm text-slate-500 flex items-center gap-1.5">
              {SA
                ? <><Shield size={12} className="text-purple-400" /> Super admin view — all team accounts</>
                : 'Your saved sign-up credentials — private to you'}
            </p>
          </div>
        </div>
        <button onClick={() => { setEditItem(null); setShowForm(true) }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow shadow-blue-500/20">
          <Plus size={16} /> Save New Account
        </button>
      </div>

      {/* Privacy notice for taskers */}
      {!SA && (
        <div className="flex items-start gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
          <Shield size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-slate-400">
            Your saved accounts are <span className="text-slate-200 font-medium">private</span> — only you and super admins can view them. Never share your password verbally; save it here instead.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by platform, email, username…"
          className="flex-1 min-w-48 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        {SA && (
          <select value={filterUser} onChange={e => setFilterUser(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:ring-2 focus:ring-blue-500">
            <option value="">All members</option>
            {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-dashed border-slate-700">
          <KeyRound size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 font-medium">No saved accounts yet</p>
          <p className="text-slate-600 text-sm mt-1">Click "Save New Account" to store your first login.</p>
        </div>
      ) : SA && grouped ? (
        // Super admin: grouped by user
        Object.values(grouped).map(group => (
          <div key={group.user?.id || 'unknown'} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{group.user?.name?.[0] || '?'}</span>
              </div>
              <span className="font-semibold text-slate-300 text-sm">{group.user?.name || 'Unknown'}</span>
              <span className="text-xs text-slate-600 capitalize">({group.user?.role?.replace('_', ' ')})</span>
              <span className="text-xs text-slate-600 ml-1">· {group.items.length} account{group.items.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pl-9">
              {group.items.map(a => (
                <AccountRow key={a.id} account={a} canReveal isSA={SA}
                  onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        ))
      ) : (
        // Tasker: flat grid
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(a => (
            <AccountRow key={a.id} account={a} canReveal isSA={SA}
              onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showForm && (
        <AccountForm
          initial={editItem}
          currentUserId={user.id}
          allUsers={allUsers}
          isSA={SA}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditItem(null) }}
        />
      )}
    </div>
  )
}
