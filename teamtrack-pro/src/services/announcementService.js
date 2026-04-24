import { supabase } from './supabase'
import { db } from './mockDb'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const SELECT = '*, author:users!created_by(id, name)'

export const announcementService = {
  async getAll() {
    if (USE_MOCK) return db.getAnnouncements()
    const { data, error } = await supabase
      .from('announcements')
      .select(SELECT)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async create(data) {
    if (USE_MOCK) return db.createAnnouncement(data)
    const { data: item, error } = await supabase
      .from('announcements')
      .insert({
        title:      data.title,
        body:       data.body,
        priority:   data.priority,
        pinned:     data.pinned ?? false,
        created_by: data.author_id,
        reads:      [],
      })
      .select(SELECT)
      .single()
    if (error) throw error
    return item
  },

  async update(id, updates) {
    if (USE_MOCK) return db.updateAnnouncement(id, updates)
    const { data, error } = await supabase
      .from('announcements')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(SELECT)
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    if (USE_MOCK) { db.deleteAnnouncement(id); return }
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (error) throw error
  },

  async markRead(id, userId) {
    if (USE_MOCK) { db.markAnnouncementRead(id, userId); return }
    const { data: current } = await supabase
      .from('announcements').select('reads').eq('id', id).single()
    if (!current) return
    const reads = current.reads || []
    if (reads.includes(userId)) return
    await supabase
      .from('announcements')
      .update({ reads: [...reads, userId] })
      .eq('id', id)
  },

  async getUnreadCount(userId) {
    if (USE_MOCK) {
      const all = db.getAnnouncements()
      return all.filter(a => !(a.reads || []).includes(userId)).length
    }
    const { data } = await supabase.from('announcements').select('reads')
    if (!data) return 0
    return data.filter(a => !(a.reads || []).includes(userId)).length
  },
}
