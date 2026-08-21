// Frontend Supabase client — uses the ANON/public key only.
// Table access is governed by Row Level Security policies, not by
// keeping this key secret. The service-role key never appears here.

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null

if (!isSupabaseConfigured) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — database features (watchlist, ' +
      'saved reports) will fall back to local, browser-only storage.'
  )
}
