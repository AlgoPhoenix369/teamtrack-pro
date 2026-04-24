import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTimer } from '../context/TimerContext'
import { applicationService } from '../services/applicationService'
import { sessionService } from '../services/sessionService'
import { announcementService } from '../services/announcementService'
import { milestoneService } from '../services/milestoneService'
import { aiInterviewService, STATUS_META, PLATFORM_COLORS } from '../services/aiInterviewService'
import { useRealtime } from '../context/RealtimeContext'
import { isAdmin, isTasker } from '../utils/roleGuard'
import { formatSeconds, formatDuration, formatDate, isOverdue } from '../utils/formatTime'
import StatsCard from '../components/ui/StatsCard'
import { SkeletonCard } from '../components/ui/Skeleton'
import { StatusBadge, PriorityBadge } from '../components/ui/Badge'
import { useNavigate } from 'react-router-dom'
import { db } from '../services/mockDb'
import {
  Clock, Briefcase, AlertCircle, Play, TrendingUp, CalendarClock,
  Megaphone, Users, StickyNote, Pin, Bot, ExternalLink, Flag, ShieldAlert,
} from 'lucide-react'

const PRIORITY_BAR = {
  normal:    'bg-gray-300 dark:bg-slate-600',
  important: 'bg-blue-500',
  urgent:    'bg-red-500',
}

function AnnouncementSnippet({ item, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 text-left transition-colors">
      <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${PRIORITY_BAR[item.priority] || 'bg-gray-300'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {item.pinned && <Pin size={10} className="text-blue-500 flex-shrink-0" />}
          <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">{item.title}</p>
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">{item.body}</p>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{formatDate(item.created_at)}</p>
      </div>
    </button>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { session, elapsed, isRunning, startSession } = useTimer()
  const { tick } = useRealtime()
  const [apps, setApps] = useState([])
  const [sessions, setSessions] = useState([])
  const [followUps, setFollowUps] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [activeSessions, setActiveSessions] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [upcomingAI, setUpcomingAI] = useState([])
  const [assignedMilestones, setAssignedMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        // Load milestones for taskers — admin-assigned ones that aren't done
        if (isTasker(user)) {
          const ms = await milestoneService.getAll(user)
          const adminAssigned = (ms || []).filter(m =>
            m.created_by !== user.id && m.status !== 'done'
          )
          setAssignedMilestones(adminAssigned)
        }

        const [a, s, f, anns, ai] = await Promise.all([
          isAdmin(user)
            ? applicationService.getAllApplications()
            : applicationService.getApplicationsByUser(user.id),
          isAdmin(user)
            ? sessionService.getAllSessions()
            : sessionService.getSessionsByUser(user.id),
          applicationService.getFollowUpsDue(user.id),
          announcementService.getAll(),
          aiInterviewService.getByUser(user.id),
        ])
        setApps(a || [])
        setSessions(s || [])
        setFollowUps(f || [])
        setAnnouncements(anns.slice(0, 3))
        const upcoming = (ai || [])
          .filter(x => x.status === 'scheduled' || x.status === 'in_progress')
          .sort((a, b) => (a.scheduled_at || '').localeCompare(b.scheduled_at || ''))
          .slice(0, 4)
        setUpcomingAI(upcoming)

        // Team status: all users + any active/paused sessions today
        const users  = db.getUsers()
        const today  = new Date().toISOString().split('T')[0]
        const allSessions = db.getSessions({})
        const todayActive = allSessions.filter(
          x => x.date === today && (x.status === 'active' || x.status === 'paused')
        )
        setAllUsers(users)
        setActiveSessions(todayActive)
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [user, tick])

  const todayStr  = new Date().toISOString().split('T')[0]
  const todaySecs = sessions.filter(s => s.date === todayStr).reduce((a, s) => a + (s.total_seconds || 0), 0)
  const recentApps = apps.slice(0, 5)
  const overdueApps = apps.filter(a => isOverdue(a.follow_up_date) && !['Rejected','Withdrawn','Offer'].includes(a.status))
  const unreadAnns  = announcements.filter(a => !a.reads?.includes(user.id)).length

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Build team status map
  const statusOf = u => {
    const s = activeSessions.find(x => x.user_id === u.id)
    if (!s) return null
    return s.status === 'active' ? 'working' : 'paused'
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {greeting}, {user?.name} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Here's your overview for today.</p>
      </div>

      {/* Milestone priority blocker — taskers only */}
      {isTasker(user) && assignedMilestones.length > 0 && (
        <div className={`rounded-2xl border p-4 ${
          assignedMilestones.some(m => m.status === 'pending' || m.status === 'in_progress')
            ? 'bg-amber-950/40 border-amber-500/50'
            : 'bg-slate-800 border-slate-700'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <ShieldAlert size={18} className="text-amber-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-300 text-sm">Clear Your Milestones First</p>
                <p className="text-xs text-amber-500/80">
                  {assignedMilestones.length} milestone{assignedMilestones.length !== 1 ? 's' : ''} assigned by admin — complete before starting other work
                </p>
              </div>
            </div>
            <button onClick={() => navigate('/milestones')}
              className="text-xs text-amber-400 hover:underline flex-shrink-0">
              View all →
            </button>
          </div>
          <div className="space-y-2">
            {assignedMilestones.slice(0, 4).map(m => (
              <div key={m.id} className="flex items-center gap-3 bg-black/20 rounded-xl px-3 py-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  m.priority === 'critical' ? 'bg-red-500' :
                  m.priority === 'high'     ? 'bg-amber-400' :
                  m.priority === 'medium'   ? 'bg-blue-400' : 'bg-slate-500'
                }`} />
                <p className="text-sm text-slate-200 flex-1 truncate">{m.title}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${
                  m.status === 'submitted'   ? 'bg-amber-900/60 text-amber-300' :
                  m.status === 'in_progress' ? 'bg-blue-900/60 text-blue-300' :
                  'bg-slate-700 text-slate-400'
                }`}>
                  {m.status === 'submitted' ? 'Awaiting Approval' :
                   m.status === 'in_progress' ? 'In Progress' : 'Pending'}
                </span>
              </div>
            ))}
            {assignedMilestones.length > 4 && (
              <p className="text-xs text-slate-500 text-center pt-1">
                +{assignedMilestones.length - 4} more — <button onClick={() => navigate('/milestones')} className="text-amber-400 hover:underline">view all</button>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Active session banner */}
      {session ? (
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-2xl p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
            <div>
              <p className="font-semibold">Session in progress</p>
              <p className="text-blue-200 text-sm">{isRunning ? 'Running' : 'Paused'}</p>
            </div>
          </div>
          <div className="font-mono text-3xl font-black tracking-widest">{formatSeconds(elapsed)}</div>
          <button onClick={() => navigate('/time-tracker')}
            className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-xl transition-colors">
            Manage Session
          </button>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-slate-800 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-600 dark:text-slate-300">No active session</p>
            <p className="text-sm text-gray-400 dark:text-slate-500">Start tracking your work time</p>
          </div>
          <button onClick={startSession}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            <Play size={15} /> Start Session
          </button>
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Today's Hours"   value={formatDuration(todaySecs)}                                                   icon={Clock}        color="blue"   />
          <StatsCard title="Applications"    value={apps.length}                                                                 icon={Briefcase}    color="purple" />
          <StatsCard title="Active Pipeline" value={apps.filter(a => !['Rejected','Withdrawn','Offer'].includes(a.status)).length} icon={TrendingUp}  color="green"  />
          <StatsCard title="Follow-ups Due"  value={followUps.length}                                                            icon={CalendarClock} color={followUps.length > 0 ? 'orange' : 'green'} />
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left column — 2 wide */}
        <div className="lg:col-span-2 space-y-5">

          {/* Recent Applications */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800 dark:text-slate-200">Recent Applications</h2>
              <button onClick={() => navigate('/applications')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View all</button>
            </div>
            {loading ? <SkeletonCard /> : recentApps.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-6">No applications yet.</p>
            ) : (
              <div className="space-y-2">
                {recentApps.map(app => (
                  <div key={app.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                    onClick={() => navigate('/applications')}>
                    <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 dark:text-blue-400 font-bold text-xs">{app.company_name?.[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">{app.company_name}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{app.job_title}</p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Follow-up reminders */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-2">
                <AlertCircle size={16} className={overdueApps.length > 0 ? 'text-red-500' : 'text-gray-400'} />
                Follow-up Reminders
              </h2>
              <button onClick={() => navigate('/applications')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View all</button>
            </div>
            {loading ? <SkeletonCard /> : overdueApps.length === 0 ? (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium text-center py-4">✓ All follow-ups are up to date!</p>
            ) : (
              <div className="space-y-2">
                {overdueApps.slice(0, 5).map(app => (
                  <div key={app.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                    <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">{app.company_name}</p>
                      <p className="text-xs text-red-500 dark:text-red-400">Due: {formatDate(app.follow_up_date)}</p>
                    </div>
                    <PriorityBadge priority={app.priority} />
                  </div>
                ))}
              </div>
            )}
            {followUps.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-50 dark:border-slate-700">
                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mb-2">Due This Week</p>
                {followUps.slice(0, 3).map(app => (
                  <div key={app.id} className="flex items-center gap-2 py-1 text-sm">
                    <CalendarClock size={12} className="text-orange-500" />
                    <span className="text-gray-700 dark:text-slate-300 truncate">{app.company_name}</span>
                    <span className="text-xs text-gray-400 dark:text-slate-500 ml-auto">{formatDate(app.follow_up_date)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming AI Interviews */}
          {upcomingAI.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-2">
                  <Bot size={15} className="text-teal-500" />
                  Upcoming AI Interviews
                </h2>
                <button onClick={() => navigate('/ai-interviews')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View all</button>
              </div>
              <div className="space-y-2">
                {upcomingAI.map(x => {
                  const meta   = STATUS_META[x.status] || STATUS_META.scheduled
                  const pColor = PLATFORM_COLORS[x.platform] || '#6B7280'
                  return (
                    <div key={x.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30">
                      <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: pColor }}>
                        {x.platform}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 dark:text-slate-200 truncate">
                          {x.scheduled_at ? new Date(x.scheduled_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${meta.color}`}>{meta.label}</span>
                      {x.link && (
                        <a href={x.link} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 flex-shrink-0">
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Team Status */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-2">
                <Users size={15} className="text-green-500" />
                Team Today
              </h2>
              <span className="text-xs text-gray-400 dark:text-slate-500">
                {activeSessions.length} active
              </span>
            </div>
            <div className="space-y-2">
              {allUsers.map(u => {
                const status = statusOf(u)
                return (
                  <div key={u.id} className="flex items-center gap-2.5">
                    <div className="relative flex-shrink-0">
                      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{u.name[0]}</span>
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800
                        ${status === 'working' ? 'bg-green-500' :
                          status === 'paused'  ? 'bg-yellow-400' :
                          'bg-gray-300 dark:bg-slate-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 dark:text-slate-200 truncate">{u.name}</p>
                    </div>
                    <span className={`text-xs font-medium flex-shrink-0
                      ${status === 'working' ? 'text-green-600 dark:text-green-400' :
                        status === 'paused'  ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-gray-400 dark:text-slate-500'}`}>
                      {status === 'working' ? 'Working' : status === 'paused' ? 'Paused' : 'Offline'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Latest Announcements */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-2">
                <Megaphone size={15} className="text-indigo-500" />
                Announcements
                {unreadAnns > 0 && (
                  <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full font-bold">{unreadAnns}</span>
                )}
              </h2>
              <button onClick={() => navigate('/announcements')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View all</button>
            </div>
            {loading ? <SkeletonCard /> : announcements.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">No announcements yet.</p>
            ) : (
              <div className="space-y-1 -mx-1">
                {announcements.map(a => (
                  <AnnouncementSnippet key={a.id} item={a} onClick={() => navigate('/announcements')} />
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-800 dark:text-slate-200 mb-3">Quick Links</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: StickyNote, label: 'Notepad',      to: '/notepad',       color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' },
                { icon: Clock,      label: 'Time Tracker', to: '/time-tracker',  color: 'text-blue-600   dark:text-blue-400   bg-blue-50   dark:bg-blue-900/20'   },
                { icon: Briefcase,  label: 'Applications', to: '/applications',  color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' },
                { icon: Megaphone,  label: 'Announcements',to: '/announcements', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' },
              ].map(({ icon: Icon, label, to, color }) => (
                <button key={to} onClick={() => navigate(to)}
                  className="flex items-center gap-2 p-3 rounded-xl hover:opacity-80 transition-opacity text-left"
                  style={{}}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon size={15} />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-slate-300">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
