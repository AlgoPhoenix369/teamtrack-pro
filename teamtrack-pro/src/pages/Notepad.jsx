import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { StickyNote, Save, Trash2, Plus, X, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Persistence helpers ───────────────────────────────────────────────
const storageKey = userId => `notepad_${userId}`

function loadNotes(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveNotes(userId, notes) {
  localStorage.setItem(storageKey(userId), JSON.stringify(notes))
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const NOTE_COLORS = [
  { bg: 'bg-yellow-50  dark:bg-yellow-900/20', border: 'border-yellow-300 dark:border-yellow-700', label: 'Yellow' },
  { bg: 'bg-blue-50    dark:bg-blue-900/20',   border: 'border-blue-300   dark:border-blue-700',   label: 'Blue'   },
  { bg: 'bg-green-50   dark:bg-green-900/20',  border: 'border-green-300  dark:border-green-700',  label: 'Green'  },
  { bg: 'bg-pink-50    dark:bg-pink-900/20',   border: 'border-pink-300   dark:border-pink-700',   label: 'Pink'   },
  { bg: 'bg-purple-50  dark:bg-purple-900/20', border: 'border-purple-300 dark:border-purple-700', label: 'Purple' },
  { bg: 'bg-orange-50  dark:bg-orange-900/20', border: 'border-orange-300 dark:border-orange-700', label: 'Orange' },
]

const fmtDate = iso => {
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now - d) / 60000)
  if (diff < 1)   return 'Just now'
  if (diff < 60)  return `${diff}m ago`
  if (diff < 1440)return `${Math.floor(diff / 60)}h ago`
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

// ── Note card ─────────────────────────────────────────────────────────
function NoteCard({ note, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note.body)
  const [titleDraft, setTitleDraft] = useState(note.title)
  const textRef = useRef(null)
  const color = NOTE_COLORS[note.colorIdx ?? 0]

  useEffect(() => {
    if (editing) textRef.current?.focus()
  }, [editing])

  const save = () => {
    if (!draft.trim() && !titleDraft.trim()) { onDelete(note.id); return }
    onUpdate(note.id, { title: titleDraft.trim(), body: draft, updated_at: new Date().toISOString() })
    setEditing(false)
  }

  const cancel = () => {
    setDraft(note.body)
    setTitleDraft(note.title)
    setEditing(false)
  }

  return (
    <div className={`rounded-2xl border-2 ${color.bg} ${color.border} p-4 flex flex-col gap-2 group transition-shadow hover:shadow-md`}>
      {editing ? (
        <>
          <input
            className="w-full bg-transparent text-sm font-bold text-gray-800 dark:text-white border-b border-current/20 pb-1 focus:outline-none placeholder-gray-400"
            value={titleDraft}
            onChange={e => setTitleDraft(e.target.value)}
            placeholder="Title (optional)"
          />
          <textarea
            ref={textRef}
            className="w-full bg-transparent text-sm text-gray-700 dark:text-slate-200 resize-none focus:outline-none min-h-[80px] leading-relaxed"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Write your note…"
          />
          <div className="flex gap-2 pt-1">
            <button onClick={save}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-current/20 rounded-lg text-xs font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600">
              <Save size={12} /> Save
            </button>
            <button onClick={cancel}
              className="px-3 py-1.5 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 rounded-lg">
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          {note.title && (
            <p className="text-sm font-bold text-gray-800 dark:text-white">{note.title}</p>
          )}
          <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed flex-1 min-h-[40px]"
            onClick={() => setEditing(true)}>
            {note.body || <span className="text-gray-400 italic">Empty note — click to edit</span>}
          </p>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
              <Clock size={10} />
              <span>{fmtDate(note.updated_at || note.created_at)}</span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setEditing(true)}
                className="px-2 py-1 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white bg-white/60 dark:bg-slate-700/60 rounded-lg">
                Edit
              </button>
              <button onClick={() => onDelete(note.id)}
                className="p-1 text-gray-400 hover:text-red-500 bg-white/60 dark:bg-slate-700/60 rounded-lg">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Color picker ──────────────────────────────────────────────────────
function ColorPicker({ selected, onSelect }) {
  return (
    <div className="flex gap-1.5">
      {NOTE_COLORS.map((c, i) => (
        <button key={i} onClick={() => onSelect(i)} title={c.label}
          className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${c.bg} ${c.border}
            ${selected === i ? 'ring-2 ring-offset-1 ring-gray-400 dark:ring-slate-400 scale-110' : ''}`} />
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────
export default function Notepad() {
  const { user } = useAuth()
  const [notes, setNotes] = useState([])
  const [newColor, setNewColor] = useState(0)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setNotes(loadNotes(user.id))
  }, [user.id])

  const persist = useCallback(updated => {
    setNotes(updated)
    saveNotes(user.id, updated)
  }, [user.id])

  const addNote = () => {
    const n = {
      id: uid(),
      title: '',
      body: '',
      colorIdx: newColor,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const updated = [n, ...notes]
    persist(updated)
  }

  const updateNote = (id, changes) => {
    persist(notes.map(n => n.id === id ? { ...n, ...changes } : n))
    toast.success('Note saved', { duration: 1200 })
  }

  const deleteNote = id => {
    persist(notes.filter(n => n.id !== id))
    toast('Note deleted', { icon: '🗑️', duration: 1500 })
  }

  const clearAll = () => {
    if (!confirm('Delete all notes? This cannot be undone.')) return
    persist([])
    toast('All notes cleared', { icon: '🗑️' })
  }

  const filtered = notes.filter(n =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.body.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center">
            <StickyNote size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Notepad</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Private notes — only visible to you</p>
          </div>
        </div>
        {notes.length > 0 && (
          <button onClick={clearAll}
            className="text-xs text-red-500 dark:text-red-400 hover:underline font-medium">
            Clear all
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          className="flex-1 min-w-48 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search notes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <ColorPicker selected={newColor} onSelect={setNewColor} />
        <button onClick={addNote}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
          <Plus size={15} /> New Note
        </button>
      </div>

      {/* Stats bar */}
      {notes.length > 0 && (
        <p className="text-xs text-gray-400 dark:text-slate-500">
          {notes.length} note{notes.length !== 1 ? 's' : ''}
          {search && filtered.length !== notes.length && ` · ${filtered.length} matching`}
          {' '}· stored locally, never shared
        </p>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <StickyNote size={40} className="mx-auto text-gray-300 dark:text-slate-600 mb-3" />
          <p className="text-gray-500 dark:text-slate-400 text-sm">
            {search ? 'No notes match your search.' : 'No notes yet. Create your first one!'}
          </p>
          {!search && (
            <button onClick={addNote}
              className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Add a note
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(note => (
            <NoteCard key={note.id} note={note} onUpdate={updateNote} onDelete={deleteNote} />
          ))}
        </div>
      )}
    </div>
  )
}
