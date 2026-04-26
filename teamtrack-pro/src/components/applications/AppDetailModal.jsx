import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import { StatusBadge, PriorityBadge } from '../ui/Badge'
import Timeline from './Timeline'
import AppForm from './AppForm'
import { applicationService } from '../../services/applicationService'
import { aiInterviewService, STATUS_META, PLATFORM_COLORS } from '../../services/aiInterviewService'
import { formatDate } from '../../utils/formatTime'
import { ExternalLink, Copy, Pencil, Bot, Calendar, Clock } from 'lucide-react'
import Button from '../ui/Button'
import toast from 'react-hot-toast'

const fmtDT = iso => iso ? new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
const scoreColor = s => s == null ? 'text-gray-400' : s >= 80 ? 'text-green-600' : s >= 60 ? 'text-amber-500' : 'text-red-500'

function AIInterviewTab({ appId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    aiInterviewService.getByApplication(appId)
      .then(setItems).catch(() => {}).finally(() => setLoading(false))
  }, [appId])

  if (loading) return <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
  if (items.length === 0) return (
    <div className="text-center py-10">
      <Bot size={28} className="mx-auto text-gray-300 mb-2" />
      <p className="text-sm text-gray-400">No AI interviews logged for this application.</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {items.map(x => {
        const meta  = STATUS_META[x.status] || STATUS_META.scheduled
        const pColor = PLATFORM_COLORS[x.platform] || '#6B7280'
        return (
          <div key={x.id} className="border border-gray-100 dark:border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
              <span className="text-xs font-bold text-white px-2.5 py-1 rounded-full" style={{ backgroundColor: pColor }}>
                {x.platform}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
              {x.score != null && (
                <span className={`text-sm font-black ${scoreColor(x.score)}`}>{x.score} / 100</span>
              )}
            </div>

            {/* Score bar */}
            {x.score != null && (
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full ${x.score >= 80 ? 'bg-green-500' : x.score >= 60 ? 'bg-amber-400' : 'bg-red-500'}`}
                  style={{ width: `${x.score}%` }} />
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
              <span className="flex items-center gap-1"><Calendar size={10} /> {fmtDT(x.scheduled_at)}</span>
              {x.duration_minutes && <span className="flex items-center gap-1"><Clock size={10} /> {x.duration_minutes}m</span>}
            </div>

            {x.feedback && (
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-2.5 text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                <span className="font-semibold block mb-0.5">AI Feedback</span>{x.feedback}
              </div>
            )}
            {x.prep_notes && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2.5 mt-2 text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                <span className="font-semibold block mb-0.5">Prep Notes</span>{x.prep_notes}
              </div>
            )}
            {x.link && (
              <a href={x.link} target="_blank" rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                <ExternalLink size={10} /> Open Interview
              </a>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function AppDetailModal({ app, onClose, onUpdate, canEdit }) {
  const [tab, setTab] = useState('details')
  const [timeline, setTimeline] = useState([])
  const [aiCount, setAiCount] = useState(0)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (app) {
      applicationService.getTimeline(app.id).then(setTimeline).catch(() => {})
      aiInterviewService.getByApplication(app.id).then(r => setAiCount(r.length)).catch(() => {})
    }
  }, [app])

  if (!app) return null

  const shareUrl = `${window.location.origin}/applications/share/${app.id}`

  const handleUpdate = async (data) => {
    setSaving(true)
    try {
      await onUpdate(app.id, data)
      setEditing(false)
      toast.success('Application updated!')
    } catch (e) { console.error('updateApplication error:', e); toast.error(e?.message || 'Failed to update') }
    finally { setSaving(false) }
  }

  return (
    <Modal isOpen={!!app} onClose={onClose} title={`${app.company_name} — ${app.job_title}`} size="lg">
      {editing ? (
        <AppForm initial={app} onSubmit={handleUpdate} onCancel={() => setEditing(false)} loading={saving} />
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <StatusBadge status={app.status} />
            <PriorityBadge priority={app.priority} />
            <span className="text-xs text-gray-400">{app.employment_type} · {app.work_mode}</span>
            {canEdit && (
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                <Pencil size={13} /> Edit
              </Button>
            )}
          </div>

          {/* Share link */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 mb-4">
            <span className="text-xs text-gray-500 truncate flex-1">{shareUrl}</span>
            <button onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success('Copied!') }}
              className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-500">
              <Copy size={14} />
            </button>
          </div>

          <div className="flex border-b border-gray-100 mb-4">
            {[
              { key: 'details', label: 'Details' },
              { key: 'timeline', label: 'Timeline' },
              { key: 'ai_interviews', label: 'AI Interviews', count: aiCount },
            ].map(({ key, label, count }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5
                  ${tab === key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {label}
                {count > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-1.5 py-0.5 rounded-full">{count}</span>
                )}
              </button>
            ))}
          </div>

          {tab === 'details' && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ['Job Board', app.job_board],
                ['Applied', formatDate(app.application_date)],
                ['Location', app.location || '—'],
                ['Follow-up', app.follow_up_date ? formatDate(app.follow_up_date) : '—'],
                ['Salary', app.salary_range_min ? `${app.currency} ${app.salary_range_min}–${app.salary_range_max}` : '—'],
                ['Contact', app.contact_name || '—'],
                ['Resume', app.resume_version || '—'],
                ['Cover Letter', app.cover_letter_used ? 'Yes' : 'No'],
                ['Tags', app.tags || '—'],
                ['Persona', app.personas?.full_name || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                  <p className="font-medium text-gray-800 mt-0.5">{value}</p>
                </div>
              ))}

              <div className="col-span-2">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Notes</p>
                <p className="text-gray-700 mt-0.5 whitespace-pre-wrap text-sm">{app.notes || '—'}</p>
              </div>

              <div className="col-span-2 flex gap-2">
                <a href={app.application_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  <ExternalLink size={12} /> View Job Posting
                </a>
                {app.contact_linkedin && (
                  <a href={app.contact_linkedin} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <ExternalLink size={12} /> Contact LinkedIn
                  </a>
                )}
              </div>
            </div>
          )}

          {tab === 'timeline' && <Timeline events={timeline} />}
          {tab === 'ai_interviews' && <AIInterviewTab appId={app.id} />}
        </>
      )}
    </Modal>
  )
}
