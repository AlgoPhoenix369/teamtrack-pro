import { db } from './mockDb'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const messageService = {
  // Returns all messages involving userId, enriched with from_user / to_user
  async getMessages(userId) {
    if (USE_MOCK) return db.getMessages(userId)
    return []
  },

  async sendMessage(fromUserId, toUserId, text) {
    if (USE_MOCK) return db.sendMessage(fromUserId, toUserId, text)
    return null
  },

  // Mark all messages from `fromUserId` to `toUserId` as read
  async markRead(fromUserId, toUserId) {
    if (USE_MOCK) { db.markMessagesRead(fromUserId, toUserId); return }
  },

  async getUnreadCount(userId) {
    if (USE_MOCK) return db.getUnreadCount(userId)
    return 0
  },

  // Returns list of contacts this user is allowed to message.
  // super_admin → everyone; any other role → super_admins only.
  getAllowedContacts(currentUser, allUsers) {
    if (currentUser.role === 'super_admin') {
      return allUsers.filter(u => u.id !== currentUser.id && u.is_active)
    }
    return allUsers.filter(u => u.role === 'super_admin' && u.is_active)
  },
}
