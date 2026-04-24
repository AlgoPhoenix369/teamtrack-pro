import { db } from './mockDb'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const announcementService = {
  async getAll() {
    if (USE_MOCK) return db.getAnnouncements()
    return []
  },

  async create(data) {
    if (USE_MOCK) return db.createAnnouncement(data)
    return null
  },

  async update(id, updates) {
    if (USE_MOCK) return db.updateAnnouncement(id, updates)
    return null
  },

  async delete(id) {
    if (USE_MOCK) { db.deleteAnnouncement(id); return }
  },

  async markRead(id, userId) {
    if (USE_MOCK) { db.markAnnouncementRead(id, userId); return }
  },

  async getUnreadCount(userId) {
    if (USE_MOCK) {
      const all = db.getAnnouncements()
      return all.filter(a => !a.reads.includes(userId)).length
    }
    return 0
  },
}
