// Server-side Supabase client using the SERVICE ROLE key.
// This key must never be sent to the browser — it bypasses Row Level
// Security and is only safe to use here, inside the backend process.

import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const hasSupabase = Boolean(url && serviceKey)

export const supabaseAdmin = hasSupabase
  ? createClient(url, serviceKey, { auth: { persistSession: false } })
  : null

if (!hasSupabase) {
  console.warn(
    '[supabaseAdmin] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — running without database caching. ' +
      'Provider data will still be fetched but not persisted.'
  )
}
