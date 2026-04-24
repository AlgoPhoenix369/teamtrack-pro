import { supabase } from './supabase'
import { db } from './mockDb'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const savedAccountsService = {
  async getAccounts(user) {
    if (USE_MOCK) {
      if (user?.role === 'super_admin') return db.getSavedAccounts()
      return db.getSavedAccounts({ user_id: user?.id })
    }
    let q = supabase.from('saved_accounts').select('*').order('created_at', { ascending: false })
    if (user?.role !== 'super_admin') q = q.eq('user_id', user?.id)
    const { data, error } = await q
    if (error) throw error
    return data
  },

  async create(data) {
    if (USE_MOCK) return db.createSavedAccount(data)
    const { data: account, error } = await supabase.from('saved_accounts')
      .insert({ ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .select().single()
    if (error) throw error
    return account
  },

  async update(id, updates) {
    if (USE_MOCK) return db.updateSavedAccount(id, updates)
    const { data, error } = await supabase.from('saved_accounts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async remove(id) {
    if (USE_MOCK) { db.deleteSavedAccount(id); return }
    const { error } = await supabase.from('saved_accounts').delete().eq('id', id)
    if (error) throw error
  },
}
