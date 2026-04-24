// Team anchor timezone for shared views (leaderboard "today", etc.)
export const TZ_KENYA = 'Africa/Nairobi'   // UTC+3 always (no DST)

// Returns the user's actual local timezone detected from their browser/OS.
// Falls back to Kenya time if detection fails.
export function getUserTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return tz || TZ_KENYA
  } catch {
    return TZ_KENYA
  }
}

// Returns 'YYYY-MM-DD' in the given timezone — used to determine the local "today".
export function todayInTz(tz) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())
}

// Formats an ISO timestamp as HH:MM in the given timezone.
export function fmtTimeInTz(iso, tz) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-US', {
    timeZone: tz, hour: '2-digit', minute: '2-digit',
  })
}

// Formats an ISO timestamp as "Jan 1, 09:30 AM" in the given timezone.
export function fmtDateTimeInTz(iso, tz) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    timeZone: tz, month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Returns the timezone abbreviation label to show in UI (e.g. "EAT" or "BST").
export function tzLabel(tz) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, timeZoneName: 'short',
    }).formatToParts(new Date())
    return parts.find(p => p.type === 'timeZoneName')?.value || tz
  } catch { return tz }
}
