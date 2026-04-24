import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { PriorityBadge } from '../ui/Badge'
import { formatDate, isOverdue } from '../../utils/formatTime'
import { CalendarDays, Link, AlertCircle } from 'lucide-react'

const STATUSES = ['Wishlist','Applied','Phone Screen','Interview','Technical Test','Offer','Rejected','Withdrawn','Ghosted']

const statusColors = {
  Wishlist: 'border-t-gray-400',
  Applied: 'border-t-blue-500',
  'Phone Screen': 'border-t-cyan-500',
  Interview: 'border-t-indigo-500',
  'Technical Test': 'border-t-purple-500',
  Offer: 'border-t-green-500',
  Rejected: 'border-t-red-500',
  Withdrawn: 'border-t-gray-400',
  Ghosted: 'border-t-yellow-500',
}

function KanbanCard({ app, index, onClick }) {
  const overdue = isOverdue(app.follow_up_date)

  return (
    <Draggable draggableId={app.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(app)}
          className={`bg-white rounded-xl border border-gray-100 p-3 cursor-pointer hover:shadow-md transition-all select-none
            ${snapshot.isDragging ? 'shadow-lg rotate-1 opacity-90' : ''}`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{app.company_name}</p>
              <p className="text-xs text-gray-500 truncate">{app.job_title}</p>
            </div>
            <PriorityBadge priority={app.priority} />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
            <span className="flex items-center gap-1">
              <CalendarDays size={11} /> {formatDate(app.application_date)}
            </span>
            {app.follow_up_date && (
              <span className={`flex items-center gap-1 ${overdue ? 'text-red-500' : ''}`}>
                {overdue && <AlertCircle size={11} />}
                {formatDate(app.follow_up_date)}
              </span>
            )}
          </div>

          {app.personas?.full_name && (
            <p className="text-xs text-purple-600 mt-1.5 truncate">
              👤 {app.personas.full_name}
            </p>
          )}
        </div>
      )}
    </Draggable>
  )
}

export default function KanbanBoard({ applications, onStatusChange, onCardClick }) {
  const grouped = STATUSES.reduce((acc, s) => {
    acc[s] = applications.filter(a => a.status === s)
    return acc
  }, {})

  const handleDragEnd = (result) => {
    const { draggableId, destination } = result
    if (!destination) return
    const newStatus = destination.droppableId
    const app = applications.find(a => a.id === draggableId)
    if (app && app.status !== newStatus) {
      onStatusChange(draggableId, newStatus)
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 min-h-[500px]">
        {STATUSES.map(status => (
          <div key={status} className="flex-shrink-0 w-56">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{status}</span>
              <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                {grouped[status].length}
              </span>
            </div>
            <Droppable droppableId={status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[400px] rounded-xl p-2 space-y-2 border-t-4 ${statusColors[status]}
                    ${snapshot.isDraggingOver ? 'bg-blue-50 border-blue-200' : 'bg-gray-50/70'}`}
                >
                  {grouped[status].map((app, i) => (
                    <KanbanCard key={app.id} app={app} index={i} onClick={onCardClick} />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}
