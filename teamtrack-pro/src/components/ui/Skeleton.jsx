export function SkeletonLine({ className = '' }) {
  return <div className={`skeleton h-4 ${className}`} />
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-xl p-4 border border-gray-100 space-y-3 ${className}`}>
      <SkeletonLine className="w-2/3 h-5" />
      <SkeletonLine className="w-full" />
      <SkeletonLine className="w-1/2" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <SkeletonLine key={j} className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export default function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />
}
