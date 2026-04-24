const variantMap = {
  default: 'bg-gray-100 text-gray-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
  pink: 'bg-pink-100 text-pink-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  cyan: 'bg-cyan-100 text-cyan-700',
  teal: 'bg-teal-100 text-teal-700',
}

const priorityMap = {
  Low: 'bg-gray-100 text-gray-600',
  Medium: 'bg-yellow-100 text-yellow-700',
  High: 'bg-orange-100 text-orange-700',
  'Dream Job': 'bg-purple-100 text-purple-700',
}

const statusMap = {
  Wishlist: 'bg-gray-100 text-gray-600',
  Applied: 'bg-blue-100 text-blue-700',
  'Phone Screen': 'bg-cyan-100 text-cyan-700',
  Interview: 'bg-indigo-100 text-indigo-700',
  'Technical Test': 'bg-purple-100 text-purple-700',
  Offer: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  Withdrawn: 'bg-gray-100 text-gray-500',
  Ghosted: 'bg-yellow-100 text-yellow-600',
}

export default function Badge({ children, variant = 'default', className = '' }) {
  const cls = variantMap[variant] || variantMap.default
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls} ${className}`}>
      {children}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  const cls = priorityMap[priority] || priorityMap.Medium
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{priority}</span>
}

export function StatusBadge({ status }) {
  const cls = statusMap[status] || statusMap.Applied
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>
}
