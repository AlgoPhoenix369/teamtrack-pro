import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { TimerProvider } from './context/TimerContext'
import { AppProvider } from './context/AppContext'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TimeTracker from './pages/TimeTracker'
import Applications from './pages/Applications'
import ApplicationShare from './pages/ApplicationShare'
import Personas from './pages/Personas'
import Admin from './pages/Admin'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Leaderboard from './pages/Leaderboard'
import HelpDesk from './pages/HelpDesk'
import Meetings from './pages/Meetings'
import Messages from './pages/Messages'
import Announcements from './pages/Announcements'
import Notepad from './pages/Notepad'
import AIInterviews from './pages/AIInterviews'
import SavedAccounts from './pages/SavedAccounts'
import Milestones from './pages/Milestones'
import Skills from './pages/Skills'
import { RealtimeProvider } from './context/RealtimeContext'
import { isAdmin } from './utils/roleGuard'

function ProtectedRoute({ adminOnly = false }) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin(user)) return <Navigate to="/dashboard" replace />

  return <Outlet />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/applications/share/:id" element={<ApplicationShare />} />

      {/* Protected layout wrapper */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="time-tracker" element={<TimeTracker />} />
          <Route path="applications" element={<Applications />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="help-desk" element={<HelpDesk />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="messages" element={<Messages />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="notepad" element={<Notepad />} />
          <Route path="ai-interviews" element={<AIInterviews />} />
          <Route path="saved-accounts" element={<SavedAccounts />} />
          <Route path="milestones" element={<Milestones />} />
          <Route path="skills" element={<Skills />} />
          <Route path="settings" element={<Settings />} />

          {/* Admin-only routes */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="personas" element={<Personas />} />
            <Route path="admin" element={<Admin />} />
            <Route path="team" element={<Admin />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <RealtimeProvider>
            <TimerProvider>
              <AppRoutes />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' },
                  success: { iconTheme: { primary: '#1E40AF', secondary: 'white' } },
                }}
              />
            </TimerProvider>
          </RealtimeProvider>
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  )
}
