import { formatDateTime } from '../../utils/formatTime'
import { Clock, Tag, User } from 'lucide-react'

const typeColors = {
  'Annotation Task': 'bg-blue-100 text-blue-700',
  'Software Task': 'bg-purple-100 text-purple-700',
  'Review': 'bg-orange-100 text-orange-700',
  'Communication': 'bg-green-100 text-green-700',
  'Research': 'bg-cyan-100 text-cyan-700',
  'Other': 'bg-gray-100 text-gray-600',
}

export default function EntryFeed({ entries, user }) {
  if (!entries?.length) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        <Clock size={32} className="mx-auto mb-2 opacity-40" />
        No activity entries yet. Log your first activity above.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {entries.map(entry => (
        <div key={entry.id} className="bg-white rounded-xl border border-gray-100 p-3 flex gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm text-gray-800">{entry.title}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[entry.entry_type] || typeColors.Other}`}>
                <Tag size={10} />{entry.entry_type}
              </span>
            </div>
            {entry.notes && <p className="text-xs text-gray-500 mt-0.5">{entry.notes}</p>}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-xs text-gray-400">{formatDateTime(entry.timestamp)}</p>
              {user && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                  <User size={10} className="text-gray-300" />
                  {user.name}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
