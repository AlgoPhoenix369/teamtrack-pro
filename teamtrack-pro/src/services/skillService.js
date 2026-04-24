import { db } from './mockDb'
import { supabase } from './supabase'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const skillService = {
  async getAll(user) {
    if (USE_MOCK) {
      if (user?.role === 'super_admin' || user?.role === 'view_admin') return db.getSkills()
      return db.getSkills({ user_id: user?.id })
    }
    let query = supabase.from('skills').select('*, user:users(id,name,role)')
    if (user?.role === 'tasker') query = query.eq('user_id', user.id)
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async create(data) {
    if (USE_MOCK) return db.createSkill(data)
    const { data: row, error } = await supabase.from('skills').insert(data).select().single()
    if (error) throw error
    return row
  },

  async update(id, updates) {
    if (USE_MOCK) return db.updateSkill(id, updates)
    const { data, error } = await supabase.from('skills').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async remove(id) {
    if (USE_MOCK) return db.deleteSkill(id)
    const { error } = await supabase.from('skills').delete().eq('id', id)
    if (error) throw error
  },
}
