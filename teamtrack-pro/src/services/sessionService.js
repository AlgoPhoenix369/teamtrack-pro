import { supabase } from './supabase'
import { db } from './mockDb'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// Throws if the session doesn't belong to actingUserId and they aren't a super_admin.
function assertOwnership(session, actingUserId, actingRole) {
  if (!session) return
  if (actingRole === 'super_admin') return
  if (session.user_id && session.user_id !== actingUserId) {
    throw new Error('Session ownership violation: you may only control your own session.')
  }
}

export const sessionService = {
  async createSession(userId, localDate) {
    const date = localDate || new Date().toISOString().split('T')[0]
    const now  = new Date().toISOString()
    if (USE_MOCK) {
      return db.createSession({
        user_id: userId, date, start_time: now, status: 'active',
        total_seconds: 0, description: '',
      })
    }
    const { data, error } = await supabase.from('sessions')
      .insert({ user_id: userId, date, start_time: now, status: 'active' })
      .select().single()
    if (error) throw error
    return data
  },

  async updateSession(sessionId, updates) {
    if (USE_MOCK) return db.updateSession(sessionId, updates)
    const { data, error } = await supabase.from('sessions').update(updates).eq('id', sessionId).select().single()
    if (error) throw error
    return data
  },

  async stopSession(sessionId, description, totalSeconds, events = [], actingUser = null) {
    if (USE_MOCK) {
      const session = db.getSessions({ user_id: undefined }).find(s => s.id === sessionId)
      assertOwnership(session, actingUser?.id, actingUser?.role)
      return db.updateSession(sessionId, {
        end_time: new Date().toISOString(), total_seconds: totalSeconds, description, status: 'completed', events,
      })
    }
    const { data, error } = await supabase.from('sessions').update({
      end_time: new Date().toISOString(), total_seconds: totalSeconds, description, status: 'completed',
    }).eq('id', sessionId).select().single()
    if (error) throw error
    return data
  },

  async pauseSession(id, actingUser = null) {
    if (USE_MOCK) {
      const session = db.getSessions({ user_id: undefined }).find(s => s.id === id)
      assertOwnership(session, actingUser?.id, actingUser?.role)
    }
    return this.updateSession(id, { status: 'paused' })
  },

  async resumeSession(id, actingUser = null) {
    if (USE_MOCK) {
      const session = db.getSessions({ user_id: undefined }).find(s => s.id === id)
      assertOwnership(session, actingUser?.id, actingUser?.role)
    }
    return this.updateSession(id, { status: 'active' })
  },

  async getSessionsByUser(userId, filters = {}) {
    if (USE_MOCK) return db.getSessions({ user_id: userId, ...filters })
    let q = supabase.from('sessions').select('*, activity_entries(*)')
      .eq('user_id', userId).order('created_at', { ascending: false })
    if (filters.startDate) q = q.gte('date', filters.startDate)
    if (filters.endDate)   q = q.lte('date', filters.endDate)
    const { data, error } = await q
    if (error) throw error
    return data
  },

  async getAllSessions(filters = {}) {
    if (USE_MOCK) return db.getSessions(filters.userId ? { user_id: filters.userId } : {})
    let q = supabase.from('sessions').select('*, activity_entries(*), users(name,role,team_id)')
      .order('created_at', { ascending: false })
    if (filters.userId)    q = q.eq('user_id', filters.userId)
    if (filters.startDate) q = q.gte('date', filters.startDate)
    if (filters.endDate)   q = q.lte('date', filters.endDate)
    const { data, error } = await q
    if (error) throw error
    return data
  },

  async addActivityEntry(entry) {
    if (USE_MOCK) return db.addEntry({ ...entry, timestamp: new Date().toISOString() })
    const { data, error } = await supabase.from('activity_entries')
      .insert({ ...entry, timestamp: new Date().toISOString() }).select().single()
    if (error) throw error
    return data
  },
}
