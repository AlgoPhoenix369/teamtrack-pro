import { supabase } from './supabase'
import { db } from './mockDb'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const leaderboardService = {
  async getData() {
    if (USE_MOCK) {
      const users        = db.getUsers().filter(u => u.is_active)
      const sessions     = db.getSessions({})
      const applications = db.getApplications({})
      const aiInterviews = db.getAIInterviews ? db.getAIInterviews({}) : []

      const appCountsMap = {}
      for (const a of applications) {
        if (!appCountsMap[a.owner_id])
          appCountsMap[a.owner_id] = { total_count: 0, offer_count: 0 }
        appCountsMap[a.owner_id].total_count++
        if (a.status === 'Offer') appCountsMap[a.owner_id].offer_count++
      }

      return { users, sessions, appCountsMap, aiInterviews }
    }

    const [usersRes, sessionsRes, appCountsRes, aiRes] = await Promise.allSettled([
      supabase.rpc('get_leaderboard_users'),
      supabase.rpc('get_leaderboard_sessions'),
      supabase.rpc('get_leaderboard_app_counts'),
      supabase.rpc('get_leaderboard_ai_interviews'),
    ])

    const users         = usersRes.status      === 'fulfilled' ? (usersRes.value.data      || []) : []
    const sessions      = sessionsRes.status   === 'fulfilled' ? (sessionsRes.value.data   || []) : []
    const appCountsList = appCountsRes.status  === 'fulfilled' ? (appCountsRes.value.data  || []) : []
    const aiInterviews  = aiRes.status         === 'fulfilled' ? (aiRes.value.data         || []) : []

    const appCountsMap = {}
    for (const row of appCountsList) {
      appCountsMap[row.owner_id] = {
        total_count: Number(row.total_count),
        offer_count: Number(row.offer_count),
      }
    }

    return { users, sessions, appCountsMap, aiInterviews }
  },
}
