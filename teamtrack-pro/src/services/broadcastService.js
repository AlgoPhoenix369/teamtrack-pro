import { supabase } from './supabase'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const CHANNEL = 'taskoenix-refresh'

// Supabase broadcast requires the channel to be subscribed (joined) before
// .send() works. Keep one persistent subscribed channel for outbound signals.
let _ch = null
function getSenderChannel() {
  if (!_ch) {
    _ch = supabase.channel(CHANNEL)
    _ch.subscribe()
  }
  return _ch
}

export function broadcastRefresh(targetUserId) {
  if (USE_MOCK || !targetUserId) return
  try {
    getSenderChannel().send({
      type: 'broadcast', event: 'refresh', payload: { target: targetUserId },
    })
  } catch {}
}
