import { supabase } from './supabase'
import { db } from './mockDb'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

function toShape(acc) {
  return {
    ...acc,
    platform: acc.label || '',
    password: acc.password_enc || '',
  }
}

function platformLabel(data) {
  return (data.platform === 'Other' ? data.custom_platform : data.platform) || data.label || ''
}

export const savedAccountsService = {
  async getAccounts(user) {
    if (USE_MOCK) {
      if (user?.role === 'super_admin') return db.getSavedAccounts()
      return db.getSavedAccounts({ user_id: user?.id })
    }
    let q = supabase.from('saved_accounts')
      .select('*, user:users(id,name,role)')
      .order('created_at', { ascending: false })
    if (user?.role !== 'super_admin') q = q.eq('user_id', user?.id)
    const { data, error } = await q
    if (error) throw error
    return (data || []).map(toShape)
  },

  async create(data) {
    if (USE_MOCK) return db.createSavedAccount(data)
    const label = platformLabel(data)
    if (!label) throw new Error('Platform name is required')
    const { data: account, error } = await supabase.from('saved_accounts')
      .insert({
        user_id:      data.user_id,
        label,
        username:     data.username              || null,
        email:        data.email                 || null,
        password_enc: data.password || data.password_enc || null,
        url:          data.url                   || null,
        notes:        data.notes                 || null,
      })
      .select().single()
    if (error) throw error
    return toShape(account)
  },

  async update(id, updates) {
    if (USE_MOCK) return db.updateSavedAccount(id, updates)
    const patch = { updated_at: new Date().toISOString() }
    if (updates.platform !== undefined || updates.label !== undefined)
      patch.label = updates.platform !== undefined ? platformLabel(updates) : updates.label
    if (updates.username     !== undefined) patch.username     = updates.username     || null
    if (updates.email        !== undefined) patch.email        = updates.email        || null
    if (updates.password     !== undefined) patch.password_enc = updates.password     || null
    if (updates.password_enc !== undefined) patch.password_enc = updates.password_enc || null
    if (updates.url          !== undefined) patch.url          = updates.url          || null
    if (updates.notes        !== undefined) patch.notes        = updates.notes        || null
    const { error } = await supabase.from('saved_accounts').update(patch).eq('id', id)
    if (error) throw error
    return toShape({ id, ...patch })
  },

  async remove(id) {
    if (USE_MOCK) { db.deleteSavedAccount(id); return }
    const { error } = await supabase.from('saved_accounts').delete().eq('id', id)
    if (error) throw error
  },
}
