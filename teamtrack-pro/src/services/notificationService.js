import { db } from './mockDb'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const notificationService = {
  async getNotifications(userId) {
    if (USE_MOCK) return db.getNotifications(userId)
    return []
  },

  async addNotification(data) {
    if (USE_MOCK) return db.addNotification(data)
    return null
  },

  async markRead(id) {
    if (USE_MOCK) { db.markNotificationRead(id); return }
  },

  async markAllRead(userId) {
    if (USE_MOCK) { db.markAllNotificationsRead(userId); return }
  },

  // Call this when a message is sent so the recipient gets a notification
  async notifyMessage(fromUser, toUserId, preview) {
    return this.addNotification({
      user_id: toUserId,
      type: 'message',
      title: `New message from ${fromUser.name}`,
      body: preview.slice(0, 80),
      link: '/messages',
    })
  },

  // Call when a help query is created targeting an admin
  async notifyHelpQuery(fromUser, toUserId, subject) {
    return this.addNotification({
      user_id: toUserId,
      type: 'help',
      title: `New help query from ${fromUser.name}`,
      body: subject,
      link: '/help-desk',
    })
  },

  // Call when a meeting is scheduled for attendees
  async notifyMeeting(meetingTitle, attendeeIds, organizerId) {
    for (const uid of attendeeIds) {
      if (uid === organizerId) continue
      await this.addNotification({
        user_id: uid,
        type: 'meeting',
        title: `New meeting: ${meetingTitle}`,
        body: 'You have been added as an attendee.',
        link: '/meetings',
      })
    }
  },
}
