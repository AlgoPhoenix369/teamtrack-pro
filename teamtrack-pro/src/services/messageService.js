import { supabase } from './supabase'
import { db } from './mockDb'
import { broadcastRefresh } from './broadcastService'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// DB uses from_user/to_user/body/read; pages expect from_user_id/to_user_id/text/read_by_recipient
function toShape(m) {
  return {
    ...m,
    from_user_id:     m.from_user,
    to_user_id:       m.to_user,
    text:             m.body,
    read_by_recipient: m.read,
  }
}

export const messageService = {
  async getMessages(userId) {
    if (USE_MOCK) return db.getMessages(userId)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`from_user.eq.${userId},to_user.eq.${userId}`)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data || []).map(toShape)
  },

  async sendMessage(fromUserId, toUserId, text) {
    if (USE_MOCK) return db.sendMessage(fromUserId, toUserId, text)
    const now = new Date().toISOString()
    const msg = toShape({
      id:         crypto.randomUUID(),
      from_user:  fromUserId,
      to_user:    toUserId,
      body:       text,
      read:       false,
      created_at: now,
    })

    // Track A — broadcast full message payload directly to recipient's screen.
    // Delivers instantly even if DB is slow or fails.
    supabase.channel('taskoenix-messages')
      .send({ type: 'broadcast', event: 'new_message', payload: { to: toUserId, message: msg } })
      .catch(() => {})

    // Track B — persist to DB (best effort). On success, tell recipient to
    // reload from DB so they get the canonical record. On failure, Track A
    // already delivered so the recipient still sees the message this session.
    try {
      await supabase.from('messages').insert({
        from_user: fromUserId,
        to_user:   toUserId,
        body:      text,
        read:      false,
      })
      broadcastRefresh(toUserId)
    } catch (err) {
      console.error('Message DB persist failed:', err)
    }

    return msg
  },

  async markRead(fromUserId, toUserId) {
    if (USE_MOCK) { db.markMessagesRead(fromUserId, toUserId); return }
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('from_user', fromUserId)
      .eq('to_user', toUserId)
      .eq('read', false)
    if (error) throw error
  },

  async getUnreadCount(userId) {
    if (USE_MOCK) return db.getUnreadCount(userId)
    const { data, error } = await supabase
      .from('messages')
      .select('id')
      .eq('to_user', userId)
      .eq('read', false)
    if (error) return 0
    return (data || []).length
  },

  getAllowedContacts(currentUser, allUsers) {
    if (currentUser.role === 'super_admin') {
      return allUsers.filter(u => u.id !== currentUser.id && u.is_active)
    }
    return allUsers.filter(u => u.role === 'super_admin' && u.is_active)
  },
}
