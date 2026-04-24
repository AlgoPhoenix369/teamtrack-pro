import { db } from './mockDb'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const meetingService = {
  async getMeetings(filters = {}) {
    if (USE_MOCK) return db.getMeetings(filters)
    return []
  },

  async createMeeting(data) {
    if (USE_MOCK) return db.createMeeting(data)
    return null
  },

  async updateMeeting(id, updates) {
    if (USE_MOCK) return db.updateMeeting(id, updates)
    return null
  },

  async deleteMeeting(id) {
    if (USE_MOCK) { db.deleteMeeting(id); return }
  },

  // Returns all meetings in a date range, used for availability conflict detection
  async getConflicts(startTime, endTime, excludeId = null) {
    const all = await this.getMeetings()
    return all.filter(m =>
      m.id !== excludeId &&
      m.status !== 'cancelled' &&
      new Date(m.start_time) < new Date(endTime) &&
      new Date(m.end_time) > new Date(startTime)
    )
  },

  // Get each user's busy slots for a given date
  async getAvailability(date) {
    const start = new Date(date); start.setHours(0, 0, 0, 0)
    const end   = new Date(date); end.setHours(23, 59, 59, 999)
    const meetings = await this.getMeetings({
      from: start.toISOString(), to: end.toISOString(),
    })
    // Build busy map: userId -> [{start, end, title}]
    const busy = {}
    for (const m of meetings) {
      for (const uid of m.attendees) {
        if (!busy[uid]) busy[uid] = []
        busy[uid].push({ start: m.start_time, end: m.end_time, title: m.title, color: m.color })
      }
    }
    return busy
  },
}
