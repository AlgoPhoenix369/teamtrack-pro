import { db } from './mockDb'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

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
    return []
  },

  async getByApplication(applicationId) {
    if (USE_MOCK) return db.getAIInterviews({ application_id: applicationId })
    return []
  },

  async getByUser(userId) {
    if (USE_MOCK) return db.getAIInterviews({ user_id: userId })
    return []
  },

  async create(data) {
    if (USE_MOCK) return db.createAIInterview(data)
    return null
  },

  async update(id, updates) {
    if (USE_MOCK) return db.updateAIInterview(id, updates)
    return null
  },

  async delete(id) {
    if (USE_MOCK) { db.deleteAIInterview(id); return }
  },

  // Aggregate stats for a set of interviews
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
      total:      interviews.length,
      scheduled:  interviews.filter(x => x.status === 'scheduled').length,
      completed:  completed.length,
      failed:     interviews.filter(x => x.status === 'failed').length,
      pending:    interviews.filter(x => x.status === 'pending_review').length,
      avgScore,
      passRate,
    }
  },
}
