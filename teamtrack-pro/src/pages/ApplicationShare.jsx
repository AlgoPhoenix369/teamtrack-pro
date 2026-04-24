import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { applicationService } from '../services/applicationService'
import { StatusBadge, PriorityBadge } from '../components/ui/Badge'
import { formatDate } from '../utils/formatTime'
import { ExternalLink, Briefcase } from 'lucide-react'

export default function ApplicationShare() {
  const { id } = useParams()
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    applicationService.getPublicApplication(id)
      .then(setApp)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  )

  if (error || !app) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Briefcase size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Application not found</h2>
        <p className="text-gray-500 mt-1">This link may be invalid or expired.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-950 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-blue-700 px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">{app.job_title}</h1>
              <p className="text-blue-200 mt-1">{app.company_name}</p>
            </div>
            <a href={app.application_url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
              <ExternalLink size={12} /> View Posting
            </a>
          </div>
          <div className="flex gap-2 mt-3">
            <StatusBadge status={app.status} />
            <PriorityBadge priority={app.priority} />
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 gap-5">
          {[
            ['Job Board', app.job_board],
            ['Applied', formatDate(app.application_date)],
            ['Employment Type', app.employment_type],
            ['Work Mode', app.work_mode],
            ['Location', app.location || '—'],
            ['Salary Range', app.salary_range_min ? `${app.currency} ${app.salary_range_min}–${app.salary_range_max}` : '—'],
            ['Follow-up Date', app.follow_up_date ? formatDate(app.follow_up_date) : '—'],
            ['Cover Letter', app.cover_letter_used ? 'Yes' : 'No'],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</p>
              <p className="text-gray-800 font-medium mt-0.5">{value}</p>
            </div>
          ))}

          {app.notes && (
            <div className="col-span-2 border-t pt-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Notes</p>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{app.notes}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t text-center">
          <p className="text-xs text-gray-400">Shared via <span className="font-semibold">TeamTrack Pro</span></p>
        </div>
      </div>
    </div>
  )
}
