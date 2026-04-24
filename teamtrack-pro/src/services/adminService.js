import { supabase } from './supabase'
import { db } from './mockDb'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const adminService = {
  async getAllUsers() {
    if (USE_MOCK) return db.getUsers()
    const { data, error } = await supabase.from('users').select('*, teams!team_id(name)').order('name')
    if (error) throw error
    return data
  },

  async createUser(userData) {
    if (USE_MOCK) {
      const u = db.createUser(userData)
      db.addAuditLog({ user_id: userData.created_by, action: 'create', table_name: 'users', record_id: u.id, new_data: userData })
      return u
    }
    const { data, error } = await supabase.from('users').insert(userData).select().single()
    if (error) throw error
    return data
  },

  async updateUser(id, updates, adminId) {
    if (USE_MOCK) {
      const u = db.updateUser(id, updates)
      db.addAuditLog({ user_id: adminId, action: 'update', table_name: 'users', record_id: id, new_data: updates })
      return u
    }
    const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async resetPin(userId, newPin, adminId) {
    if (USE_MOCK) {
      db.updateUser(userId, { pin_hash: newPin })
      db.addAuditLog({ user_id: adminId, action: 'update', table_name: 'users', record_id: userId, new_data: { pin_reset: true } })
      return
    }
    const { error } = await supabase.from('users').update({ pin_hash: newPin }).eq('id', userId)
    if (error) throw error
  },

  async getAllTeams() {
    if (USE_MOCK) return db.getTeams()
    const { data, error } = await supabase.from('teams').select('*, users!led_by(name)')
    if (error) throw error
    return data
  },

  async getAuditLog() {
    if (USE_MOCK) return db.getAuditLog()
    const { data, error } = await supabase.from('audit_log')
      .select('*, users(name)').order('created_at', { ascending: false }).limit(500)
    if (error) throw error
    return data
  },

  async getSystemStats() {
    if (USE_MOCK) {
      return {
        sessions: db.getSessions(),
        applications: db.getApplications(),
        users: db.getUsers(),
      }
    }
    const [sessions, applications, users] = await Promise.all([
      supabase.from('sessions').select('id,total_seconds,user_id,date').eq('status','completed'),
      supabase.from('job_applications').select('id,status,owner_id,created_at'),
      supabase.from('users').select('id,name,role,is_active'),
    ])
    return { sessions: sessions.data||[], applications: applications.data||[], users: users.data||[] }
  },
}
