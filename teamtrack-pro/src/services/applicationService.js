import { supabase } from './supabase'
import { db } from './mockDb'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const applicationService = {
  _cleanPayload(data) {
    return {
      ...data,
      persona_id:       data.persona_id      || null,
      follow_up_date:   data.follow_up_date   || null,
      salary_range_min: data.salary_range_min ? Number(data.salary_range_min) : null,
      salary_range_max: data.salary_range_max ? Number(data.salary_range_max) : null,
    }
  },

  async createApplication(data) {
    if (USE_MOCK) return db.createApplication(data)
    const { data: app, error } = await supabase
      .from('job_applications').insert(this._cleanPayload(data)).select().single()
    if (error) throw error
    db.addTimelineEvent && await this._addTimeline(app.id, data.owner_id, 'created', null, data.status, 'Application created')
    return app
  },

  async updateApplication(id, updates, userId) {
    if (USE_MOCK) return db.updateApplication(id, { ...updates, owner_id: userId })
    const { data: existing } = await supabase.from('job_applications').select('status').eq('id', id).single()
    const { data, error } = await supabase.from('job_applications')
      .update({ ...this._cleanPayload(updates), updated_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) throw error
    if (updates.status && existing?.status !== updates.status) {
      await this._addTimeline(id, userId, 'status_change', existing?.status, updates.status)
    }
    return data
  },

  async deleteApplication(id) {
    if (USE_MOCK) { db.deleteApplication(id); return }
    const { error } = await supabase.from('job_applications').delete().eq('id', id)
    if (error) throw error
  },

  async getApplicationsByUser(userId, filters = {}) {
    if (USE_MOCK) {
      let apps = db.getApplications({ owner_id: userId })
      if (filters.status) apps = apps.filter(a => a.status === filters.status)
      if (filters.search) {
        const q = filters.search.toLowerCase()
        apps = apps.filter(a =>
          a.company_name?.toLowerCase().includes(q) ||
          a.job_title?.toLowerCase().includes(q) ||
          a.tags?.toLowerCase().includes(q)
        )
      }
      return apps
    }
    let q = supabase.from('job_applications').select('*, personas(full_name,email)')
      .eq('owner_id', userId).order('created_at', { ascending: false })
    if (filters.status) q = q.eq('status', filters.status)
    const { data, error } = await q
    if (error) throw error
    return data
  },

  async getAllApplications(filters = {}) {
    if (USE_MOCK) {
      let apps = db.getApplications(filters.userId ? { owner_id: filters.userId } : {})
      if (filters.status) apps = apps.filter(a => a.status === filters.status)
      return apps
    }
    let q = supabase.from('job_applications').select('*, personas(full_name), users!owner_id(name)')
      .order('created_at', { ascending: false })
    if (filters.userId) q = q.eq('owner_id', filters.userId)
    if (filters.status) q = q.eq('status', filters.status)
    const { data, error } = await q
    if (error) throw error
    return data
  },

  async getPublicApplication(id) {
    if (USE_MOCK) {
      const app = db.getApplication(id)
      if (!app) throw new Error('Not found')
      return app
    }
    const { data, error } = await supabase.from('job_applications').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },

  async getTimeline(applicationId) {
    if (USE_MOCK) return db.getTimeline(applicationId)
    const { data, error } = await supabase.from('application_timeline')
      .select('*, users(name)').eq('application_id', applicationId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getFollowUpsDue(userId) {
    if (USE_MOCK) {
      const today = new Date().toISOString().split('T')[0]
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
      return db.getApplications({ owner_id: userId })
        .filter(a => a.follow_up_date >= today && a.follow_up_date <= nextWeek)
        .sort((a, b) => a.follow_up_date.localeCompare(b.follow_up_date))
    }
    const today = new Date().toISOString().split('T')[0]
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    const { data, error } = await supabase.from('job_applications').select('*')
      .eq('owner_id', userId).lte('follow_up_date', nextWeek).gte('follow_up_date', today)
    if (error) throw error
    return data
  },

  async getOverdueFollowUps(userId) {
    if (USE_MOCK) {
      const today = new Date().toISOString().split('T')[0]
      return db.getApplications({ owner_id: userId })
        .filter(a => a.follow_up_date && a.follow_up_date < today &&
          !['Rejected','Withdrawn','Offer'].includes(a.status))
    }
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase.from('job_applications').select('*')
      .eq('owner_id', userId).lt('follow_up_date', today)
    if (error) throw error
    return data
  },

  async _addTimeline(applicationId, userId, eventType, oldValue, newValue, note) {
    await supabase.from('application_timeline').insert({
      application_id: applicationId, user_id: userId, event_type: eventType,
      old_value: oldValue, new_value: newValue, note,
      created_at: new Date().toISOString(),
    })
  },
}
