import { useState } from 'react'
import { useTimer } from '../../context/TimerContext'
import Button from '../ui/Button'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'

const ENTRY_TYPES = ['Annotation Task', 'Software Task', 'Review', 'Communication', 'Research', 'Other']

export default function ActivityEntryForm() {
  const { addEntry, session } = useTimer()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [entryType, setEntryType] = useState('Other')
  const [loading, setLoading] = useState(false)

  if (!session) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return toast.error('Title is required')
    setLoading(true)
    try {
      await addEntry({ title: title.trim(), notes: notes.trim(), entry_type: entryType })
      setTitle(''); setNotes(''); setEntryType('Other')
      setOpen(false)
      toast.success('Activity logged!')
    } catch {
      toast.error('Failed to log activity')
    } finally { setLoading(false) }
  }

  return (
    <div className="mb-4">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-2 border-2 border-dashed border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all"
        >
          <Plus size={16} /> Log Activity Entry
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="Activity title (e.g. Reviewed dataset batch #4)"
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
              />
            </div>
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
              value={entryType}
              onChange={e => setEntryType(e.target.value)}
            >
              {ENTRY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <textarea
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white resize-none"
            placeholder="Additional notes (optional)"
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" type="submit" loading={loading}>Log Entry</Button>
          </div>
        </form>
      )}
    </div>
  )
}
