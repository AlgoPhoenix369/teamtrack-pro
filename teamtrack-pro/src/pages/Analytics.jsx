import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRealtime } from '../context/RealtimeContext'
import { Navigate } from 'react-router-dom'
import { adminService } from '../services/adminService'
import { sessionService } from '../services/sessionService'
import { applicationService } from '../services/applicationService'
import { aiInterviewService } from '../services/aiInterviewService'
import { milestoneService } from '../services/milestoneService'
import { isSuperAdmin, isAssignable } from '../utils/roleGuard'
import { formatDuration } from '../utils/formatTime'
import { TZ_KENYA, todayInTz } from '../utils/timezone'
import { SkeletonCard } from '../components/ui/Skeleton'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'

import {
  TrendingUp, Clock, Briefcase, Target, Bot, Flag,
  Users, Star, ChevronDown, ChevronUp, Award,
} from 'lucide-react'
import { format, subDays, startOfWeek, addDays } from 'date-fns'

const CHART_COLORS = ['#3b82f6','#a855f7','#22c55e','#f59e0b','#ef4444','#06b6d4','#f97316','#8b5cf6']

function StatPill({ label, value, cls = 'bg-slate-700 text-slate-200' }) {
  return (
    <div className={`rounded-xl px-3 py-2 text-center ${cls}`}>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="font-bold text-sm">{value}</p>
    </div>
  )
}

function TaskerCard({ stat, rank, expanded, onToggle }) {
  const rankColor = rank === 0 ? 'from-amber-500 to-orange-500' : rank === 1 ? 'from-slate-400 to-slate-500' : rank === 2 ? 'from-orange-400 to-orange-500' : 'from-blue-700 to-indigo-700'
  const score = Math.round(
    (stat.hoursScore * 0.35) + (stat.appScore * 0.25) + (stat.offerScore * 0.20) +
    (stat.aiScore * 0.10) + (stat.msScore * 0.10)
  )

  return (
    <div className={`bg-slate-800 rounded-2xl border overflow-hidden transition-all ${rank < 3 ? 'border-amber-500/30' : 'border-slate-700'}`}>
      <div className={`h-1 bg-gradient-to-r ${rankColor}`} />
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className={`relative w-11 h-11 rounded-full bg-gradient-to-br ${rankColor} flex items-center justify-center text-white font-black text-base flex-shrink-0`}>
            {stat.user.name[0]}
            {rank < 3 && (
              <span className="absolute -top-1 -right-1 text-sm">{rank === 0 ? '🥇' : rank === 1 ? '🥈' : '🥉'}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-100 truncate">{stat.user.name}</p>
            <p className="text-xs text-slate-500">{stat.user.teams?.name || 'No team'}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-black text-blue-400">{score}</p>
            <p className="text-xs text-slate-500">score</p>
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <StatPill label="Hours" value={`${stat.totalHours}h`} cls="bg-blue-900/30 text-blue-200" />
          <StatPill label="Apps" value={stat.totalApps}        cls="bg-indigo-900/30 text-indigo-200" />
          <StatPill label="Offers" value={stat.totalOffers}    cls="bg-green-900/30 text-green-200" />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <StatPill label="Sessions" value={stat.totalSessions} />
          <StatPill label="AI Interviews" value={stat.totalAI} />
          <StatPill label="Milestones ✓" value={stat.doneMilestones} />
        </div>

        <button onClick={onToggle} className="w-full mt-3 flex items-center justify-center gap-1 text-xs text-blue-400 hover:underline">
          {expanded ? <><ChevronUp size={12} /> Hide weekly chart</> : <><ChevronDown size={12} /> View weekly chart</>}
        </button>

        {expanded && (
          <div className="mt-3">
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={stat.weekData} barSize={14}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="h" width={24} />
                <Tooltip formatter={v => [`${v}h`, 'Hours']}
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, fontSize: 11 }} />
                <Bar dataKey="hours" fill="#3b82f6" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Analytics() {
  const { user } = useAuth()
  const { tick } = useRealtime()
  const [loading, setLoading]   = useState(true)
  const [stats, setStats]       = useState([])
  const [teamTrend, setTeamTrend] = useState([])
  const [expanded, setExpanded] = useState({})
  const [sortBy, setSortBy]     = useState('score')

  if (!isSuperAdmin(user)) return <Navigate to="/dashboard" replace />

  useEffect(() => { loadData() }, [tick])

  const loadData = async () => {
    setLoading(true)
    try {
      const [users, sessions, apps, aiInterviews, milestones] = await Promise.all([
        adminService.getAllUsers(),
        sessionService.getAllSessions(),
        applicationService.getAllApplications(),
        aiInterviewService.getAll(),
        milestoneService.getAll(user),
      ])

      const workers = users.filter(u => isAssignable(u))

      // Week data for team trend (last 14 days)
      const trendData = Array.from({ length: 14 }, (_, i) => {
        const day = format(subDays(new Date(), 13 - i), 'yyyy-MM-dd')
        const total = sessions.filter(s => s.date === day).reduce((a, s) => a + (s.total_seconds || 0), 0)
        return { date: format(subDays(new Date(), 13 - i), 'MMM d'), hours: +(total / 3600).toFixed(1) }
      })
      setTeamTrend(trendData)

      // Max values for scoring normalisation
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })

      const computed = workers.map(u => {
        const userSessions = sessions.filter(s => s.user_id === u.id && s.status === 'completed')
        const totalHours   = +(userSessions.reduce((a, s) => a + (s.total_seconds || 0), 0) / 3600).toFixed(1)
        const userApps     = apps.filter(a => a.owner_id === u.id)
        const totalOffers  = userApps.filter(a => a.status === 'Offer').length
        const userAI       = aiInterviews.filter(x => x.user_id === u.id && x.status === 'completed')
        const avgAIScore   = userAI.filter(x => x.score != null).length
          ? Math.round(userAI.filter(x => x.score != null).reduce((a, x) => a + x.score, 0) / userAI.filter(x => x.score != null).length)
          : null
        const userMs       = milestones.filter(m => m.assigned_to === u.id)
        const doneMilestones = userMs.filter(m => m.status === 'done').length
        const offerRate    = userApps.filter(a => a.status !== 'Wishlist').length
          ? +((totalOffers / userApps.filter(a => a.status !== 'Wishlist').length) * 100).toFixed(1)
          : 0

        // Weekly hours bar data
        const weekData = Array.from({ length: 7 }, (_, i) => {
          const day = format(addDays(weekStart, i), 'yyyy-MM-dd')
          const h = userSessions.filter(s => s.date === day).reduce((a, s) => a + (s.total_seconds || 0), 0)
          return { day: format(addDays(weekStart, i), 'EEE'), hours: +(h / 3600).toFixed(1) }
        })

        return {
          user: u,
          totalHours,
          totalSessions: userSessions.length,
          totalApps: userApps.length,
          totalOffers,
          offerRate,
          totalAI: userAI.length,
          avgAIScore,
          doneMilestones,
          totalMilestones: userMs.length,
          weekData,
          // raw scores for normalisation pass
          _hours: totalHours,
          _apps: userApps.length,
          _offers: totalOffers,
          _ai: userAI.length,
          _ms: doneMilestones,
        }
      })

      // Normalise scores 0-100
      const maxH  = Math.max(...computed.map(c => c._hours), 1)
      const maxA  = Math.max(...computed.map(c => c._apps), 1)
      const maxO  = Math.max(...computed.map(c => c._offers), 1)
      const maxAI = Math.max(...computed.map(c => c._ai), 1)
      const maxMs = Math.max(...computed.map(c => c._ms), 1)

      const withScores = computed.map(c => ({
        ...c,
        hoursScore: Math.round((c._hours / maxH) * 100),
        appScore:   Math.round((c._apps  / maxA)  * 100),
        offerScore: Math.round((c._offers / maxO) * 100),
        aiScore:    Math.round((c._ai    / maxAI) * 100),
        msScore:    Math.round((c._ms    / maxMs) * 100),
      }))

      setStats(withScores)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const sorted = [...stats].sort((a, b) => {
    const score = s => Math.round((s.hoursScore*0.35)+(s.appScore*0.25)+(s.offerScore*0.20)+(s.aiScore*0.10)+(s.msScore*0.10))
    if (sortBy === 'score')    return score(b) - score(a)
    if (sortBy === 'hours')    return b.totalHours - a.totalHours
    if (sortBy === 'apps')     return b.totalApps - a.totalApps
    if (sortBy === 'offers')   return b.totalOffers - a.totalOffers
    return 0
  })

  const teamTotalHours   = stats.reduce((a, s) => a + s.totalHours, 0).toFixed(1)
  const teamTotalApps    = stats.reduce((a, s) => a + s.totalApps, 0)
  const teamTotalOffers  = stats.reduce((a, s) => a + s.totalOffers, 0)
  const teamOfferRate    = teamTotalApps > 0
    ? ((teamTotalOffers / teamTotalApps) * 100).toFixed(1) : '0'

  // Radar data (team averages vs top performer)
  const top = sorted[0]
  const radarData = top ? [
    { metric: 'Hours',    top: top.hoursScore, avg: Math.round(stats.reduce((a,s)=>a+s.hoursScore,0)/(stats.length||1)) },
    { metric: 'Apps',     top: top.appScore,   avg: Math.round(stats.reduce((a,s)=>a+s.appScore,0)/(stats.length||1))  },
    { metric: 'Offers',   top: top.offerScore, avg: Math.round(stats.reduce((a,s)=>a+s.offerScore,0)/(stats.length||1))},
    { metric: 'AI',       top: top.aiScore,    avg: Math.round(stats.reduce((a,s)=>a+s.aiScore,0)/(stats.length||1))   },
    { metric: 'Milestones',top: top.msScore,   avg: Math.round(stats.reduce((a,s)=>a+s.msScore,0)/(stats.length||1))  },
  ] : []

  const today = todayInTz(TZ_KENYA)
  const activeToday = stats.filter(s =>
    s.user && stats.some(() => true) // placeholder — would check live sessions
  ).length

  if (loading) return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Team Analytics</h1>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow shadow-blue-500/20">
          <TrendingUp size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Team Analytics</h1>
          <p className="text-sm text-slate-500">Performance overview — {stats.length} workers · {today} <span className="text-red-400 text-xs font-bold ml-1">EAT</span></p>
        </div>
      </div>

      {/* Team KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Hours Logged', value: `${teamTotalHours}h`, icon: Clock,     color: 'blue'   },
          { label: 'Total Applications', value: teamTotalApps,         icon: Briefcase, color: 'indigo' },
          { label: 'Offers Received',    value: teamTotalOffers,       icon: Target,    color: 'green'  },
          { label: 'Team Offer Rate',    value: `${teamOfferRate}%`,   icon: Award,     color: 'orange' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`bg-slate-800 rounded-xl p-4 border border-slate-700`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} className={`text-${color}-400`} />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
            <p className={`text-2xl font-black text-${color}-400`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Team trend + radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
          <h2 className="font-semibold text-slate-200 mb-4">Team Hours — Last 14 Days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={teamTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="h" width={28} />
              <Tooltip formatter={v => [`${v}h`, 'Hours']}
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {radarData.length > 0 && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
            <h2 className="font-semibold text-slate-200 mb-1">Top Performer vs Team Average</h2>
            <p className="text-xs text-slate-500 mb-3">Scores normalised 0–100 across all dimensions</p>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Radar name={top?.user.name} dataKey="top" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                <Radar name="Team Avg" dataKey="avg" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.10} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Apps per worker bar */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
        <h2 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Briefcase size={15} className="text-indigo-400" /> Applications & Offers per Member
        </h2>
        <ResponsiveContainer width="100%" height={Math.max(180, sorted.length * 36)}>
          <BarChart data={sorted.map(s => ({ name: s.user.name, Apps: s.totalApps, Offers: s.totalOffers }))} layout="vertical" barSize={12}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#94a3b8' }} width={72} />
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="Apps"   fill="#3b82f6" radius={[0,4,4,0]} />
            <Bar dataKey="Offers" fill="#22c55e" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-worker cards */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-semibold text-slate-200 flex items-center gap-2">
            <Users size={15} className="text-blue-400" /> Individual Performance
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Sort by:</span>
            {[['score','Score'],['hours','Hours'],['apps','Apps'],['offers','Offers']].map(([val, lbl]) => (
              <button key={val} onClick={() => setSortBy(val)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${sortBy === val ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((s, i) => (
            <TaskerCard
              key={s.user.id}
              stat={s}
              rank={i}
              expanded={!!expanded[s.user.id]}
              onToggle={() => setExpanded(p => ({ ...p, [s.user.id]: !p[s.user.id] }))}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
