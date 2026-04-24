import { useState, useEffect } from 'react'
import { presenceService } from '../services/presenceService'

// Re-checks online status every 15 s so the UI stays current.
export function useOnlineUsers() {
  const [onlineIds, setOnlineIds] = useState(() => presenceService.getOnlineIds())

  useEffect(() => {
    const refresh = () => setOnlineIds(presenceService.getOnlineIds())
    const id = setInterval(refresh, 15_000)
    return () => clearInterval(id)
  }, [])

  return {
    onlineIds,
    isOnline: (userId) => onlineIds.includes(userId),
  }
}
