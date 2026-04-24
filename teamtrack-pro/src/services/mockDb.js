// In-memory mock database — persists to localStorage between refreshes
import {
  USERS, TEAMS, SESSIONS, PERSONAS, JOB_APPLICATIONS, APPLICATION_TIMELINE, AUDIT_LOG,
  HELP_QUERIES, MEETINGS, MESSAGES, NOTIFICATIONS, ANNOUNCEMENTS, AI_INTERVIEWS, SAVED_ACCOUNTS, MILESTONES, SKILLS,
} from './mockData'

function load(key, fallback) {
  try {
    const raw = localStorage.getItem('mockdb_' + key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function save(key, data) {
  localStorage.setItem('mockdb_' + key, JSON.stringify(data))
}

// Initialize once per session (don't overwrite existing dev data)
if (!localStorage.getItem('mockdb_initialized')) {
  save('users', USERS)
  save('teams', TEAMS)
  save('sessions', SESSIONS)
  save('personas', PERSONAS)
  save('applications', JOB_APPLICATIONS)
  save('timeline', APPLICATION_TIMELINE)
  save('audit', AUDIT_LOG)
  save('help_queries', HELP_QUERIES)
  save('meetings', MEETINGS)
  save('messages', MESSAGES)
  save('notifications', NOTIFICATIONS)
  save('announcements', ANNOUNCEMENTS)
  save('ai_interviews', AI_INTERVIEWS)
  save('saved_accounts', SAVED_ACCOUNTS)
  save('milestones', MILESTONES)
  save('skills', SKILLS)
  localStorage.setItem('mockdb_initialized', '1')
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const db = {
  // ── USERS ──────────────────────────────────────────
  getUsers()    { return load('users', USERS) },
  getUser(id)   { return this.getUsers().find(u => u.id === id) || null },
  getUserByEmail(email) { return this.getUsers().find(u => u.email === email) || null },
  getUserByName(name)   { return this.getUsers().find(u => u.name.toLowerCase() === name.toLowerCase()) || null },

  updateUser(id, updates) {
    const users = this.getUsers().map(u => u.id === id ? { ...u, ...updates } : u)
    save('users', users)
    return users.find(u => u.id === id)
  },

  createUser(data) {
    const user = { id: 'user-' + uid(), ...data, created_at: new Date().toISOString(), teams: null }
    const users = [...this.getUsers(), user]
    save('users', users)
    return user
  },

  // ── TEAMS ───────────────────────────────────────────
  getTeams() {
    const teams = load('teams', TEAMS)
    const users = this.getUsers()
    return teams.map(t => ({ ...t, users: users.find(u => u.id === t.led_by) || null }))
  },

  // ── SESSIONS ────────────────────────────────────────
  getSessions(filters = {}) {
    let s = load('sessions', SESSIONS)
    if (filters.user_id) s = s.filter(x => x.user_id === filters.user_id)
    if (filters.startDate) s = s.filter(x => x.date >= filters.startDate)
    if (filters.endDate)   s = s.filter(x => x.date <= filters.endDate)
    if (filters.status)    s = s.filter(x => x.status === filters.status)
    return s.sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  createSession(data) {
    const session = {
      id: 'session-' + uid(),
      ...data,
      created_at: new Date().toISOString(),
      activity_entries: [],
      users: this.getUser(data.user_id) || null,
    }
    const sessions = [...load('sessions', SESSIONS), session]
    save('sessions', sessions)
    return session
  },

  updateSession(id, updates) {
    const sessions = load('sessions', SESSIONS).map(s => s.id === id ? { ...s, ...updates } : s)
    save('sessions', sessions)
    return sessions.find(s => s.id === id)
  },

  // ── ACTIVITY ENTRIES ────────────────────────────────
  addEntry(entry) {
    const e = { id: 'ae-' + uid(), ...entry }
    const sessions = load('sessions', SESSIONS).map(s => {
      if (s.id !== entry.session_id) return s
      return { ...s, activity_entries: [e, ...(s.activity_entries || [])] }
    })
    save('sessions', sessions)
    return e
  },

  // ── PERSONAS ────────────────────────────────────────
  getPersonas(filters = {}) {
    let p = load('personas', PERSONAS)
    if (filters.assigned_to) p = p.filter(x => x.assigned_to === filters.assigned_to)
    if (filters.is_active !== undefined) p = p.filter(x => x.is_active === filters.is_active)
    const users = this.getUsers()
    return p.map(x => ({ ...x, users: users.find(u => u.id === x.assigned_to) || null }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  createPersona(data) {
    const p = {
      id: 'persona-' + uid(), ...data,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      users: this.getUser(data.assigned_to) || null,
    }
    save('personas', [...load('personas', PERSONAS), p])
    return p
  },

  updatePersona(id, updates) {
    const personas = load('personas', PERSONAS).map(p =>
      p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
    )
    save('personas', personas)
    const p = personas.find(x => x.id === id)
    return { ...p, users: this.getUser(p.assigned_to) || null }
  },

  deletePersona(id) {
    save('personas', load('personas', PERSONAS).filter(p => p.id !== id))
  },

  // ── JOB APPLICATIONS ────────────────────────────────
  getApplications(filters = {}) {
    let apps = load('applications', JOB_APPLICATIONS)
    if (filters.owner_id) apps = apps.filter(a => a.owner_id === filters.owner_id)
    if (filters.status)   apps = apps.filter(a => a.status === filters.status)
    const personas = this.getPersonas()
    const users = this.getUsers()
    return apps
      .map(a => ({
        ...a,
        personas: personas.find(p => p.id === a.persona_id) || null,
        users: users.find(u => u.id === a.owner_id) || null,
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  getApplication(id) {
    return load('applications', JOB_APPLICATIONS).find(a => a.id === id) || null
  },

  createApplication(data) {
    const app = {
      id: 'app-' + uid(), ...data,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }
    save('applications', [...load('applications', JOB_APPLICATIONS), app])
    this.addTimelineEvent(app.id, data.owner_id, 'created', null, data.status, 'Application created')
    return { ...app, personas: this.getPersonas().find(p => p.id === app.persona_id) || null }
  },

  updateApplication(id, updates) {
    const apps = load('applications', JOB_APPLICATIONS)
    const existing = apps.find(a => a.id === id)
    const updated = apps.map(a =>
      a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a
    )
    save('applications', updated)
    if (updates.status && existing?.status !== updates.status) {
      this.addTimelineEvent(id, updates.owner_id || existing?.owner_id, 'status_change', existing?.status, updates.status)
    }
    const a = updated.find(x => x.id === id)
    return { ...a, personas: this.getPersonas().find(p => p.id === a.persona_id) || null }
  },

  deleteApplication(id) {
    save('applications', load('applications', JOB_APPLICATIONS).filter(a => a.id !== id))
  },

  // ── TIMELINE ────────────────────────────────────────
  getTimeline(applicationId) {
    const users = this.getUsers()
    return load('timeline', APPLICATION_TIMELINE)
      .filter(t => t.application_id === applicationId)
      .map(t => ({ ...t, users: users.find(u => u.id === t.user_id) || null }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  addTimelineEvent(applicationId, userId, eventType, oldValue, newValue, note) {
    const event = {
      id: 'tl-' + uid(), application_id: applicationId, user_id: userId,
      event_type: eventType, old_value: oldValue, new_value: newValue,
      note: note || null, created_at: new Date().toISOString(),
    }
    save('timeline', [...load('timeline', APPLICATION_TIMELINE), event])
    return event
  },

  // ── HELP QUERIES ────────────────────────────────────
  getHelpQueries(filters = {}) {
    const users = this.getUsers()
    let list = load('help_queries', HELP_QUERIES)
    if (filters.from_user_id) list = list.filter(q => q.from_user_id === filters.from_user_id)
    if (filters.to_user_id)   list = list.filter(q => q.to_user_id === filters.to_user_id || !q.to_user_id)
    if (filters.status)       list = list.filter(q => q.status === filters.status)
    return list
      .map(q => ({
        ...q,
        from_user: users.find(u => u.id === q.from_user_id) || null,
        to_user:   q.to_user_id ? users.find(u => u.id === q.to_user_id) || null : null,
        replies: (q.replies || []).map(r => ({
          ...r, from_user: users.find(u => u.id === r.from_user_id) || null,
        })),
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  createHelpQuery(data) {
    const users = this.getUsers()
    const q = {
      id: 'hq-' + uid(), ...data, status: 'pending', replies: [],
      resolved_by: null, resolved_at: null, resolution_note: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }
    save('help_queries', [...load('help_queries', HELP_QUERIES), q])
    return {
      ...q,
      from_user: users.find(u => u.id === q.from_user_id) || null,
      to_user: q.to_user_id ? users.find(u => u.id === q.to_user_id) || null : null,
    }
  },

  resolveHelpQuery(id, resolvedBy, note) {
    const list = load('help_queries', HELP_QUERIES).map(q =>
      q.id === id ? {
        ...q, status: 'resolved', resolved_by: resolvedBy,
        resolved_at: new Date().toISOString(), resolution_note: note,
        updated_at: new Date().toISOString(),
      } : q
    )
    save('help_queries', list)
    return list.find(q => q.id === id)
  },

  addQueryReply(queryId, fromUserId, text) {
    const users = this.getUsers()
    const reply = { id: 'r-' + uid(), from_user_id: fromUserId, text, created_at: new Date().toISOString() }
    const list = load('help_queries', HELP_QUERIES).map(q =>
      q.id === queryId
        ? { ...q, replies: [...(q.replies || []), reply], updated_at: new Date().toISOString() }
        : q
    )
    save('help_queries', list)
    return { ...reply, from_user: users.find(u => u.id === fromUserId) || null }
  },

  deleteHelpQuery(id) {
    save('help_queries', load('help_queries', HELP_QUERIES).filter(q => q.id !== id))
  },

  // ── MEETINGS ────────────────────────────────────────
  getMeetings(filters = {}) {
    const users = this.getUsers()
    let list = load('meetings', MEETINGS)
    if (filters.userId) {
      list = list.filter(m => m.organizer_id === filters.userId || m.attendees.includes(filters.userId))
    }
    if (filters.from) list = list.filter(m => m.start_time >= filters.from)
    if (filters.to)   list = list.filter(m => m.start_time <= filters.to)
    return list
      .map(m => ({
        ...m,
        organizer: users.find(u => u.id === m.organizer_id) || null,
        attendee_users: m.attendees.map(id => users.find(u => u.id === id)).filter(Boolean),
      }))
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  },

  createMeeting(data) {
    const users = this.getUsers()
    const m = {
      id: 'meet-' + uid(), ...data,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }
    save('meetings', [...load('meetings', MEETINGS), m])
    return {
      ...m,
      organizer: users.find(u => u.id === m.organizer_id) || null,
      attendee_users: m.attendees.map(id => users.find(u => u.id === id)).filter(Boolean),
    }
  },

  updateMeeting(id, updates) {
    const users = this.getUsers()
    const list = load('meetings', MEETINGS).map(m =>
      m.id === id ? { ...m, ...updates, updated_at: new Date().toISOString() } : m
    )
    save('meetings', list)
    const m = list.find(x => x.id === id)
    return {
      ...m,
      organizer: users.find(u => u.id === m.organizer_id) || null,
      attendee_users: m.attendees.map(uid => users.find(u => u.id === uid)).filter(Boolean),
    }
  },

  deleteMeeting(id) {
    save('meetings', load('meetings', MEETINGS).filter(m => m.id !== id))
  },

  // ── DIRECT MESSAGES ─────────────────────────────────────────────────
  getMessages(userId) {
    const users = this.getUsers()
    return load('messages', MESSAGES)
      .filter(m => m.from_user_id === userId || m.to_user_id === userId)
      .map(m => ({
        ...m,
        from_user: users.find(u => u.id === m.from_user_id) || null,
        to_user:   users.find(u => u.id === m.to_user_id)   || null,
      }))
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
  },

  sendMessage(fromUserId, toUserId, text) {
    const users = this.getUsers()
    const msg = {
      id: 'dm-' + uid(), from_user_id: fromUserId, to_user_id: toUserId,
      text, read_by_recipient: false, created_at: new Date().toISOString(),
    }
    save('messages', [...load('messages', MESSAGES), msg])
    return {
      ...msg,
      from_user: users.find(u => u.id === fromUserId) || null,
      to_user:   users.find(u => u.id === toUserId)   || null,
    }
  },

  markMessagesRead(fromUserId, toUserId) {
    const list = load('messages', MESSAGES).map(m =>
      m.from_user_id === fromUserId && m.to_user_id === toUserId
        ? { ...m, read_by_recipient: true } : m
    )
    save('messages', list)
  },

  getUnreadCount(userId) {
    return load('messages', MESSAGES).filter(
      m => m.to_user_id === userId && !m.read_by_recipient
    ).length
  },

  // ── NOTIFICATIONS ────────────────────────────────────────────────────
  getNotifications(userId) {
    return load('notifications', NOTIFICATIONS)
      .filter(n => n.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  addNotification(data) {
    const n = { id: 'notif-' + uid(), read: false, created_at: new Date().toISOString(), ...data }
    save('notifications', [...load('notifications', NOTIFICATIONS), n])
    return n
  },

  markNotificationRead(id) {
    save('notifications', load('notifications', NOTIFICATIONS).map(n =>
      n.id === id ? { ...n, read: true } : n
    ))
  },

  markAllNotificationsRead(userId) {
    save('notifications', load('notifications', NOTIFICATIONS).map(n =>
      n.user_id === userId ? { ...n, read: true } : n
    ))
  },

  // ── ANNOUNCEMENTS ────────────────────────────────────────────────────
  getAnnouncements() {
    const users = this.getUsers()
    return load('announcements', ANNOUNCEMENTS)
      .map(a => ({ ...a, author: users.find(u => u.id === a.author_id) || null }))
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return b.created_at.localeCompare(a.created_at)
      })
  },

  createAnnouncement(data) {
    const users = this.getUsers()
    const a = {
      id: 'ann-' + uid(), reads: [], pinned: false,
      created_at: new Date().toISOString(), ...data,
    }
    save('announcements', [...load('announcements', ANNOUNCEMENTS), a])
    return { ...a, author: users.find(u => u.id === a.author_id) || null }
  },

  updateAnnouncement(id, updates) {
    const users = this.getUsers()
    const list = load('announcements', ANNOUNCEMENTS).map(a =>
      a.id === id ? { ...a, ...updates } : a
    )
    save('announcements', list)
    const a = list.find(x => x.id === id)
    return { ...a, author: users.find(u => u.id === a.author_id) || null }
  },

  deleteAnnouncement(id) {
    save('announcements', load('announcements', ANNOUNCEMENTS).filter(a => a.id !== id))
  },

  markAnnouncementRead(id, userId) {
    const list = load('announcements', ANNOUNCEMENTS).map(a =>
      a.id === id && !a.reads.includes(userId)
        ? { ...a, reads: [...a.reads, userId] } : a
    )
    save('announcements', list)
  },

  // ── AI INTERVIEWS ────────────────────────────────────────────────────
  getAIInterviews(filters = {}) {
    const users = this.getUsers()
    const apps  = load('applications', JOB_APPLICATIONS)
    let list = load('ai_interviews', AI_INTERVIEWS)
    if (filters.user_id)        list = list.filter(x => x.user_id === filters.user_id)
    if (filters.application_id) list = list.filter(x => x.application_id === filters.application_id)
    if (filters.status)         list = list.filter(x => x.status === filters.status)
    return list
      .map(x => ({
        ...x,
        user:        users.find(u => u.id === x.user_id)  || null,
        application: apps.find(a => a.id === x.application_id) || null,
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  createAIInterview(data) {
    const users = this.getUsers()
    const apps  = load('applications', JOB_APPLICATIONS)
    const x = {
      id: 'ai-' + uid(), score: null, feedback: null, completed_at: null,
      created_at: new Date().toISOString(), ...data,
    }
    save('ai_interviews', [...load('ai_interviews', AI_INTERVIEWS), x])
    return {
      ...x,
      user:        users.find(u => u.id === x.user_id)  || null,
      application: apps.find(a => a.id === x.application_id) || null,
    }
  },

  updateAIInterview(id, updates) {
    const users = this.getUsers()
    const apps  = load('applications', JOB_APPLICATIONS)
    const list  = load('ai_interviews', AI_INTERVIEWS).map(x =>
      x.id === id ? { ...x, ...updates } : x
    )
    save('ai_interviews', list)
    const x = list.find(y => y.id === id)
    return {
      ...x,
      user:        users.find(u => u.id === x.user_id)  || null,
      application: apps.find(a => a.id === x.application_id) || null,
    }
  },

  deleteAIInterview(id) {
    save('ai_interviews', load('ai_interviews', AI_INTERVIEWS).filter(x => x.id !== id))
  },

  // ── AUDIT LOG ───────────────────────────────────────
  getAuditLog() {
    const users = this.getUsers()
    return load('audit', AUDIT_LOG)
      .map(l => ({ ...l, users: users.find(u => u.id === l.user_id) || null }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  addAuditLog(entry) {
    save('audit', [...load('audit', AUDIT_LOG), { id: 'al-' + uid(), ...entry, created_at: new Date().toISOString() }])
  },

  // ── DEV HELPER ──────────────────────────────────────
  // ── SAVED ACCOUNTS (credentials vault) ─────────────────────────────
  getSavedAccounts(filters = {}) {
    const users = this.getUsers()
    let list = load('saved_accounts', SAVED_ACCOUNTS)
    if (filters.user_id) list = list.filter(a => a.user_id === filters.user_id)
    return list
      .map(a => ({ ...a, user: users.find(u => u.id === a.user_id) || null }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  createSavedAccount(data) {
    const a = {
      id: 'acct-' + uid(), ...data,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }
    save('saved_accounts', [...load('saved_accounts', SAVED_ACCOUNTS), a])
    return { ...a, user: this.getUser(a.user_id) || null }
  },

  updateSavedAccount(id, updates) {
    const list = load('saved_accounts', SAVED_ACCOUNTS).map(a =>
      a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a
    )
    save('saved_accounts', list)
    const a = list.find(x => x.id === id)
    return { ...a, user: this.getUser(a.user_id) || null }
  },

  deleteSavedAccount(id) {
    save('saved_accounts', load('saved_accounts', SAVED_ACCOUNTS).filter(a => a.id !== id))
  },

  // ── MILESTONES ───────────────────────────────────────────────────────
  getMilestones(filters = {}) {
    const users = this.getUsers()
    let list = load('milestones', MILESTONES)
    if (filters.assigned_to) list = list.filter(m => m.assigned_to === filters.assigned_to)
    if (filters.status)      list = list.filter(m => m.status === filters.status)
    return list
      .map(m => ({
        ...m,
        assignee: users.find(u => u.id === m.assigned_to) || null,
        creator:  users.find(u => u.id === m.created_by)  || null,
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  createMilestone(data) {
    const users = this.getUsers()
    const m = { id: 'ms-' + uid(), status: 'pending', ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    save('milestones', [...load('milestones', MILESTONES), m])
    return { ...m, assignee: users.find(u => u.id === m.assigned_to) || null, creator: users.find(u => u.id === m.created_by) || null }
  },

  updateMilestone(id, updates) {
    const users = this.getUsers()
    const list = load('milestones', MILESTONES).map(m =>
      m.id === id ? { ...m, ...updates, updated_at: new Date().toISOString() } : m
    )
    save('milestones', list)
    const m = list.find(x => x.id === id)
    return { ...m, assignee: users.find(u => u.id === m.assigned_to) || null, creator: users.find(u => u.id === m.created_by) || null }
  },

  deleteMilestone(id) {
    save('milestones', load('milestones', MILESTONES).filter(m => m.id !== id))
  },

  // ── SKILLS ───────────────────────────────────────────────────────────
  getSkills(filters = {}) {
    let list = load('skills', SKILLS)
    if (filters.user_id) list = list.filter(s => s.user_id === filters.user_id)
    if (filters.category) list = list.filter(s => s.category === filters.category)
    return list.sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  createSkill(data) {
    const s = { id: 'sk-' + uid(), ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    save('skills', [...load('skills', SKILLS), s])
    return s
  },

  updateSkill(id, updates) {
    const list = load('skills', SKILLS).map(s =>
      s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s
    )
    save('skills', list)
    return list.find(s => s.id === id)
  },

  deleteSkill(id) {
    save('skills', load('skills', SKILLS).filter(s => s.id !== id))
  },

  // ── SESSION FORCE-STOP (super admin only) ───────────────────────────
  getActiveSessions() {
    const users = this.getUsers()
    return load('sessions', SESSIONS)
      .filter(s => s.status === 'active' || s.status === 'paused')
      .map(s => ({ ...s, user: users.find(u => u.id === s.user_id) || null }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  forceStopSession(sessionId) {
    const list = load('sessions', SESSIONS).map(s =>
      s.id === sessionId
        ? { ...s, status: 'completed', end_time: new Date().toISOString(), description: '[Force-stopped by admin]' }
        : s
    )
    save('sessions', list)
  },

  reset() {
    localStorage.removeItem('mockdb_initialized')
    ;['users','teams','sessions','personas','applications','timeline','audit','help_queries','meetings','messages','notifications','announcements','ai_interviews','saved_accounts','milestones','skills'].forEach(k =>
      localStorage.removeItem('mockdb_' + k)
    )
    window.location.reload()
  },
}

// ── Migrations ────────────────────────────────────────────────────────
if (!load('saved_accounts', null)) save('saved_accounts', SAVED_ACCOUNTS)
if (!load('milestones', null))     save('milestones', MILESTONES)
if (!load('skills', null))         save('skills', SKILLS)
;(function applyMigrations() {
  const NEW_USERS = ['user-cliff', 'user-brandon', 'user-catherine']
  const existing = load('users', USERS)
  const missing  = USERS.filter(u => NEW_USERS.includes(u.id) && !existing.find(e => e.id === u.id))
  if (missing.length) save('users', [...existing, ...missing])
})()

// Expose reset helper in dev console: window.__resetMockDb()
if (import.meta.env.DEV) window.__resetMockDb = db.reset.bind(db)
