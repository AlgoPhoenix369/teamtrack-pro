import { supabase } from './supabase'
import { db } from './mockDb'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const SELECT = '*, user:users(id,name), application:job_applications(id,company_name,job_title)'

export const PLATFORMS = ['HireVue', 'Karat', 'Talview', 'Vervoe', 'Pymetrics', 'Spark Hire', 'myInterview', 'CoderPad', 'Other']

export const STATUS_META = {
  scheduled:      { label: 'Scheduled',       color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'     },
  in_progress:    { label: 'In Progress',      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
  completed:      { label: 'Completed',        color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'  },
  pending_review: { label: 'Pending Review',   color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'  },
  failed:         { label: 'Did Not Pass',     color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'          },
  cancelled:      { label: 'Cancelled',        color: 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'       },
}

export const PLATFORM_COLORS = {
  HireVue:    '#1E40AF', Karat:     '#7C3AED', Talview:    '#059669',
  Vervoe:     '#D97706', Pymetrics: '#DB2777', 'Spark Hire': '#0891B2',
  myInterview:'#6366F1', CoderPad:  '#EA580C', Other:       '#6B7280',
}

export const aiInterviewService = {
  async getAll(filters = {}) {
    if (USE_MOCK) return db.getAIInterviews(filters)
    let q = supabase.from('ai_interviews').select(SELECT).order('created_at', { ascending: false })
    if (filters.user_id)        q = q.eq('user_id', filters.user_id)
    if (filters.application_id) q = q.eq('application_id', filters.application_id)
    if (filters.status)         q = q.eq('status', filters.status)
    const { data, error } = await q
    if (error) throw error
    return data || []
  },

  async getByApplication(applicationId) {
    if (USE_MOCK) return db.getAIInterviews({ application_id: applicationId })
    const { data, error } = await supabase
      .from('ai_interviews')
      .select(SELECT)
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getByUser(userId) {
    if (USE_MOCK) return db.getAIInterviews({ user_id: userId })
    const { data, error } = await supabase
      .from('ai_interviews')
      .select(SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async create(data) {
    if (USE_MOCK) return db.createAIInterview(data)
    const { data: item, error } = await supabase
      .from('ai_interviews')
      .insert({
        application_id:   data.application_id || null,
        user_id:          data.user_id,
        platform:         data.platform,
        status:           data.status || 'scheduled',
        scheduled_at:     data.scheduled_at || null,
        completed_at:     data.completed_at || null,
        duration_minutes: data.duration_minutes || null,
        score:            data.score ?? null,
        feedback:         data.feedback || null,
        link:             data.link || null,
        prep_notes:       data.prep_notes || null,
      })
      .select(SELECT)
      .single()
    if (error) throw error
    return item
  },

  async update(id, updates) {
    if (USE_MOCK) return db.updateAIInterview(id, updates)
    const patch = { updated_at: new Date().toISOString() }
    if (updates.platform         !== undefined) patch.platform         = updates.platform
    if (updates.status           !== undefined) patch.status           = updates.status
    if (updates.scheduled_at     !== undefined) patch.scheduled_at     = updates.scheduled_at || null
    if (updates.completed_at     !== undefined) patch.completed_at     = updates.completed_at || null
    if (updates.duration_minutes !== undefined) patch.duration_minutes = updates.duration_minutes || null
    if (updates.score            !== undefined) patch.score            = updates.score ?? null
    if (updates.feedback         !== undefined) patch.feedback         = updates.feedback || null
    if (updates.link             !== undefined) patch.link             = updates.link || null
    if (updates.prep_notes       !== undefined) patch.prep_notes       = updates.prep_notes || null
    const { data, error } = await supabase
      .from('ai_interviews').update(patch).eq('id', id).select(SELECT).single()
    if (error) throw error
    return data
  },

  async delete(id) {
    if (USE_MOCK) { db.deleteAIInterview(id); return }
    const { error } = await supabase.from('ai_interviews').delete().eq('id', id)
    if (error) throw error
  },

  computeStats(interviews) {
    const completed = interviews.filter(x => x.status === 'completed')
    const withScore = completed.filter(x => x.score != null)
    const avgScore  = withScore.length
      ? Math.round(withScore.reduce((a, x) => a + x.score, 0) / withScore.length)
      : null
    const passRate  = completed.length
      ? Math.round((completed.length / interviews.filter(x =>
          ['completed','failed'].includes(x.status)).length) * 100)
      : 0
    return {
      total:     interviews.length,
      scheduled: interviews.filter(x => x.status === 'scheduled').length,
      completed: completed.length,
      failed:    interviews.filter(x => x.status === 'failed').length,
      pending:   interviews.filter(x => x.status === 'pending_review').length,
      avgScore,
      passRate,
    }
  },
}
