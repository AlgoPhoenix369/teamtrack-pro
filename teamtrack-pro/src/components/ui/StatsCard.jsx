export default function StatsCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }) {
  const colors = {
    blue:   { bg: 'bg-blue-900/30',   icon: 'text-blue-400',   border: 'border-blue-800/40'   },
    green:  { bg: 'bg-green-900/30',  icon: 'text-green-400',  border: 'border-green-800/40'  },
    purple: { bg: 'bg-purple-900/30', icon: 'text-purple-400', border: 'border-purple-800/40' },
    orange: { bg: 'bg-orange-900/30', icon: 'text-orange-400', border: 'border-orange-800/40' },
    red:    { bg: 'bg-red-900/30',    icon: 'text-red-400',    border: 'border-red-800/40'    },
  }
  const c = colors[color] || colors.blue

  return (
    <div className={`bg-slate-800 rounded-xl p-5 border ${c.border} flex items-start gap-4`}>
      <div className={`${c.bg} rounded-xl p-3 flex-shrink-0`}>
        {Icon && <Icon size={22} className={c.icon} />}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-100 mt-0.5">{value}</p>
        {subtitle && <div className="mt-1">{subtitle}</div>}
        {trend && (
          <p className={`text-xs mt-1 font-medium ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last week
          </p>
        )}
      </div>
    </div>
  )
}
