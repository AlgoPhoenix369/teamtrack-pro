import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { personaService } from '../../services/personaService'
import { isAdmin } from '../../utils/roleGuard'
import Button from '../ui/Button'

const STATUSES = ['Wishlist','Applied','Phone Screen','Interview','Technical Test','Offer','Rejected','Withdrawn','Ghosted']
const PRIORITIES = ['Low','Medium','High','Dream Job']
const JOB_BOARDS = ['LinkedIn','Indeed','Glassdoor','Company Website','Referral','Other']
const EMP_TYPES = ['Full-time','Part-time','Contract','Freelance','Internship']
const WORK_MODES = ['Remote','Hybrid','On-site']
const CURRENCIES = ['USD','KES','GBP','EUR','CAD','AUD','NGN']

const EMPTY = {
  company_name:'', job_title:'', job_board:'LinkedIn', application_url:'',
  application_date: new Date().toISOString().split('T')[0],
  status:'Wishlist', priority:'Medium', salary_range_min:'', salary_range_max:'',
  currency:'USD', employment_type:'Full-time', work_mode:'Remote', location:'',
  contact_name:'', contact_email:'', contact_linkedin:'', resume_version:'',
  cover_letter_used:false, notes:'', follow_up_date:'', tags:'', persona_id:'',
}

export default function AppForm({ initial, onSubmit, onCancel, loading }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ ...EMPTY, ...initial })
  const [personas, setPersonas] = useState([])
  const [tab, setTab] = useState('basic')

  useEffect(() => {
    const fetch = isAdmin(user)
      ? personaService.getAllPersonasFlat()
      : personaService.getPersonasByUser(user.id)
    fetch.then(list => {
      if (initial?.persona_id && !list.find(p => p.id === initial.persona_id) && initial.personas?.full_name) {
        setPersonas([{ id: initial.persona_id, full_name: initial.personas.full_name, email: initial.personas.email }, ...list])
      } else {
        setPersonas(list)
      }
    }).catch(() => {})
  }, [user, initial?.persona_id])

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ ...form, owner_id: user.id })
  }

  const field = (label, key, type = 'text', props = {}) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => set(key, e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        {...props}
      />
    </div>
  )

  const select = (label, key, options) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select
        value={form[key]}
        onChange={e => set(key, e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
      >
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  )

  const tabs = ['basic', 'details', 'contact', 'notes']

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >{t}</button>
        ))}
      </div>

      {tab === 'basic' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('Company Name *', 'company_name', 'text', { required: true, placeholder: 'e.g. Google' })}
          {field('Job Title *', 'job_title', 'text', { required: true, placeholder: 'e.g. Software Engineer' })}
          {field('Application URL *', 'application_url', 'url', { required: true, placeholder: 'https://...' })}
          {select('Job Board', 'job_board', JOB_BOARDS)}
          {field('Application Date', 'application_date', 'date')}
          {select('Status', 'status', STATUSES)}
          {select('Priority', 'priority', PRIORITIES)}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Persona Used</label>
            <select value={form.persona_id} onChange={e => set('persona_id', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
              <option value="">None / Personal</option>
              {personas.map(p => <option key={p.id} value={p.id}>{p.full_name}{p.email ? ` (${p.email})` : ''}</option>)}
            </select>
          </div>
          {field('Follow-up Date', 'follow_up_date', 'date')}
        </div>
      )}

      {tab === 'details' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {select('Employment Type', 'employment_type', EMP_TYPES)}
          {select('Work Mode', 'work_mode', WORK_MODES)}
          {field('Location', 'location', 'text', { placeholder: 'e.g. Nairobi, Kenya' })}
          {select('Currency', 'currency', CURRENCIES)}
          {field('Min Salary', 'salary_range_min', 'number', { placeholder: '0', min: 0 })}
          {field('Max Salary', 'salary_range_max', 'number', { placeholder: '0', min: 0 })}
          {field('Resume Version', 'resume_version', 'text', { placeholder: 'e.g. v3-senior-dev.pdf' })}
          <div className="flex items-center gap-2 pt-5">
            <input type="checkbox" id="cover" checked={form.cover_letter_used}
              onChange={e => set('cover_letter_used', e.target.checked)} className="rounded" />
            <label htmlFor="cover" className="text-sm text-gray-700">Cover letter used</label>
          </div>
          <div className="sm:col-span-2">
            {field('Tags (comma-separated)', 'tags', 'text', { placeholder: 'startup, fintech, urgent' })}
          </div>
        </div>
      )}

      {tab === 'contact' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('Contact Name', 'contact_name', 'text', { placeholder: 'Recruiter / Hiring Manager' })}
          {field('Contact Email', 'contact_email', 'email', { placeholder: 'recruiter@company.com' })}
          {field('Contact LinkedIn', 'contact_linkedin', 'url', { placeholder: 'https://linkedin.com/in/...' })}
        </div>
      )}

      {tab === 'notes' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={8}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Add notes about this application..."
          />
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>{initial ? 'Save Changes' : 'Add Application'}</Button>
      </div>
    </form>
  )
}
