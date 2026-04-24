import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { supabase } from '../services/supabase'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'
import { Sun, Moon, User, Lock } from 'lucide-react'
import { isTasker } from '../utils/roleGuard'

export default function Settings() {
  const { user } = useAuth()
  const { darkMode, toggleDarkMode } = useApp()
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [savingPin, setSavingPin] = useState(false)
  const [pw, setPw] = useState({ current: '', new: '', confirm: '' })
  const [savingPw, setSavingPw] = useState(false)

  const handlePinChange = async (e) => {
    e.preventDefault()
    if (pin !== confirmPin) return toast.error('PINs do not match')
    if (pin.length < 4) return toast.error('PIN must be at least 4 characters')
    setSavingPin(true)
    try {
      const { error } = await supabase.from('users').update({ pin_hash: pin }).eq('id', user.id)
      if (error) throw error
      toast.success('PIN updated!')
      setPin(''); setConfirmPin('')
    } catch { toast.error('Failed to update PIN') }
    finally { setSavingPin(false) }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (pw.new !== pw.confirm) return toast.error('Passwords do not match')
    setSavingPw(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pw.new })
      if (error) throw error
      toast.success('Password updated!')
      setPw({ current: '', new: '', confirm: '' })
    } catch { toast.error('Failed to update password') }
    finally { setSavingPw(false) }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account preferences</p>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <User size={16} /> Profile
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-700 rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-lg">{user?.name}</p>
            <p className="text-sm text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
            {user?.email && <p className="text-xs text-gray-400">{user.email}</p>}
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          {darkMode ? <Moon size={16} /> : <Sun size={16} />} Appearance
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Dark Mode</p>
            <p className="text-xs text-gray-400">Toggle between light and dark theme</p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`w-12 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-blue-700' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? 'translate-x-6' : ''}`} />
          </button>
        </div>
      </div>

      {/* Change PIN (taskers) */}
      {isTasker(user) && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Lock size={16} /> Change PIN
          </h2>
          <form onSubmit={handlePinChange} className="space-y-3 max-w-xs">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">New PIN</label>
              <input type="password" value={pin} onChange={e => setPin(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="Min 4 digits" maxLength={8} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Confirm PIN</label>
              <input type="password" value={confirmPin} onChange={e => setConfirmPin(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="Repeat PIN" maxLength={8} />
            </div>
            <Button type="submit" size="sm" loading={savingPin}>Update PIN</Button>
          </form>
        </div>
      )}

      {/* Change Password (admins) */}
      {!isTasker(user) && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Lock size={16} /> Change Password
          </h2>
          <form onSubmit={handlePasswordChange} className="space-y-3 max-w-xs">
            {[['New Password', 'new'], ['Confirm Password', 'confirm']].map(([label, key]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input type="password" value={pw[key]} onChange={e => setPw(p => ({...p,[key]:e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••" />
              </div>
            ))}
            <Button type="submit" size="sm" loading={savingPw}>Update Password</Button>
          </form>
        </div>
      )}
    </div>
  )
}
