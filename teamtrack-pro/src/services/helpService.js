import { db } from './mockDb'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const helpService = {
  async getQueries(filters = {}) {
    if (USE_MOCK) return db.getHelpQueries(filters)
    // Supabase implementation goes here when ready
    return []
  },

  async createQuery(data) {
    if (USE_MOCK) return db.createHelpQuery(data)
    return null
  },

  async resolveQuery(id, resolvedBy, note) {
    if (USE_MOCK) return db.resolveHelpQuery(id, resolvedBy, note)
    return null
  },

  async addReply(queryId, fromUserId, text) {
    if (USE_MOCK) return db.addQueryReply(queryId, fromUserId, text)
    return null
  },

  async deleteQuery(id) {
    if (USE_MOCK) { db.deleteHelpQuery(id); return }
  },

  async getUnresolvedCount(userId, isAdmin) {
    const queries = await this.getQueries(isAdmin ? {} : { from_user_id: userId })
    return queries.filter(q => q.status === 'pending').length
  },
}
