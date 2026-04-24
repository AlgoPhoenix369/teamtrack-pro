import { useState } from 'react'
import { StatusBadge, PriorityBadge } from '../ui/Badge'
import { formatDate, isOverdue } from '../../utils/formatTime'
import { Pencil, Trash2, ExternalLink, AlertCircle, Copy } from 'lucide-react'
import { ConfirmModal } from '../ui/Modal'
import toast from 'react-hot-toast'

export default function AppTable({ applications, onEdit, onDelete, onRowClick, canEdit }) {
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [sortField, setSortField] = useState('application_date')
  const [sortDir, setSortDir] = useState('desc')

  const sorted = [...applications].sort((a, b) => {
    const av = a[sortField] || ''
    const bv = b[sortField] || ''
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
  })

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const copyShareLink = (id, e) => {
    e.stopPropagation()
    const url = `${window.location.origin}/applications/share/${id}`
    navigator.clipboard.writeText(url)
    toast.success('Share link copied!')
  }

  const Th = ({ field, label }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none"
      onClick={() => handleSort(field)}
    >
      {label} {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  )

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <Th field="company_name" label="Company" />
              <Th field="job_title" label="Role" />
              <Th field="status" label="Status" />
              <Th field="priority" label="Priority" />
              <Th field="application_date" label="Applied" />
              <Th field="follow_up_date" label="Follow-up" />
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map(app => {
              const overdue = isOverdue(app.follow_up_date)
              return (
                <tr key={app.id} onClick={() => onRowClick(app)}
                  className="hover:bg-blue-50/50 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{app.company_name}</p>
                      <p className="text-xs text-gray-400">{app.job_board}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{app.job_title}</td>
                  <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={app.priority} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(app.application_date)}</td>
                  <td className="px-4 py-3">
                    {app.follow_up_date ? (
                      <span className={`text-xs flex items-center gap-1 ${overdue ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                        {overdue && <AlertCircle size={12} />}
                        {formatDate(app.follow_up_date)}
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <a href={app.application_url} target="_blank" rel="noreferrer"
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <ExternalLink size={14} />
                      </a>
                      <button onClick={(e) => copyShareLink(app.id, e)}
                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors">
                        <Copy size={14} />
                      </button>
                      {canEdit && (
                        <>
                          <button onClick={() => onEdit(app)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeleteTarget(app)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { onDelete(deleteTarget.id); setDeleteTarget(null) }}
        title="Delete Application"
        message={`Delete "${deleteTarget?.company_name} — ${deleteTarget?.job_title}"? This cannot be undone.`}
      />
    </>
  )
}
