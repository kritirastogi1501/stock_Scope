// A lightweight anonymous identifier so a single browser's watchlist and
// saved reports can persist in Supabase without building a full auth
// system, per the "no complicated authentication" requirement. This id
// itself is just a UI-preference-like value (not app data), so keeping
// it in localStorage — rather than the database — is appropriate.

const STORAGE_KEY = 'stockscope_anon_user_id'

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `anon-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function getAnonUserId() {
  try {
    let id = localStorage.getItem(STORAGE_KEY)
    if (!id) {
      id = generateId()
      localStorage.setItem(STORAGE_KEY, id)
    }
    return id
  } catch {
    // localStorage unavailable (e.g. private browsing edge cases) —
    // fall back to a session-only id so the app still functions.
    return generateId()
  }
}
