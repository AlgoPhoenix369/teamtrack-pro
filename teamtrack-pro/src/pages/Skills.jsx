import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRealtime } from '../context/RealtimeContext'
import { skillService } from '../services/skillService'
import { adminService } from '../services/adminService'
import { isAdmin, isSuperAdmin, isAssignable } from '../utils/roleGuard'
import {
  Code2, Plus, Pencil, Trash2, X, Users,
  Layers, Server, Database, Cloud, FlaskConical, Wrench, ChevronDown, ChevronUp,
} from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = ['Frontend', 'Backend', 'Database', 'DevOps', 'Testing', 'Cloud', 'Tools', 'Other']
const PROFICIENCIES = ['Beginner', 'Intermediate', 'Advanced', 'Expert']

const CATEGORY_META = {
  Frontend: { icon: Layers,       color: 'text-blue-400',   bg: 'bg-blue-900/25',   border: 'border-blue-700/40'    },
  Backend:  { icon: Server,       color: 'text-green-400',  bg: 'bg-green-900/25',  border: 'border-green-700/40'   },
  Database: { icon: Database,     color: 'text-purple-400', bg: 'bg-purple-900/25', border: 'border-purple-700/40'  },
  DevOps:   { icon: Cloud,        color: 'text-orange-400', bg: 'bg-orange-900/25', border: 'border-orange-700/40'  },
  Testing:  { icon: FlaskConical, color: 'text-pink-400',   bg: 'bg-pink-900/25',   border: 'border-pink-700/40'    },
  Cloud:    { icon: Cloud,        color: 'text-cyan-400',   bg: 'bg-cyan-900/25',   border: 'border-cyan-700/40'    },
  Tools:    { icon: Wrench,       color: 'text-yellow-400', bg: 'bg-yellow-900/25', border: 'border-yellow-700/40'  },
  Other:    { icon: Code2,        color: 'text-slate-400',  bg: 'bg-slate-700/30',  border: 'border-slate-600'      },
}

const PROF_META = {
  Beginner:     { level: 1, bar: 'bg-slate-400',   cls: 'bg-slate-700 text-slate-300'          },
  Intermediate: { level: 2, bar: 'bg-blue-500',    cls: 'bg-blue-900/50 text-blue-300'         },
  Advanced:     { level: 3, bar: 'bg-violet-500',  cls: 'bg-violet-900/50 text-violet-300'     },
  Expert:       { level: 4, bar: 'bg-emerald-500', cls: 'bg-emerald-900/50 text-emerald-300'   },
}

const POPULAR_SKILLS = {
  Frontend: ['React', 'Vue.js', 'Angular', 'Next.js', 'TypeScript', 'JavaScript', 'HTML/CSS', 'Tailwind CSS', 'Redux'],
  Backend:  ['Node.js', 'Python', 'Go', 'Java', 'PHP', 'Ruby', 'C#', 'FastAPI', 'Express', 'Django', 'Laravel'],
  Database: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Supabase', 'Firebase', 'SQLite', 'Prisma'],
  DevOps:   ['Docker', 'Kubernetes', 'GitHub Actions', 'CI/CD', 'Nginx', 'Linux', 'Terraform'],
  Testing:  ['Jest', 'Cypress', 'Playwright', 'Vitest', 'React Testing Library', 'Pytest'],
  Cloud:    ['AWS', 'GCP', 'Azure', 'Vercel', 'Netlify', 'Heroku', 'Railway'],
  Tools:    ['Git', 'VS Code', 'Figma', 'Postman', 'Jira', 'GitHub', 'Slack'],
  Other:    [],
}

function SkillForm({ initial, currentUser, onSave, onClose }) {
  const [form, setForm] = useState({
    name:        initial?.name        || '',
    category:    initial?.category    || 'Frontend',
    proficiency: initial?.proficiency || 'Intermediate',
    years_exp:   initial?.years_exp   || '',
    notes:       initial?.notes       || '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const suggestions = POPULAR_SKILLS[form.category] || []

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Skill name is required')
    setSaving(true)
    await onSave({ ...form, user_id: currentUser.id, years_exp: form.years_exp ? Number(form.years_exp) : null })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
          <h2 className="font-bold text-slate-100 flex items-center gap-2">
            <Code2 size={16} className="text-blue-400" />
            {initial ? 'Edit Skill' : 'Add Skill'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
              Skill Name <span className="text-red-400">*</span>
            </label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. React, Node.js, PostgreSQL…"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500" />
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {suggestions.filter(s => !form.name || s.toLowerCase().includes(form.name.toLowerCase())).slice(0, 8).map(s => (
                  <button key={s} type="button" onClick={() => set('name', s)}
                    className="px-2 py-0.5 rounded-full text-xs bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-slate-200 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Proficiency</label>
              <select value={form.proficiency} onChange={e => set('proficiency', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500">
                {PROFICIENCIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Years of Experience</label>
            <input type="number" min="0" max="30" step="0.5" value={form.years_exp} onChange={e => set('years_exp', e.target.value)}
              placeholder="e.g. 2"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={2} placeholder="Projects, context, or anything relevant…"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 resize-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Skill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SkillCard({ skill, canManage, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const pm = PROF_META[skill.proficiency] || PROF_META.Intermediate
  const cm = CATEGORY_META[skill.category] || CATEGORY_META.Other
  const CatIcon = cm.icon

  return (
    <div className={`bg-slate-800 rounded-xl border ${cm.border} p-3 flex items-start gap-3`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cm.bg}`}>
        <CatIcon size={15} className={cm.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-100 truncate">{skill.name}</p>
          {canManage && (
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => onEdit(skill)} className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-blue-400 transition-colors">
                <Pencil size={11} />
              </button>
              <button onClick={() => onDelete(skill.id)} className="p-1 rounded hover:bg-red-900/40 text-slate-500 hover:text-red-400 transition-colors">
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </div>

        {/* Proficiency bar */}
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex gap-0.5 flex-1">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= pm.level ? pm.bar : 'bg-slate-700'}`} />
            ))}
          </div>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${pm.cls}`}>
            {skill.proficiency}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
          <span className={`px-1.5 py-0.5 rounded text-xs ${cm.bg} ${cm.color}`}>{skill.category}</span>
          {skill.years_exp != null && skill.years_exp !== '' && (
            <span>{skill.years_exp}y exp</span>
          )}
        </div>

        {skill.notes && (
          <>
            <button onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-xs text-blue-400 hover:underline mt-1.5">
              {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {expanded ? 'Hide note' : 'View note'}
            </button>
            {expanded && (
              <p className="mt-1.5 text-xs text-slate-400 border-l-2 border-slate-600 pl-2">{skill.notes}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function CategorySection({ category, skills, canManage, onEdit, onDelete }) {
  const [collapsed, setCollapsed] = useState(false)
  const cm = CATEGORY_META[category] || CATEGORY_META.Other
  const CatIcon = cm.icon

  return (
    <div>
      <button onClick={() => setCollapsed(v => !v)}
        className="flex items-center gap-2 mb-3 group w-full text-left">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cm.bg}`}>
          <CatIcon size={14} className={cm.color} />
        </div>
        <span className="font-semibold text-slate-200 text-sm">{category}</span>
        <span className="text-xs text-slate-500 ml-1">{skills.length}</span>
        <span className="ml-auto text-slate-500 group-hover:text-slate-300 transition-colors">
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </span>
      </button>
      {!collapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {skills.map(s => (
            <SkillCard key={s.id} skill={s} canManage={canManage} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Skills() {
  const { user } = useAuth()
  const { tick, ping } = useRealtime()
  const [skills, setSkills] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterUser, setFilterUser] = useState('')

  const admin = isAdmin(user)
  const SA    = isSuperAdmin(user)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await skillService.getAll(user)
      setSkills(data || [])
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
      await skillService.update(editItem.id, data)
      toast.success('Skill updated')
    } else {
      await skillService.create(data)
      toast.success('Skill added!')
    }
    setShowForm(false)
    setEditItem(null)
    ping()
  }

  const handleDelete = async id => {
    if (!window.confirm('Remove this skill?')) return
    await skillService.remove(id)
    toast.success('Skill removed')
    ping()
  }

  const viewUserId = admin && filterUser ? filterUser : user.id
  const viewSkills = admin && filterUser
    ? skills.filter(s => s.user_id === filterUser)
    : admin
      ? skills
      : skills

  const filtered = filterCategory
    ? viewSkills.filter(s => s.category === filterCategory)
    : viewSkills

  // Group by category
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = filtered.filter(s => s.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {})

  const counts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = viewSkills.filter(s => s.category === cat).length
    return acc
  }, {})

  const totalExpert = viewSkills.filter(s => s.proficiency === 'Expert').length
  const totalAdvanced = viewSkills.filter(s => s.proficiency === 'Advanced').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Code2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Skills</h1>
            <p className="text-sm text-slate-500">
              {admin ? 'Team fullstack skill matrix' : 'Your software engineering skillset'}
            </p>
          </div>
        </div>
        <button onClick={() => { setEditItem(null); setShowForm(true) }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow shadow-blue-500/20">
          <Plus size={16} /> Add Skill
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-800 rounded-xl px-4 py-3 border border-slate-700">
          <p className="text-xs text-slate-500">Total Skills</p>
          <p className="text-2xl font-black mt-0.5 text-slate-200">{viewSkills.length}</p>
        </div>
        <div className="bg-blue-900/40 rounded-xl px-4 py-3 border border-slate-700">
          <p className="text-xs text-slate-500">Categories</p>
          <p className="text-2xl font-black mt-0.5 text-blue-300">
            {CATEGORIES.filter(c => counts[c] > 0).length}
          </p>
        </div>
        <div className="bg-violet-900/40 rounded-xl px-4 py-3 border border-slate-700">
          <p className="text-xs text-slate-500">Advanced+</p>
          <p className="text-2xl font-black mt-0.5 text-violet-300">{totalAdvanced + totalExpert}</p>
        </div>
        <div className="bg-emerald-900/40 rounded-xl px-4 py-3 border border-slate-700">
          <p className="text-xs text-slate-500">Expert Level</p>
          <p className="text-2xl font-black mt-0.5 text-emerald-300">{totalExpert}</p>
        </div>
      </div>

      {/* Category quick-nav */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterCategory('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!filterCategory ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
          All
        </button>
        {CATEGORIES.filter(c => counts[c] > 0).map(cat => {
          const cm = CATEGORY_META[cat]
          return (
            <button key={cat} onClick={() => setFilterCategory(cat === filterCategory ? '' : cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterCategory === cat ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
              <span className={cm.color}>{cat}</span>
              <span className="text-slate-600">{counts[cat]}</span>
            </button>
          )
        })}
        {admin && (
          <select value={filterUser} onChange={e => setFilterUser(e.target.value)}
            className="ml-auto bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:ring-2 focus:ring-blue-500">
            <option value="">All Members</option>
            {allUsers.filter(u => isAssignable(u)).map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Admin: grouped by user */}
      {admin && !filterUser && (
        <div className="space-y-8">
          {allUsers.filter(u => isAssignable(u)).map(u => {
            const userSkills = filtered.filter(s => s.user_id === u.id)
            if (!userSkills.length) return null
            const userGrouped = CATEGORIES.reduce((acc, cat) => {
              const items = userSkills.filter(s => s.category === cat)
              if (items.length) acc[cat] = items
              return acc
            }, {})
            return (
              <div key={u.id}>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-700/50">
                  <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{u.name[0]}</span>
                  </div>
                  <span className="font-semibold text-slate-200">{u.name}</span>
                  <span className="text-xs text-slate-500">{userSkills.length} skill{userSkills.length !== 1 ? 's' : ''}</span>
                  <div className="ml-auto flex gap-1.5 flex-wrap">
                    {PROFICIENCIES.map(p => {
                      const count = userSkills.filter(s => s.proficiency === p).length
                      if (!count) return null
                      const pm = PROF_META[p]
                      return (
                        <span key={p} className={`text-xs px-2 py-0.5 rounded-full ${pm.cls}`}>
                          {count} {p}
                        </span>
                      )
                    })}
                  </div>
                </div>
                {Object.entries(userGrouped).map(([cat, items]) => (
                  <CategorySection key={cat} category={cat} skills={items}
                    canManage={SA}
                    onEdit={item => { setEditItem(item); setShowForm(true) }}
                    onDelete={handleDelete} />
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* Tasker view or filtered admin view */}
      {(!admin || filterUser) && (
        loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-dashed border-slate-700">
            <Code2 size={40} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400 font-medium">No skills yet</p>
            <p className="text-slate-600 text-sm mt-1">Add your first skill to build your fullstack profile.</p>
          </div>
        ) : (
          <div>
            {Object.entries(grouped).map(([cat, items]) => (
              <CategorySection key={cat} category={cat} skills={items}
                canManage={true}
                onEdit={item => { setEditItem(item); setShowForm(true) }}
                onDelete={handleDelete} />
            ))}
          </div>
        )
      )}

      {showForm && (
        <SkillForm
          initial={editItem}
          currentUser={user}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditItem(null) }}
        />
      )}
    </div>
  )
}
