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
    const { data: row, error } = await supabase.from('skills').insert({
      user_id:     data.user_id,
      name:        data.name,
      category:    data.category    || 'Other',
      proficiency: data.proficiency || 'Intermediate',
      years_exp:   data.years_exp   ? Number(data.years_exp) : null,
      notes:       data.notes       || null,
    }).select().single()
    if (error) throw error
    return row
  },

  async update(id, updates) {
    if (USE_MOCK) return db.updateSkill(id, updates)
    const patch = { updated_at: new Date().toISOString() }
    if (updates.name        !== undefined) patch.name        = updates.name
    if (updates.category    !== undefined) patch.category    = updates.category    || 'Other'
    if (updates.proficiency !== undefined) patch.proficiency = updates.proficiency || 'Intermediate'
    if (updates.years_exp   !== undefined) patch.years_exp   = updates.years_exp   ? Number(updates.years_exp) : null
    if (updates.notes       !== undefined) patch.notes       = updates.notes       || null
    const { data, error } = await supabase.from('skills').update(patch).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async remove(id) {
    if (USE_MOCK) return db.deleteSkill(id)
    const { error } = await supabase.from('skills').delete().eq('id', id)
    if (error) throw error
  },
}
