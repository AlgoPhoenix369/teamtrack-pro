import { supabase } from './supabase'
import { db } from './mockDb'
import { broadcastRefresh } from './broadcastService'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const notificationService = {
  async getNotifications(userId) {
    if (USE_MOCK) return db.getNotifications(userId)
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async addNotification(data) {
    if (USE_MOCK) return db.addNotification(data)
    const { data: item, error } = await supabase
      .from('notifications')
      .insert({
        user_id: data.user_id,
        title:   data.title,
        body:    data.body,
        type:    data.type || 'info',
        link:    data.link || null,
        read:    false,
      })
      .select()
      .single()
    if (error) throw error
    // Push instant bell-badge update to the recipient's browser
    broadcastRefresh(data.user_id)
    return item
  },

  async markRead(id) {
    if (USE_MOCK) { db.markNotificationRead(id); return }
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
    if (error) throw error
  },

  async markAllRead(userId) {
    if (USE_MOCK) { db.markAllNotificationsRead(userId); return }
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    if (error) throw error
  },

  async notifyMessage(fromUser, toUserId, preview) {
    return this.addNotification({
      user_id: toUserId,
      type:    'message',
      title:   `New message from ${fromUser.name}`,
      body:    preview.slice(0, 80),
      link:    '/messages',
    })
  },

  async notifyHelpQuery(fromUser, toUserId, subject) {
    return this.addNotification({
      user_id: toUserId,
      type:    'help',
      title:   `New help query from ${fromUser.name}`,
      body:    subject,
      link:    '/help-desk',
    })
  },

  async notifyMeeting(meetingTitle, attendeeIds, organizerId) {
    for (const uid of attendeeIds) {
      if (uid === organizerId) continue
      await this.addNotification({
        user_id: uid,
        type:    'meeting',
        title:   `New meeting: ${meetingTitle}`,
        body:    'You have been added as an attendee.',
        link:    '/meetings',
      })
    }
  },
}
