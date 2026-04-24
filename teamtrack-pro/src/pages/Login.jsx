import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [mode, setMode] = useState('tasker')
  const [taskerNames, setTaskerNames] = useState([])
  const [namesLoading, setNamesLoading] = useState(true)
  const [selectedName, setSelectedName] = useState('')
  const [pin, setPin] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { adminLogin, taskerLogin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    authService.getTaskerNames()
      .then(names => setTaskerNames(names))
      .catch(() => setTaskerNames([]))
      .finally(() => setNamesLoading(false))
  }, [])

  const handleTaskerLogin = async (e) => {
    e.preventDefault()
    if (!selectedName || !pin) return toast.error('Select your name and enter PIN')
    setLoading(true)
    try {
      await taskerLogin(selectedName, pin)
      navigate('/dashboard')
      toast.success(`Welcome, ${selectedName}!`)
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Enter email and password')
    setLoading(true)
    try {
      await adminLogin(email, password)
      navigate('/dashboard')
      toast.success('Welcome back!')
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-blue-600 rounded-2xl items-center justify-center mb-3">
            <span className="text-white font-black text-xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-white">TeamTrack Pro</h1>
          <p className="text-blue-300 text-sm mt-1">Task & Job Application Tracker</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setMode('tasker')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'tasker' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Team Member
            </button>
            <button
              onClick={() => setMode('admin')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'admin' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Admin
            </button>
          </div>

          {mode === 'tasker' ? (
            <form onSubmit={handleTaskerLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Your Name</label>
                {namesLoading ? (
                  <div className="grid grid-cols-3 gap-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />
                    ))}
                  </div>
                ) : taskerNames.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No team members found</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {taskerNames.map(name => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setSelectedName(name)}
                        className={`py-2.5 text-sm font-medium rounded-lg border transition-all ${
                          selectedName === name
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">PIN</label>
                <input
                  type="password"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center tracking-[0.5em] text-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="• • • •"
                  maxLength={8}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Sign In
              </Button>
            </form>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin@teamtrack.pro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Sign In as Admin
              </Button>

              <p className="text-xs text-center text-gray-400">
                Admin accounts: vincent@teamtrack.pro · judy@teamtrack.pro · harveel@teamtrack.pro
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
