import { supabase } from './supabase'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

function toNote(row) {
  return {
    id:         row.id,
    user_id:    row.user_id,
    title:      row.title     || '',
    body:       row.body      || '',
    colorIdx:   row.color_idx ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export const notepadService = {
  async getNotes(userId) {
    if (USE_MOCK) {
      try {
        const raw = localStorage.getItem(`notepad_${userId}`)
        return raw ? JSON.parse(raw) : []
      } catch { return [] }
    }
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    if (error) throw error
    return (data || []).map(toNote)
  },

  async createNote(userId, { title = '', body = '', colorIdx = 0 } = {}) {
    if (USE_MOCK) {
      return {
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        user_id: userId, title, body, colorIdx,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }
    const { data, error } = await supabase.from('notes')
      .insert({ user_id: userId, title, body, color_idx: colorIdx })
      .select().single()
    if (error) throw error
    return toNote(data)
  },

  async updateNote(id, { title, body, colorIdx } = {}) {
    if (USE_MOCK) return { id, title, body, colorIdx, updated_at: new Date().toISOString() }
    const patch = { updated_at: new Date().toISOString() }
    if (title    !== undefined) patch.title     = title
    if (body     !== undefined) patch.body      = body
    if (colorIdx !== undefined) patch.color_idx = colorIdx
    const { error } = await supabase.from('notes').update(patch).eq('id', id)
    if (error) throw error
    return { id, ...patch }
  },

  async deleteNote(id) {
    if (USE_MOCK) return
    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (error) throw error
  },

  async deleteAllNotes(userId) {
    if (USE_MOCK) return
    const { error } = await supabase.from('notes').delete().eq('user_id', userId)
    if (error) throw error
  },
}
