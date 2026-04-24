import { ChevronDown, ChevronRight, Clock } from 'lucide-react'
import { useState } from 'react'
import { formatDate, formatDuration } from '../../utils/formatTime'
import { tzLabel } from '../../utils/timezone'

const typeColors = {
  'Annotation Task': 'bg-blue-900/40 text-blue-300',
  'Software Task':   'bg-purple-900/40 text-purple-300',
  'Review':          'bg-orange-900/40 text-orange-300',
  'Communication':   'bg-green-900/40 text-green-300',
  'Research':        'bg-cyan-900/40 text-cyan-300',
  'Other':           'bg-slate-700 text-slate-300',
}

export default function SessionCard({ session, tz }) {
  const [expanded, setExpanded] = useState(false)
  const entries = session.activity_entries || []
  const tzAbbr = tz ? tzLabel(tz) : null

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center gap-3 p-4 hover:bg-slate-700/50 transition-colors text-left"
      >
        {expanded
          ? <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
          : <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-slate-200">{formatDate(session.date)}</span>
            {tzAbbr && (
              <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                {tzAbbr}
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              session.status === 'completed' ? 'bg-green-900/40 text-green-400' :
              session.status === 'active'    ? 'bg-blue-900/40 text-blue-400'  :
                                               'bg-yellow-900/40 text-yellow-400'
            }`}>{session.status}</span>
            <span className="text-xs text-slate-500">{entries.length} entries</span>
          </div>
          {session.description && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">{session.description}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-200 flex-shrink-0">
          <Clock size={14} className="text-blue-400" />
          {formatDuration(session.total_seconds || 0)}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-700 px-4 pb-4 pt-3 space-y-2">
          {entries.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-2">No activity entries for this session.</p>
          ) : (
            entries.map(entry => (
              <div key={entry.id} className="flex items-start gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${typeColors[entry.entry_type] || typeColors.Other}`}>
                  {entry.entry_type}
                </span>
                <div>
                  <span className="font-medium text-slate-300">{entry.title}</span>
                  {entry.notes && <span className="text-slate-500"> — {entry.notes}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
