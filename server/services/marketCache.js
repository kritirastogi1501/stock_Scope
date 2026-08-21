// Cache-first market data layer.
//
//   Request stock data
//         v
//   Check Supabase (is it fresh enough?)
//         v
//   fresh -> return cached row
//   stale/missing -> call provider -> normalize -> upsert into Supabase -> return
//
// This avoids hammering the provider's rate-limited free tier and keeps
// a persistent record even if the provider is temporarily unavailable.

import { supabaseAdmin, hasSupabase } from './supabaseAdmin.js'
import * as provider from './alphaVantage.js'

const QUOTE_TTL_MS = 15 * 60 * 1000 // 15 minutes
const FUNDAMENTALS_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const HISTORY_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours (daily granularity)

function isFresh(fetchedAt, ttlMs) {
  if (!fetchedAt) return false
  return Date.now() - new Date(fetchedAt).getTime() < ttlMs
}

async function getCachedQuote(ticker) {
  if (!hasSupabase) return null
  const { data, error } = await supabaseAdmin
    .from('market_prices')
    .select('*')
    .eq('ticker', ticker)
    .maybeSingle()
  if (error || !data) return null
  return data
}

async function upsertQuote(ticker, quote) {
  if (!hasSupabase) return
  await supabaseAdmin.from('market_prices').upsert({
    ticker,
    price: quote.price,
    change: quote.change,
    change_pct: quote.changePct,
    market_cap_cr: quote.marketCapCr ?? null,
    week52_high: quote.week52High ?? null,
    week52_low: quote.week52Low ?? null,
    source: provider.PROVIDER_NAME,
    is_delayed: provider.PROVIDER_IS_DELAYED,
    fetched_at: quote.fetchedAt || new Date().toISOString(),
  })
}

/**
 * Returns a normalized quote object with cache metadata:
 * { price, change, changePct, source, isDelayed, isDemo, fetchedAt }
 */
export async function getQuote(ticker) {
  const cached = await getCachedQuote(ticker)
  if (cached && isFresh(cached.fetched_at, QUOTE_TTL_MS)) {
    return {
      price: cached.price,
      change: cached.change,
      changePct: cached.change_pct,
      marketCapCr: cached.market_cap_cr,
      week52High: cached.week52_high,
      week52Low: cached.week52_low,
      source: cached.source,
      isDelayed: cached.is_delayed,
      isDemo: cached.source === 'demo',
      fetchedAt: cached.fetched_at,
      fromCache: true,
    }
  }

  try {
    const fresh = await provider.fetchQuote(ticker)
    if (!fresh) throw new Error('Provider returned no quote data')
    await upsertQuote(ticker, fresh)
    return {
      ...fresh,
      marketCapCr: cached?.market_cap_cr ?? null,
      week52High: cached?.week52_high ?? null,
      week52Low: cached?.week52_low ?? null,
      source: provider.PROVIDER_NAME,
      isDelayed: provider.PROVIDER_IS_DELAYED,
      isDemo: false,
      fromCache: false,
    }
  } catch (err) {
    if (cached) {
      // Provider failed but we have a stale cached row — better than nothing,
      // clearly flagged as stale via fetched_at for the frontend to display.
      return {
        price: cached.price,
        change: cached.change,
        changePct: cached.change_pct,
        marketCapCr: cached.market_cap_cr,
        week52High: cached.week52_high,
        week52Low: cached.week52_low,
        source: cached.source,
        isDelayed: true,
        isDemo: cached.source === 'demo',
        fetchedAt: cached.fetched_at,
        fromCache: true,
        stale: true,
      }
    }
    throw err
  }
}

async function getCachedFundamentals(ticker) {
  if (!hasSupabase) return null
  const { data, error } = await supabaseAdmin
    .from('company_fundamentals')
    .select('*')
    .eq('ticker', ticker)
    .maybeSingle()
  if (error || !data) return null
  return data
}

async function upsertFundamentals(ticker, f) {
  if (!hasSupabase) return
  await supabaseAdmin.from('company_fundamentals').upsert({
    ticker,
    pe: f.pe,
    pb: f.pb,
    eps: f.eps,
    roe: f.roe,
    roce: f.roce,
    debt_to_equity: f.debtToEquity,
    dividend_yield: f.dividendYield,
    revenue_growth: f.revenueGrowth,
    profit_growth: f.profitGrowth,
    operating_margin: f.operatingMargin,
    net_margin: f.netMargin,
    source: provider.PROVIDER_NAME,
    fetched_at: f.fetchedAt || new Date().toISOString(),
  })
  if (f.marketCapCr !== null || f.week52High !== null || f.week52Low !== null) {
    await supabaseAdmin.from('market_prices').update({
      market_cap_cr: f.marketCapCr,
      week52_high: f.week52High,
      week52_low: f.week52Low,
    }).eq('ticker', ticker)
  }
}

export async function getFundamentals(ticker) {
  const cached = await getCachedFundamentals(ticker)
  if (cached && isFresh(cached.fetched_at, FUNDAMENTALS_TTL_MS)) {
    return normalizeCachedFundamentals(cached, true)
  }

  try {
    const fresh = await provider.fetchFundamentals(ticker)
    if (!fresh) throw new Error('Provider returned no fundamentals data')
    await upsertFundamentals(ticker, fresh)
    return {
      pe: fresh.pe,
      pb: fresh.pb,
      eps: fresh.eps,
      roe: fresh.roe,
      roce: fresh.roce,
      debtToEquity: fresh.debtToEquity,
      dividendYield: fresh.dividendYield,
      revenueGrowth: fresh.revenueGrowth,
      profitGrowth: fresh.profitGrowth,
      operatingMargin: fresh.operatingMargin,
      netMargin: fresh.netMargin,
      marketCapCr: fresh.marketCapCr,
      week52High: fresh.week52High,
      week52Low: fresh.week52Low,
      source: provider.PROVIDER_NAME,
      isDemo: false,
      fetchedAt: fresh.fetchedAt,
      fromCache: false,
    }
  } catch (err) {
    if (cached) return normalizeCachedFundamentals(cached, true, true)
    throw err
  }
}

function normalizeCachedFundamentals(cached, fromCache, stale = false) {
  return {
    pe: cached.pe,
    pb: cached.pb,
    eps: cached.eps,
    roe: cached.roe,
    roce: cached.roce,
    debtToEquity: cached.debt_to_equity,
    dividendYield: cached.dividend_yield,
    revenueGrowth: cached.revenue_growth,
    profitGrowth: cached.profit_growth,
    operatingMargin: cached.operating_margin,
    netMargin: cached.net_margin,
    source: cached.source,
    isDemo: cached.source === 'demo',
    fetchedAt: cached.fetched_at,
    fromCache,
    stale,
  }
}

async function getCachedHistory(ticker) {
  if (!hasSupabase) return []
  const { data, error } = await supabaseAdmin
    .from('historical_prices')
    .select('trade_date, close, fetched_at')
    .eq('ticker', ticker)
    .order('trade_date', { ascending: true })
  if (error) return []
  return data || []
}

async function upsertHistory(ticker, series) {
  if (!hasSupabase || !series.length) return
  const rows = series.map((r) => ({
    ticker,
    trade_date: r.date,
    close: r.close,
    source: provider.PROVIDER_NAME,
    fetched_at: new Date().toISOString(),
  }))
  // Upsert in batches to stay well under request size limits
  const batchSize = 500
  for (let i = 0; i < rows.length; i += batchSize) {
    await supabaseAdmin.from('historical_prices').upsert(rows.slice(i, i + batchSize), {
      onConflict: 'ticker,trade_date',
    })
  }
}

/**
 * Returns { series: [{date, close}], source, isDemo, fetchedAt }
 * Only calls the provider if the most recent cached trading day is stale.
 */
export async function getHistory(ticker, { full = false } = {}) {
  const cached = await getCachedHistory(ticker)
  const latest = cached[cached.length - 1]

  if (latest && isFresh(latest.fetched_at, HISTORY_TTL_MS) && (!full || cached.length > 500)) {
    return {
      series: cached.map((r) => ({ date: r.trade_date, close: Number(r.close) })),
      source: 'cache',
      isDemo: false,
      fetchedAt: latest.fetched_at,
      fromCache: true,
    }
  }

  try {
    const fresh = await provider.fetchDailySeries(ticker, { full })
    if (!fresh.length) throw new Error('Provider returned no historical data')
    await upsertHistory(ticker, fresh)
    return {
      series: fresh,
      source: provider.PROVIDER_NAME,
      isDemo: false,
      fetchedAt: new Date().toISOString(),
      fromCache: false,
    }
  } catch (err) {
    if (cached.length) {
      return {
        series: cached.map((r) => ({ date: r.trade_date, close: Number(r.close) })),
        source: 'cache',
        isDemo: false,
        fetchedAt: latest?.fetched_at,
        fromCache: true,
        stale: true,
      }
    }
    throw err
  }
}
