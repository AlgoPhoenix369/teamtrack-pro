import { useState, useEffect } from 'react'
import { useRealtime } from '../context/RealtimeContext'
import { adminService } from '../services/adminService'
import { sessionService } from '../services/sessionService'
import { applicationService } from '../services/applicationService'
import { aiInterviewService } from '../services/aiInterviewService'
import { formatDate } from '../utils/formatTime'
import { TZ_KENYA, todayInTz, tzLabel, fmtTimeInTz } from '../utils/timezone'
import { SkeletonCard } from '../components/ui/Skeleton'
import {
  Trophy, Clock, Briefcase, Zap, Target, TrendingUp, Medal,
  Play, Pause, Square, Star, Users, Bot, Flame, Crown, Swords,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// ── helpers ───────────────────────────────────────────────────────────
const todayStr  = () => todayInTz(TZ_KENYA)
const EAT_LABEL = tzLabel(TZ_KENYA)

const fmtSecs = s => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
const fmtTime = iso => fmtTimeInTz(iso, TZ_KENYA)

function weekRangeKE() {
  const today = todayInTz(TZ_KENYA)
  const [y, m, d] = today.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const day = date.getDay()
  const diffToMon = day === 0 ? -6 : 1 - day
  const mon = new Date(date); mon.setDate(date.getDate() + diffToMon)
  const sun = new Date(mon);  sun.setDate(mon.getDate() + 6)
  const fmt = dt => [dt.getFullYear(), String(dt.getMonth() + 1).padStart(2, '0'), String(dt.getDate()).padStart(2, '0')].join('-')
  return { start: fmt(mon), end: fmt(sun) }
}

// Red timezone pill
function TzBadge({ tz = TZ_KENYA }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 leading-none">
      {tzLabel(tz)}
    </span>
  )
}

const EQUAL_SCORE = 100

const TABS = [
  { id: 'today',         label: "Today's Log",     icon: Star,      color: 'amber'  },
  { id: 'hours',         label: 'Hours Logged',     icon: Clock,     color: 'blue',   unit: 'hrs'        },
  { id: 'sessions',      label: 'Sessions',          icon: Zap,       color: 'purple', unit: 'sessions'   },
  { id: 'applications',  label: 'Applications',      icon: Briefcase, color: 'indigo', unit: 'apps'       },
  { id: 'offers',        label: 'Offers',            icon: Target,    color: 'green',  unit: 'offers'     },
  { id: 'entries',       label: 'Activity Entries',  icon: TrendingUp,color: 'orange', unit: 'entries'    },
  { id: 'ai_interviews', label: 'AI Interviews',     icon: Bot,       color: 'teal',   unit: 'interviews' },
]

const EVENT_META = {
  start:  { icon: Play,   label: 'Started',  color: 'text-green-400', dot: 'bg-green-500'  },
  pause:  { icon: Pause,  label: 'Paused',   color: 'text-amber-400', dot: 'bg-amber-400'  },
  resume: { icon: Play,   label: 'Resumed',  color: 'text-blue-400',  dot: 'bg-blue-500'   },
  stop:   { icon: Square, label: 'Stopped',  color: 'text-red-400',   dot: 'bg-red-500'    },
}

const ROLE_COLOR = {
  super_admin: 'bg-purple-600',
  view_admin:  'bg-blue-600',
  tasker:      'bg-slate-500',
}

// ── Motivational label ────────────────────────────────────────────────
function motivLabel(rank, hasActivity) {
  if (!hasActivity) return { text: '👋 Start your session!', cls: 'text-slate-500' }
  if (rank === 0)   return { text: '🔥 Leading the team!',   cls: 'text-amber-400 font-semibold' }
  if (rank <= 2)    return { text: '💪 Close to the top!',   cls: 'text-blue-400'  }
  return              { text: '⚡ Keep pushing!',             cls: 'text-slate-400' }
}

// ── Today card ────────────────────────────────────────────────────────
function TodayUserCard({ stat, rank, maxSecs }) {
  const [expanded, setExpanded] = useState(false)
  const hasActivity = stat.todaySecs > 0 || stat.todaySessions > 0
  const progress    = maxSecs > 0 ? Math.round((stat.todaySecs / maxSecs) * 100) : 0
  const gapSecs     = maxSecs - stat.todaySecs
  const motiv       = motivLabel(rank, hasActivity)

  return (
    <div className={`bg-slate-800 rounded-2xl border overflow-hidden transition-all
      ${rank === 0 && hasActivity
        ? 'border-amber-500/50 shadow-lg shadow-amber-500/10'
        : hasActivity
          ? 'border-slate-700'
          : 'border-dashed border-slate-700 opacity-60'}`}>

      {/* Top accent bar */}
      {hasActivity && (
        <div className={`h-1 ${rank === 0
          ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-red-500'
          : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500'}`} />
      )}

      <div className="p-4">
        {/* User row */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0
            ${rank === 0 && hasActivity ? 'ring-2 ring-amber-400' : ''} ${ROLE_COLOR[stat.user.role] || 'bg-slate-500'}`}>
            {rank === 0 && hasActivity
              ? <span className="text-sm font-black">{stat.user.name[0]}</span>
              : stat.user.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-semibold text-slate-100 text-sm truncate">{stat.user.name}</p>
              {rank === 0 && hasActivity && <Flame size={12} className="text-amber-400 flex-shrink-0" />}
            </div>
            <p className="text-xs text-slate-500 capitalize">{stat.user.role?.replace('_', ' ')}</p>
          </div>
          <div className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold
            ${hasActivity
              ? rank === 0
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow shadow-amber-500/30'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
              : 'bg-slate-700 text-slate-500'}`}>
            {hasActivity ? `${EQUAL_SCORE} pts` : 'Inactive'}
          </div>
        </div>

        {/* Progress bar */}
        {hasActivity && maxSecs > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{fmtSecs(stat.todaySecs)}</span>
              {rank === 0
                ? <span className="text-amber-400 font-medium">👑 Top today</span>
                : <span>{fmtSecs(gapSecs)} behind leader</span>}
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${rank === 0
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                style={{ width: `${Math.max(progress, 4)}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-slate-700/50 rounded-xl p-2 text-center">
            <p className="text-xs text-slate-500">Time</p>
            <p className="font-bold text-sm text-slate-200">{stat.todaySecs > 0 ? fmtSecs(stat.todaySecs) : '—'}</p>
          </div>
          <div className="bg-slate-700/50 rounded-xl p-2 text-center">
            <p className="text-xs text-slate-500">Sessions</p>
            <p className="font-bold text-sm text-slate-200">{stat.todaySessions}</p>
          </div>
          <div className="bg-slate-700/50 rounded-xl p-2 text-center">
            <p className="text-xs text-slate-500">Start <TzBadge /></p>
            <p className="font-bold text-sm text-slate-200">
              {stat.todayStart ? fmtTime(stat.todayStart) : '—'}
            </p>
          </div>
        </div>

        {/* Motivational hint */}
        <p className={`text-xs mt-2 ${motiv.cls}`}>{motiv.text}</p>

        {/* Event log toggle */}
        {stat.todayEvents.length > 0 && (
          <button onClick={() => setExpanded(v => !v)}
            className="w-full mt-2 text-xs text-blue-400 hover:underline font-medium text-left">
            {expanded ? '▲ Hide log' : `▼ Show session log (${stat.todayEvents.length} events)`}
          </button>
        )}

        {expanded && stat.todayEvents.length > 0 && (
          <div className="mt-3 space-y-1.5 pl-2 border-l-2 border-slate-700">
            {stat.todayEvents.map((ev, i) => {
              const meta = EVENT_META[ev.type] || EVENT_META.start
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 -ml-[5px] ${meta.dot}`} />
                  <span className={`font-semibold ${meta.color}`}>{meta.label}</span>
                  <span className="text-slate-400">{fmtTime(ev.at)}</span>
                  <TzBadge />
                  {ev.elapsed > 0 && (
                    <span className="text-slate-500 ml-auto">{fmtSecs(ev.elapsed)}</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tasker of Day / Week hero ─────────────────────────────────────────
function TaskerHero({ label, icon: Icon, gradient, ringColor, glowColor, stat, metricLabel, metricValue, tz }) {
  if (!stat) return (
    <div className={`flex-1 rounded-2xl border border-dashed border-slate-700 p-5 flex items-center justify-center min-h-[120px]`}>
      <p className="text-sm text-slate-500">No activity yet</p>
    </div>
  )
  return (
    <div className={`flex-1 relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 shadow-lg ${glowColor}`}>
      {/* Background shimmer */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />

      <div className="relative flex items-center gap-4">
        {/* Crown/flame icon */}
        <div className="flex-shrink-0">
          <div className={`w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center ring-2 ${ringColor} shadow-lg`}>
            <span className="text-2xl font-black text-white">{stat.user.name[0]}</span>
          </div>
          <div className="flex justify-center -mt-2">
            <Icon size={18} className="text-white drop-shadow" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white/70 uppercase tracking-widest">{label}</span>
          </div>
          <p className="text-lg font-black text-white truncate mt-0.5">{stat.user.name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-2xl font-black text-white">{metricValue}</span>
            <span className="text-sm text-white/70">{metricLabel}</span>
            <TzBadge tz={tz} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Podium ────────────────────────────────────────────────────────────
const RANK_STYLES = [
  { bg: 'from-yellow-400 to-amber-500',  text: 'text-amber-900',  icon: '🥇', ring: 'ring-amber-400' },
  { bg: 'from-slate-400 to-slate-500',   text: 'text-slate-900',  icon: '🥈', ring: 'ring-slate-400' },
  { bg: 'from-orange-400 to-orange-500', text: 'text-orange-900', icon: '🥉', ring: 'ring-orange-400' },
]

function PodiumCard({ user, rank, value, unit }) {
  const style = RANK_STYLES[rank] || RANK_STYLES[2]
  const isFirst = rank === 0
  return (
    <div className={`flex flex-col items-center ${isFirst ? 'order-first sm:order-none' : ''}`}>
      <div className={`relative ${isFirst ? 'mb-2' : 'mt-6'}`}>
        <div className={`rounded-full bg-gradient-to-br ${style.bg} ring-4 ${style.ring} flex items-center justify-center shadow-lg`}
          style={{ width: isFirst ? 64 : 56, height: isFirst ? 64 : 56 }}>
          <span className="font-black text-white text-lg">{user.name[0]}</span>
        </div>
        <span className="absolute -bottom-1 -right-1 text-xl">{style.icon}</span>
      </div>
      <p className={`font-bold mt-3 text-sm ${isFirst ? 'text-base' : ''} text-slate-200`}>{user.name}</p>
      <p className="text-xs text-slate-500 capitalize">{user.role?.replace('_', ' ')}</p>
      <div className={`mt-2 px-3 py-1 rounded-full bg-gradient-to-r ${style.bg} ${style.text} text-xs font-bold shadow`}>
        {value} {unit}
      </div>
      <div className={`mt-3 w-full rounded-t-xl bg-gradient-to-b ${style.bg} opacity-30`}
        style={{ height: isFirst ? 100 : rank === 1 ? 70 : 50 }} />
    </div>
  )
}

function RankRow({ position, user, value, unit, maxValue }) {
  const progress = maxValue > 0 ? Math.round((parseFloat(value) / maxValue) * 100) : 0
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800 transition-colors group">
      <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0
        ${position <= 3 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
        {position}
      </span>
      <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-xs font-bold">{user.name[0]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-slate-200">{user.name}</p>
        {maxValue > 0 && (
          <div className="h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
              style={{ width: `${Math.max(progress, 2)}%` }} />
          </div>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-slate-100">{value}</p>
        <p className="text-xs text-slate-500">{unit}</p>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────
export default function Leaderboard() {
  const { tick } = useRealtime()
  const [activeTab, setActiveTab] = useState('today')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState([])
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => { loadData() }, [tick])

  const loadData = async () => {
    setLoading(true)
    try {
      const [users, sessions, applications, aiInterviews] = await Promise.all([
        adminService.getAllUsers(),
        sessionService.getAllSessions(),
        applicationService.getAllApplications(),
        aiInterviewService.getAll(),
      ])

      const today = todayStr()
      const week  = weekRangeKE()

      const computed = users.map(u => {
        const userSessions  = sessions.filter(s => s.user_id === u.id && s.status === 'completed')
        const todaySessions = sessions.filter(s => s.user_id === u.id && s.date === today)
        const weekSessions  = sessions.filter(s => s.user_id === u.id && s.date >= week.start && s.date <= week.end)

        const todayEvents = todaySessions.flatMap(s => s.events || [])
          .sort((a, b) => a.at?.localeCompare(b.at))
        const startEv = todaySessions.flatMap(s => s.events || [])
          .filter(e => e.type === 'start')
          .sort((a, b) => a.at?.localeCompare(b.at))[0]

        const userApps   = applications.filter(a => a.owner_id === u.id)
        const totalEntries = userSessions.reduce((acc, s) => acc + (s.activity_entries?.length || 0), 0)

        const userAI      = aiInterviews.filter(x => x.user_id === u.id)
        const completedAI = userAI.filter(x => x.status === 'completed')
        const withScore   = completedAI.filter(x => x.score != null)
        const aiAvgScore  = withScore.length
          ? Math.round(withScore.reduce((a, x) => a + x.score, 0) / withScore.length)
          : null

        return {
          user: u,
          hours:         +(userSessions.reduce((acc, s) => acc + (s.total_seconds || 0), 0) / 3600).toFixed(1),
          sessions:      userSessions.length,
          applications:  userApps.length,
          offers:        userApps.filter(a => a.status === 'Offer').length,
          entries:       totalEntries,
          ai_interviews: completedAI.length,
          aiAvgScore,
          lastActive:    userSessions[0]?.date || null,
          todaySecs:     todaySessions.reduce((acc, s) => acc + (s.total_seconds || 0), 0),
          todaySessions: todaySessions.length,
          todayStart:    startEv?.at || todaySessions[0]?.start_time || null,
          todayEvents,
          weekSecs:      weekSessions.reduce((acc, s) => acc + (s.total_seconds || 0), 0),
        }
      })

      setStats(computed)

      const allEntries = sessions
        .filter(s => s.activity_entries?.length)
        .flatMap(s => s.activity_entries.map(e => ({
          ...e,
          userName: users.find(u => u.id === s.user_id)?.name || 'Unknown',
          sessionDate: s.date,
        })))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 20)

      setRecentActivity(allEntries)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const tab    = TABS.find(t => t.id === activeTab)
  const sorted = activeTab === 'today'
    ? [...stats].sort((a, b) => b.todaySecs - a.todaySecs)
    : [...stats].sort((a, b) => b[activeTab] - a[activeTab])

  const top3       = sorted.slice(0, 3)
  const chartData  = sorted.map(s => ({
    name:  s.user.name,
    value: activeTab === 'today' ? +(s.todaySecs / 3600).toFixed(2) : s[activeTab],
  }))
  const maxChartVal = Math.max(...chartData.map(d => d.value), 0)

  const taskerOfDay  = [...stats].sort((a, b) => b.todaySecs  - a.todaySecs)[0]
  const taskerOfWeek = [...stats].sort((a, b) => b.weekSecs   - a.weekSecs)[0]

  const maxTodaySecs = Math.max(...stats.map(s => s.todaySecs), 0)
  const activeToday  = stats.filter(s => s.todaySecs > 0 || s.todaySessions > 0).length
  const teamTodaySecs = stats.reduce((a, s) => a + s.todaySecs, 0)

  const typeColors = {
    'Annotation Task': '#3b82f6', 'Software Task': '#a855f7',
    'Review': '#f97316', 'Communication': '#22c55e',
    'Research': '#06b6d4', 'Other': '#94a3b8',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Trophy size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Leaderboard</h1>
            <p className="text-sm text-slate-500 flex items-center gap-1.5">
              Team performance · all times in <TzBadge />
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
          <div className={`w-2 h-2 rounded-full ${activeToday > 0 ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
          <span><span className="text-slate-300 font-semibold">{activeToday}</span> of {stats.length} active today</span>
          <span className="text-slate-600">·</span>
          <span>Team: <span className="text-blue-400 font-semibold">{fmtSecs(teamTodaySecs)}</span> today</span>
        </div>
      </div>

      {/* ── Tasker of Day / Week ─────────────────────────────────── */}
      {!loading && (
        <div className="flex flex-col sm:flex-row gap-4">
          <TaskerHero
            label="Tasker of the Day"
            icon={Flame}
            gradient="from-amber-600 via-orange-600 to-red-700"
            ringColor="ring-amber-300/50"
            glowColor="shadow-xl shadow-amber-500/20"
            stat={taskerOfDay?.todaySecs > 0 ? taskerOfDay : null}
            metricValue={taskerOfDay?.todaySecs > 0 ? fmtSecs(taskerOfDay.todaySecs) : null}
            metricLabel="today"
            tz={TZ_KENYA}
          />
          <TaskerHero
            label="Tasker of the Week"
            icon={Crown}
            gradient="from-violet-700 via-purple-700 to-indigo-800"
            ringColor="ring-purple-300/50"
            glowColor="shadow-xl shadow-purple-500/20"
            stat={taskerOfWeek?.weekSecs > 0 ? taskerOfWeek : null}
            metricValue={taskerOfWeek?.weekSecs > 0 ? fmtSecs(taskerOfWeek.weekSecs) : null}
            metricLabel="this week"
            tz={TZ_KENYA}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border
              ${activeTab === t.id
                ? 'bg-blue-700 text-white border-blue-600 shadow-md shadow-blue-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-blue-500/50 hover:text-slate-200'}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          {/* ── TODAY TAB ──────────────────────────────────────────── */}
          {activeTab === 'today' && (
            <>
              {/* Team banner */}
              <div className="flex items-center gap-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white rounded-2xl px-5 py-4 shadow-md shadow-blue-500/20">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Swords size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">Team Participation — Equal Scores</p>
                  <p className="text-blue-200 text-xs mt-0.5 flex items-center gap-1.5">
                    Every active member earns {EQUAL_SCORE} pts today · {activeToday} of {stats.length} members active
                    · <TzBadge />
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-3xl font-black">{EQUAL_SCORE}</p>
                  <p className="text-blue-200 text-xs">pts each</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sorted.map((s, i) => (
                  <TodayUserCard key={s.user.id} stat={s} rank={i} maxSecs={maxTodaySecs} />
                ))}
              </div>
            </>
          )}

          {/* ── METRIC TABS ────────────────────────────────────────── */}
          {activeTab !== 'today' && (
            <>
              {top3.length > 0 && (
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                  <h2 className="font-semibold text-slate-400 mb-6 text-center flex items-center justify-center gap-2">
                    <Medal size={16} className="text-amber-500" /> Top 3 — {tab?.label}
                  </h2>
                  <div className="flex justify-center items-end gap-6">
                    {top3[1] && <PodiumCard user={top3[1].user} rank={1}
                      value={activeTab === 'ai_interviews' ? `${top3[1].ai_interviews} (avg ${top3[1].aiAvgScore ?? '—'})` : top3[1][activeTab]}
                      unit={activeTab === 'ai_interviews' ? '' : tab?.unit} />}
                    <PodiumCard user={top3[0].user} rank={0}
                      value={activeTab === 'ai_interviews' ? `${top3[0].ai_interviews} (avg ${top3[0].aiAvgScore ?? '—'})` : top3[0][activeTab]}
                      unit={activeTab === 'ai_interviews' ? '' : tab?.unit} />
                    {top3[2] && <PodiumCard user={top3[2].user} rank={2}
                      value={activeTab === 'ai_interviews' ? `${top3[2].ai_interviews} (avg ${top3[2].aiAvgScore ?? '—'})` : top3[2][activeTab]}
                      unit={activeTab === 'ai_interviews' ? '' : tab?.unit} />}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
                  <h2 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    Full Rankings — {tab?.label}
                  </h2>
                  <div className="space-y-1">
                    {sorted.map((s, i) => (
                      <RankRow key={s.user.id} position={i + 1} user={s.user}
                        value={activeTab === 'ai_interviews'
                          ? `${s.ai_interviews} interviews${s.aiAvgScore != null ? ` · avg ${s.aiAvgScore}` : ''}`
                          : s[activeTab]}
                        unit={activeTab === 'ai_interviews' ? '' : tab?.unit}
                        maxValue={maxChartVal} />
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
                  <h2 className="font-semibold text-slate-200 mb-4">{tab?.label} Comparison</h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData} layout="vertical" barSize={18}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#64748b' }} width={64} />
                      <Tooltip
                        formatter={v => [`${v} ${tab?.unit}`, tab?.label]}
                        contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#1E40AF" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Summary table */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                  <h2 className="font-semibold text-slate-200">All-Time Summary</h2>
                  <TzBadge />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-800 border-b border-slate-700">
                        {['Member','Team','Hours','Sessions','Apps','Offers','Entries','AI Interviews','Avg Score','Last Active'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {sorted.map((s, i) => (
                        <tr key={s.user.id} className="hover:bg-slate-800/60 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-600 w-4">{i + 1}</span>
                              <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-bold">{s.user.name[0]}</span>
                              </div>
                              <span className="font-medium text-slate-200">{s.user.name}</span>
                              {i === 0 && <Flame size={12} className="text-amber-400" />}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{s.user.teams?.name || '—'}</td>
                          <td className="px-4 py-3 font-semibold text-blue-400">{s.hours}h</td>
                          <td className="px-4 py-3 text-slate-300">{s.sessions}</td>
                          <td className="px-4 py-3 text-slate-300">{s.applications}</td>
                          <td className="px-4 py-3">
                            {s.offers > 0
                              ? <span className="px-2 py-0.5 bg-green-900/40 text-green-400 rounded-full text-xs font-medium">{s.offers}</span>
                              : <span className="text-slate-600">—</span>}
                          </td>
                          <td className="px-4 py-3 text-slate-300">{s.entries}</td>
                          <td className="px-4 py-3">
                            {s.ai_interviews > 0
                              ? <span className="px-2 py-0.5 bg-teal-900/40 text-teal-400 rounded-full text-xs font-medium">{s.ai_interviews}</span>
                              : <span className="text-slate-600">—</span>}
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs">
                            {s.aiAvgScore != null ? `${s.aiAvgScore}/100` : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {s.lastActive ? formatDate(s.lastActive) : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Live activity feed */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
            <h2 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Zap size={16} className="text-orange-500" /> Live Activity Feed
            </h2>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No activity entries logged yet.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentActivity.map(entry => (
                  <div key={entry.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">{entry.userName[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-200">{entry.userName}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: (typeColors[entry.entry_type] || '#94a3b8') + '22', color: typeColors[entry.entry_type] || '#94a3b8' }}>
                          {entry.entry_type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-0.5 truncate">{entry.title}</p>
                      {entry.notes && <p className="text-xs text-slate-500 truncate">{entry.notes}</p>}
                    </div>
                    <span className="text-xs text-slate-500 flex-shrink-0 mt-0.5">{formatDate(entry.sessionDate)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
