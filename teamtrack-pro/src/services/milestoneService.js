import { supabase } from './supabase'
import { db } from './mockDb'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const milestoneService = {
  async getAll(user) {
    if (USE_MOCK) {
      if (user?.role === 'super_admin') return db.getMilestones()
      if (user?.role === 'view_admin') return db.getMilestones()
      return db.getMilestones({ assigned_to: user.id })
    }
    let q = supabase.from('milestones')
      .select('*, assignee:users!assigned_to(id,name), creator:users!created_by(id,name)')
      .order('created_at', { ascending: false })
    if (user?.role === 'tasker') q = q.eq('assigned_to', user.id)
    const { data, error } = await q
    if (error) throw error
    return data
  },

  async create(data) {
    if (USE_MOCK) return db.createMilestone(data)
    const { data: m, error } = await supabase.from('milestones')
      .insert({ ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .select('*, assignee:users!assigned_to(id,name), creator:users!created_by(id,name)')
      .single()
    if (error) throw error
    return m
  },

  async update(id, updates) {
    if (USE_MOCK) return db.updateMilestone(id, updates)
    const { data, error } = await supabase.from('milestones')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, assignee:users!assigned_to(id,name), creator:users!created_by(id,name)')
      .single()
    if (error) throw error
    return data
  },

  async remove(id) {
    if (USE_MOCK) { db.deleteMilestone(id); return }
    const { error } = await supabase.from('milestones').delete().eq('id', id)
    if (error) throw error
  },

  async getActiveSessions() {
    if (USE_MOCK) return db.getActiveSessions()
    const { data, error } = await supabase.from('sessions')
      .select('*, user:users(id,name,role,team_id)')
      .in('status', ['active', 'paused'])
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async forceStop(sessionId) {
    if (USE_MOCK) { db.forceStopSession(sessionId); return }
    const { error } = await supabase.from('sessions')
      .update({
        status: 'completed',
        end_time: new Date().toISOString(),
        description: '[Force-stopped by admin]',
      })
      .eq('id', sessionId)
    if (error) throw error
  },
}
