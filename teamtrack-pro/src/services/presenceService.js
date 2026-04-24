const KEY    = 'mockdb_presence'
const TTL_MS = 90_000   // 90 s — covers 30 s heartbeat + generous lag

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export const presenceService = {
  heartbeat(userId) {
    if (!userId) return
    const p = load()
    p[userId] = new Date().toISOString()
    save(p)
  },

  clear(userId) {
    if (!userId) return
    const p = load()
    delete p[userId]
    save(p)
  },

  getOnlineIds() {
    const cutoff = Date.now() - TTL_MS
    return Object.entries(load())
      .filter(([, ts]) => new Date(ts).getTime() > cutoff)
      .map(([id]) => id)
  },

  isOnline(userId) {
    return this.getOnlineIds().includes(userId)
  },
}
