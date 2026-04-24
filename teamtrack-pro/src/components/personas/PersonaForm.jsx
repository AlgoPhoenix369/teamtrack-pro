import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import { adminService } from '../../services/adminService'
import { isAssignable } from '../../utils/roleGuard'

const EMPTY = {
  full_name: '', email: '', phone: '', linkedin_url: '',
  location: '', headline: '', notes: '', assigned_to: '', is_active: true,
}

export default function PersonaForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial })
  const [users, setUsers] = useState([])
  const [resumeFile, setResumeFile] = useState(null)

  useEffect(() => {
    adminService.getAllUsers()
      .then(all => setUsers((all || []).filter(u => isAssignable(u))))
  }, [])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form, resumeFile)
  }

  const field = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {field('Full Name *', 'full_name', 'text', 'e.g. Sarah Johnson')}
        {field('Email', 'email', 'email', 'persona@email.com')}
        {field('Phone', 'phone', 'tel', '+1 555 000 0000')}
        {field('LinkedIn URL', 'linkedin_url', 'url', 'https://linkedin.com/in/...')}
        {field('Location', 'location', 'text', 'e.g. New York, USA')}
        {field('Professional Headline', 'headline', 'text', 'e.g. Senior Software Engineer')}

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Assign To</label>
          <select value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
            <option value="">Unassigned</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Resume File</label>
          <input type="file" accept=".pdf,.doc,.docx"
            onChange={e => setResumeFile(e.target.files[0])}
            className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:text-xs file:font-medium hover:file:bg-blue-100" />
          {form.resume_url && !resumeFile && (
            <a href={form.resume_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 mt-1 hover:underline block">
              Current resume
            </a>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
            placeholder="Special instructions for using this persona..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="active" checked={form.is_active}
            onChange={e => set('is_active', e.target.checked)} className="rounded" />
          <label htmlFor="active" className="text-sm text-gray-700">Active persona</label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>{initial ? 'Save Changes' : 'Create Persona'}</Button>
      </div>
    </form>
  )
}
