import { supabase } from './supabase'
import { db } from './mockDb'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const personaService = {
  async createPersona(data, createdBy) {
    if (USE_MOCK) return db.createPersona({ ...data, created_by: createdBy })
    const { data: p, error } = await supabase.from('personas')
      .insert({ ...data, created_by: createdBy }).select().single()
    if (error) throw error
    return p
  },

  async updatePersona(id, updates) {
    if (USE_MOCK) return db.updatePersona(id, updates)
    const { data, error } = await supabase.from('personas')
      .update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
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
      .select('*, users!assigned_to(name)').order('created_at', { ascending: false })
    if (error) throw error
    return data
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
