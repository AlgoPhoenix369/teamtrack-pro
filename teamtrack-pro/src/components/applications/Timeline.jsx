import { formatDateTime } from '../../utils/formatTime'
import { ArrowRight, PlusCircle, MessageSquare } from 'lucide-react'

const eventIcons = {
  created: <PlusCircle size={14} className="text-green-500" />,
  status_change: <ArrowRight size={14} className="text-blue-500" />,
  note: <MessageSquare size={14} className="text-purple-500" />,
}

export default function Timeline({ events }) {
  if (!events?.length) return (
    <p className="text-sm text-gray-400 text-center py-4">No timeline events yet.</p>
  )

  return (
    <div className="space-y-3">
      {events.map(ev => (
        <div key={ev.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              {eventIcons[ev.event_type] || eventIcons.note}
            </div>
            <div className="flex-1 w-px bg-gray-100 mt-1" />
          </div>
          <div className="pb-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {ev.event_type === 'status_change' && (
                <span className="text-sm text-gray-700">
                  Status changed{' '}
                  <span className="font-medium text-gray-500 line-through">{ev.old_value}</span>
                  {' → '}
                  <span className="font-semibold text-blue-700">{ev.new_value}</span>
                </span>
              )}
              {ev.event_type === 'created' && (
                <span className="text-sm text-gray-700 font-medium">Application created</span>
              )}
              {ev.note && <span className="text-sm text-gray-600">{ev.note}</span>}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {ev.users?.name && <>{ev.users.name} · </>}{formatDateTime(ev.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
