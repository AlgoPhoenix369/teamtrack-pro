import { supabase } from './supabase'
import { db } from './mockDb'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const SELECT = '*, organizer:users!created_by(id, name)'

function toShape(m) {
  if (!m) return null
  const endDate = m.scheduled_at && m.duration_minutes
    ? new Date(new Date(m.scheduled_at).getTime() + m.duration_minutes * 60000).toISOString()
    : m.scheduled_at
  return {
    ...m,
    organizer_id:   m.created_by,
    start_time:     m.scheduled_at,
    end_time:       endDate,
    meet_link:      m.link,
    attendee_users: [],
  }
}

export const meetingService = {
  async getMeetings(filters = {}) {
    if (USE_MOCK) return db.getMeetings(filters)
    const { data, error } = await supabase
      .from('meetings')
      .select(SELECT)
      .order('scheduled_at')
    if (error) throw error
    let list = (data || []).map(toShape).filter(Boolean)
    if (filters.userId) {
      list = list.filter(m =>
        m.created_by === filters.userId ||
        (m.attendees || []).includes(filters.userId)
      )
    }
    if (filters.from) list = list.filter(m => m.start_time >= filters.from)
    if (filters.to)   list = list.filter(m => m.start_time <= filters.to)
    return list
  },

  async createMeeting(data) {
    if (USE_MOCK) return db.createMeeting(data)
    const duration = data.start_time && data.end_time
      ? Math.round((new Date(data.end_time) - new Date(data.start_time)) / 60000)
      : 30
    const { data: item, error } = await supabase
      .from('meetings')
      .insert({
        title:            data.title,
        description:      data.description,
        scheduled_at:     data.start_time,
        duration_minutes: duration,
        link:             data.meet_link,
        created_by:       data.organizer_id,
        attendees:        data.attendees || [],
        status:           data.status || 'scheduled',
        color:            data.color,
      })
      .select(SELECT)
      .single()
    if (error) throw error
    return toShape(item)
  },

  async updateMeeting(id, updates) {
    if (USE_MOCK) return db.updateMeeting(id, updates)
    const patch = { updated_at: new Date().toISOString() }
    if (updates.title !== undefined)       patch.title = updates.title
    if (updates.description !== undefined) patch.description = updates.description
    if (updates.start_time)                patch.scheduled_at = updates.start_time
    if (updates.meet_link !== undefined)   patch.link = updates.meet_link
    if (updates.organizer_id)              patch.created_by = updates.organizer_id
    if (updates.attendees)                 patch.attendees = updates.attendees
    if (updates.status)                    patch.status = updates.status
    if (updates.color)                     patch.color = updates.color
    if (updates.start_time && updates.end_time) {
      patch.duration_minutes = Math.round(
        (new Date(updates.end_time) - new Date(updates.start_time)) / 60000
      )
    }
    const { data, error } = await supabase
      .from('meetings')
      .update(patch)
      .eq('id', id)
      .select(SELECT)
      .single()
    if (error) throw error
    return toShape(data)
  },

  async deleteMeeting(id) {
    if (USE_MOCK) { db.deleteMeeting(id); return }
    const { error } = await supabase.from('meetings').delete().eq('id', id)
    if (error) throw error
  },

  async getConflicts(startTime, endTime, excludeId = null) {
    const all = await this.getMeetings()
    return all.filter(m =>
      m.id !== excludeId &&
      m.status !== 'cancelled' &&
      new Date(m.start_time) < new Date(endTime) &&
      new Date(m.end_time) > new Date(startTime)
    )
  },

  async getAvailability(date) {
    const start = new Date(date); start.setHours(0, 0, 0, 0)
    const end   = new Date(date); end.setHours(23, 59, 59, 999)
    const meetings = await this.getMeetings({
      from: start.toISOString(), to: end.toISOString(),
    })
    const busy = {}
    for (const m of meetings) {
      for (const uid of (m.attendees || [])) {
        if (!busy[uid]) busy[uid] = []
        busy[uid].push({ start: m.start_time, end: m.end_time, title: m.title, color: m.color })
      }
    }
    return busy
  },
}
