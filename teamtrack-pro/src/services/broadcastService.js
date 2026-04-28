import { supabase } from './supabase'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const CHANNEL = 'taskoenix-refresh'

// Fire-and-forget refresh signal to a specific user.
// Works on Supabase free tier — uses broadcast (pub/sub), not postgres_changes.
export function broadcastRefresh(targetUserId) {
  if (USE_MOCK || !targetUserId) return
  supabase.channel(CHANNEL)
    .send({ type: 'broadcast', event: 'refresh', payload: { target: targetUserId } })
    .catch(() => {})
}
