import { supabase } from './supabase'
import { db } from './mockDb'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const personaService = {
  async createPersona(data, createdBy) {
    if (USE_MOCK) return db.createPersona({ ...data, created_by: createdBy })
    const { data: p, error } = await supabase.from('personas')
      .insert({
        full_name:    data.full_name,
        email:        data.email        || null,
        phone:        data.phone        || null,
        linkedin_url: data.linkedin_url || null,
        location:     data.location     || null,
        headline:     data.headline     || null,
        notes:        data.notes        || null,
        resume_url:   data.resume_url   || null,
        assigned_to:  data.assigned_to  || null,
        is_active:    data.is_active    ?? true,
        created_by:   createdBy,
      }).select().single()
    if (error) throw error
    return p
  },

  async updatePersona(id, updates) {
    if (USE_MOCK) return db.updatePersona(id, updates)
    const patch = { updated_at: new Date().toISOString() }
    if (updates.full_name    !== undefined) patch.full_name    = updates.full_name
    if (updates.email        !== undefined) patch.email        = updates.email        || null
    if (updates.phone        !== undefined) patch.phone        = updates.phone        || null
    if (updates.linkedin_url !== undefined) patch.linkedin_url = updates.linkedin_url || null
    if (updates.location     !== undefined) patch.location     = updates.location     || null
    if (updates.headline     !== undefined) patch.headline     = updates.headline     || null
    if (updates.notes        !== undefined) patch.notes        = updates.notes        || null
    if (updates.resume_url   !== undefined) patch.resume_url   = updates.resume_url   || null
    if (updates.assigned_to  !== undefined) patch.assigned_to  = updates.assigned_to  || null
    if (updates.is_active    !== undefined) patch.is_active    = updates.is_active
    const { data, error } = await supabase.from('personas')
      .update(patch).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async deletePersona(id) {
    if (USE_MOCK) { db.deletePersona(id); return }
    const { error } = await supabase.from('personas').delete().eq('id', id)
    if (error) throw error
  },

  async getAllPersonas() {
    if (USE_MOCK) return db.getPersonas()
    const { data, error } = await supabase.from('personas')
      .select('*, assignee:users!assigned_to(id,name), creator:users!created_by(id,name)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getAllPersonasFlat() {
    if (USE_MOCK) return db.getPersonas()
    const { data, error } = await supabase.from('personas')
      .select('id,full_name,email,assigned_to,is_active')
      .eq('is_active', true)
      .order('full_name', { ascending: true })
    if (error) throw error
    return data || []
  },

  async getPersonasByUser(userId) {
    if (USE_MOCK) return db.getPersonas({ assigned_to: userId, is_active: true })
    const { data, error } = await supabase.from('personas').select('*')
      .eq('assigned_to', userId).eq('is_active', true).order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async assignPersona(personaId, userId) {
    if (USE_MOCK) return db.updatePersona(personaId, { assigned_to: userId })
    const { data, error } = await supabase.from('personas')
      .update({ assigned_to: userId }).eq('id', personaId).select().single()
    if (error) throw error
    return data
  },

  async uploadResume(file, personaId) {
    if (USE_MOCK) return URL.createObjectURL(file) // local blob URL in dev
    const path = `resumes/${personaId}/${file.name}`
    const { error } = await supabase.storage.from('persona-files').upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('persona-files').getPublicUrl(path)
    return data.publicUrl
  },
}
