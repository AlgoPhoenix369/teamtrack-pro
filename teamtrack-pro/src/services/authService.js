import { supabase } from './supabase'
import { db } from './mockDb'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const authService = {
  async adminLogin(email, password) {
    if (USE_MOCK) {
      const user = db.getUserByEmail(email)
      if (!user) throw new Error('User not found')
      if (!['super_admin', 'view_admin'].includes(user.role)) throw new Error('Not an admin account')
      if (!password) throw new Error('Password required')
      return { user }
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  async taskerLogin(name, pin) {
    if (USE_MOCK) {
      const user = db.getUserByName(name)
      if (!user || !user.is_active) throw new Error('User not found')
      if (user.role !== 'tasker') throw new Error('Not a tasker account')
      if (user.pin_hash !== pin) throw new Error('Invalid PIN')
      return user
    }
    const { data, error } = await supabase.rpc('tasker_login', { p_name: name, p_pin: pin })
    if (error) throw error
    if (!data || data.length === 0) throw new Error('Invalid name or PIN')
    const user = data[0]
    // Establish a Supabase Auth session so RLS policies work for this tasker.
    // Requires a matching Auth account (email + PIN as password) created in Supabase dashboard.
    if (user.email) {
      await supabase.auth.signInWithPassword({ email: user.email, password: pin })
        .catch(() => {}) // graceful degradation if Auth account doesn't exist yet
    }
    return user
  },

  async getTaskerNames() {
    if (USE_MOCK) {
      return db.getUsers()
        .filter(u => u.role === 'tasker' && u.is_active)
        .map(u => u.name)
        .sort()
    }
    const { data, error } = await supabase.rpc('get_active_taskers')
    if (error) throw error
    return (data || []).map(u => u.name)
  },

  async logout() {
    if (!USE_MOCK) await supabase.auth.signOut()
    localStorage.removeItem('tasker_user')
    localStorage.removeItem('timer_state')
  },

  async getSession() {
    if (USE_MOCK) return null
    const { data } = await supabase.auth.getSession()
    return data.session
  },

  async getUserByEmail(email) {
    if (USE_MOCK) {
      const user = db.getUserByEmail(email)
      if (!user) throw new Error('User not found')
      return user
    }
    const { data, error } = await supabase
      .from('users').select('*, teams!team_id(name)').eq('email', email).single()
    if (error) throw error
    return data
  },
}
