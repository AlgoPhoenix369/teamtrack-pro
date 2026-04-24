import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Clock, Briefcase, User, Users, Settings, LogOut,
  ChevronLeft, ChevronRight, Shield, Trophy, HelpCircle, Video, MessageSquare,
  Megaphone, StickyNote, Bot, KeyRound, Flag, TrendingUp, Code2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { useOnlineUsers } from '../../hooks/useOnlineUsers'
import { isAdmin, isSuperAdmin } from '../../utils/roleGuard'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/time-tracker', icon: Clock,           label: 'Time Tracker' },
  { to: '/applications', icon: Briefcase,       label: 'Applications' },
  { to: '/leaderboard',  icon: Trophy,          label: 'Leaderboard' },
  { to: '/announcements',icon: Megaphone,       label: 'Announcements' },
  { to: '/meetings',     icon: Video,           label: 'Meetings' },
  { to: '/messages',     icon: MessageSquare,   label: 'Messages' },
  { to: '/help-desk',    icon: HelpCircle,      label: 'Help Desk' },
  { to: '/notepad',      icon: StickyNote,      label: 'Notepad' },
  { to: '/ai-interviews',   icon: Bot,      label: 'AI Interviews' },
  { to: '/saved-accounts',  icon: KeyRound, label: 'Account Vault' },
  { to: '/milestones',      icon: Flag,     label: 'Milestones' },
  { to: '/skills',          icon: Code2,    label: 'Skills' },
  { to: '/analytics',      icon: TrendingUp,  label: 'Analytics',   superAdminOnly: true },
  { to: '/personas',       icon: User,        label: 'Personas',    superAdminOnly: true },
  { to: '/admin',          icon: Shield,      label: 'Admin Panel', adminOnly: true },
  { to: '/team',           icon: Users,       label: 'Team',        adminOnly: true },
  { to: '/settings',       icon: Settings,    label: 'Settings' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { sidebarCollapsed, setSidebarCollapsed } = useApp()
  const { isOnline } = useOnlineUsers()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    toast.success('Logged out')
  }

  const filtered = navItems.filter(item =>
    (!item.adminOnly      || isAdmin(user)) &&
    (!item.superAdminOnly || isSuperAdmin(user))
  )

  return (
    <aside className={`${sidebarCollapsed ? 'w-16' : 'w-60'} flex-shrink-0 bg-slate-900 flex flex-col transition-all duration-300 min-h-screen`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">T</span>
        </div>
        {!sidebarCollapsed && (
          <span className="text-white font-bold text-sm tracking-wide">TeamTrack Pro</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
        {filtered.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm
              ${isActive
                ? 'bg-blue-700 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
            title={sidebarCollapsed ? label : ''}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!sidebarCollapsed && <span className="font-medium">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + collapse */}
      <div className="border-t border-slate-800 p-3 space-y-1">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
            <div className="relative flex-shrink-0">
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${isOnline(user?.id) ? 'bg-green-400' : 'bg-slate-600'}`} />
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.name}</p>
              <p className="text-slate-500 text-xs capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-all w-full text-sm"
          title={sidebarCollapsed ? 'Logout' : ''}
        >
          <LogOut size={16} />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
        <button
          onClick={() => setSidebarCollapsed(p => !p)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white transition-all w-full text-sm"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!sidebarCollapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
