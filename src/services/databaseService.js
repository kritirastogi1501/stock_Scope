// Database service abstraction.
//
// Backed by Supabase (PostgreSQL) when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
// are configured. If the database is not configured OR a request fails
// (network issue, project paused, etc.), every function here falls back
// to localStorage so the app keeps working — the caller receives an
// `isDemo`/`source` flag so the UI can show a clear connection status
// rather than silently pretending everything is persisted remotely.

import { supabase, isSupabaseConfigured } from './supabaseClient'
import { getAnonUserId } from './anonUser'

const LOCAL_WATCHLIST_KEY = 'stockscope_watchlist_fallback_v1'
const LOCAL_REPORTS_KEY = 'stockscope_reports_fallback_v1'

function readLocal(key) {
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore — best effort only
  }
}

export const databaseService = {
  isConfigured: isSupabaseConfigured,

  // ---- Watchlist -------------------------------------------------------

  async getWatchlist() {
    if (isSupabaseConfigured) {
      try {
        const userId = getAnonUserId()
        const { data, error } = await supabase
          .from('watchlist')
          .select('ticker, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
        if (error) throw error
        return { tickers: data.map((r) => r.ticker), source: 'supabase' }
      } catch (err) {
        console.warn('[databaseService] getWatchlist falling back to local storage:', err.message)
        return { tickers: readLocal(LOCAL_WATCHLIST_KEY), source: 'local-fallback' }
      }
    }
    return { tickers: readLocal(LOCAL_WATCHLIST_KEY), source: 'local' }
  },

  async addToWatchlist(ticker) {
    if (isSupabaseConfigured) {
      try {
        const userId = getAnonUserId()
        const { error } = await supabase.from('watchlist').upsert(
          { user_id: userId, ticker },
          { onConflict: 'user_id,ticker' }
        )
        if (error) throw error
        return { success: true, source: 'supabase' }
      } catch (err) {
        console.warn('[databaseService] addToWatchlist falling back to local storage:', err.message)
      }
    }
    const current = readLocal(LOCAL_WATCHLIST_KEY)
    if (!current.includes(ticker)) writeLocal(LOCAL_WATCHLIST_KEY, [...current, ticker])
    return { success: true, source: 'local-fallback' }
  },

  async removeFromWatchlist(ticker) {
    if (isSupabaseConfigured) {
      try {
        const userId = getAnonUserId()
        const { error } = await supabase.from('watchlist').delete().eq('user_id', userId).eq('ticker', ticker)
        if (error) throw error
        return { success: true, source: 'supabase' }
      } catch (err) {
        console.warn('[databaseService] removeFromWatchlist falling back to local storage:', err.message)
      }
    }
    writeLocal(LOCAL_WATCHLIST_KEY, readLocal(LOCAL_WATCHLIST_KEY).filter((t) => t !== ticker))
    return { success: true, source: 'local-fallback' }
  },

  // ---- Research reports --------------------------------------------------

  async saveReport({ ticker, title, generatedAnalysis, dataSnapshot }) {
    const record = {
      id: crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`,
      ticker,
      title,
      generated_analysis: generatedAnalysis,
      data_snapshot: dataSnapshot,
      created_at: new Date().toISOString(),
    }

    if (isSupabaseConfigured) {
      try {
        const userId = getAnonUserId()
        const { data, error } = await supabase
          .from('research_reports')
          .insert({
            user_id: userId,
            ticker,
            title,
            generated_analysis: generatedAnalysis,
            data_snapshot: dataSnapshot,
          })
          .select()
          .single()
        if (error) throw error
        return { report: data, source: 'supabase' }
      } catch (err) {
        console.warn('[databaseService] saveReport falling back to local storage:', err.message)
      }
    }
    const current = readLocal(LOCAL_REPORTS_KEY)
    writeLocal(LOCAL_REPORTS_KEY, [record, ...current])
    return { report: record, source: 'local-fallback' }
  },

  async getReports(ticker) {
    if (isSupabaseConfigured) {
      try {
        const userId = getAnonUserId()
        let query = supabase
          .from('research_reports')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        if (ticker) query = query.eq('ticker', ticker)
        const { data, error } = await query
        if (error) throw error
        return { reports: data, source: 'supabase' }
      } catch (err) {
        console.warn('[databaseService] getReports falling back to local storage:', err.message)
      }
    }
    const all = readLocal(LOCAL_REPORTS_KEY)
    return { reports: ticker ? all.filter((r) => r.ticker === ticker) : all, source: 'local-fallback' }
  },

  async getReportById(id) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('research_reports').select('*').eq('id', id).maybeSingle()
        if (error) throw error
        if (data) return { report: data, source: 'supabase' }
      } catch (err) {
        console.warn('[databaseService] getReportById falling back to local storage:', err.message)
      }
    }
    const all = readLocal(LOCAL_REPORTS_KEY)
    return { report: all.find((r) => r.id === id) || null, source: 'local-fallback' }
  },
}
