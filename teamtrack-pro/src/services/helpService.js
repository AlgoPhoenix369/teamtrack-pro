import { supabase } from './supabase'
import { db } from './mockDb'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const SELECT = '*, from_user:users!from_user_id(id, name, role), to_user:users!to_user_id(id, name, role)'

// DB stores 'open'; pages expect 'pending'
function toShape(q) {
  if (!q) return null
  return { ...q, status: q.status === 'open' ? 'pending' : q.status }
}

export const helpService = {
  async getQueries(filters = {}) {
    if (USE_MOCK) return db.getHelpQueries(filters)
    let q = supabase.from('help_queries').select(SELECT).order('created_at', { ascending: false })
    if (filters.from_user_id) q = q.eq('from_user_id', filters.from_user_id)
    if (filters.to_user_id)   q = q.eq('to_user_id', filters.to_user_id)
    if (filters.status) q = q.eq('status', filters.status === 'pending' ? 'open' : filters.status)
    const { data, error } = await q
    if (error) throw error
    return (data || []).map(toShape)
  },

  async createQuery(data) {
    if (USE_MOCK) return db.createHelpQuery(data)
    const { data: item, error } = await supabase
      .from('help_queries')
      .insert({
        from_user_id: data.from_user_id,
        to_user_id:   data.to_user_id || null,
        question:     data.subject,
        subject:      data.subject,
        body:         data.message,
        category:     data.category || 'General',
        priority:     data.priority || 'medium',
        status:       'open',
        replies:      [],
      })
      .select(SELECT)
      .single()
    if (error) throw error
    return toShape(item)
  },

  async resolveQuery(id, resolvedBy, note) {
    if (USE_MOCK) return db.resolveHelpQuery(id, resolvedBy, note)
    const { data, error } = await supabase
      .from('help_queries')
      .update({
        status:          'resolved',
        resolved_by:     resolvedBy,
        resolved_at:     new Date().toISOString(),
        resolution_note: note,
        updated_at:      new Date().toISOString(),
      })
      .eq('id', id)
      .select(SELECT)
      .single()
    if (error) throw error
    return toShape(data)
  },

  async addReply(queryId, fromUserId, text) {
    if (USE_MOCK) return db.addQueryReply(queryId, fromUserId, text)
    const [{ data: userData }, { data: current }] = await Promise.all([
      supabase.from('users').select('id, name, role').eq('id', fromUserId).single(),
      supabase.from('help_queries').select('replies').eq('id', queryId).single(),
    ])
    if (!current) return null
    const reply = {
      id:          crypto.randomUUID(),
      from_user_id: fromUserId,
      from_user:   userData || { id: fromUserId, name: 'Unknown' },
      text,
      created_at:  new Date().toISOString(),
    }
    const replies = [...(current.replies || []), reply]
    const { data, error } = await supabase
      .from('help_queries')
      .update({ replies, updated_at: new Date().toISOString() })
      .eq('id', queryId)
      .select(SELECT)
      .single()
    if (error) throw error
    return { ...toShape(data), reply }
  },

  async deleteQuery(id) {
    if (USE_MOCK) { db.deleteHelpQuery(id); return }
    const { error } = await supabase.from('help_queries').delete().eq('id', id)
    if (error) throw error
  },

  async getUnresolvedCount(userId, isAdmin) {
    const queries = await this.getQueries(isAdmin ? {} : { from_user_id: userId })
    return queries.filter(q => q.status === 'pending').length
  },
}
