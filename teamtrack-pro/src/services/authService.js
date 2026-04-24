import { supabase } from './supabase'
import { db } from './mockDb'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const authService = {
  async adminLogin(email, password) {
    if (USE_MOCK) {
      const user = db.getUserByEmail(email)
      if (!user) throw new Error('User not found')
      if (!['super_admin', 'view_admin'].includes(user.role)) throw new Error('Not an admin account')
      // Mock: any non-empty password works in dev
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
    const { data: user, error } = await supabase
      .from('users').select('*').ilike('name', name).eq('is_active', true).single()
    if (error || !user) throw new Error('User not found')
    if (user.pin_hash !== pin) throw new Error('Invalid PIN')
    return user
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
