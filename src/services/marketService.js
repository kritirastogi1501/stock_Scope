// Service abstraction for market/quote data.
//
// Data flow:
//   Alpha Vantage (provider) -> server/ backend (caches into Supabase) -> this service -> React components
//
// This service calls the backend API (VITE_API_BASE_URL) for the 10
// mapped Indian tickers. If the backend is unreachable, not configured,
// or a field is genuinely unsupported by the provider, it falls back to
// local demo data — always with an explicit `isDemo` / `source` flag so
// the UI can show real connection status rather than silently pretending
// demo data is live. Company master fields (name, sector, description)
// always come from local reference data — that's reference/master data,
// not something a quote provider supplies.
//
// Components should keep consuming `marketService` exactly as before;
// only the internals changed.

import { STOCKS, getStockByTicker, searchStocks } from '../data/stocks'
import { INDICES, SECTOR_SNAPSHOT, MARKET_META } from '../data/marketData'
import { generatePriceHistory, sliceRange } from '../utils/priceGen'

const API_BASE = import.meta.env.VITE_API_BASE_URL || null
const DEMO_LATENCY = 200

function delay(ms = DEMO_LATENCY) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function apiGet(path) {
  if (!API_BASE) throw new Error('VITE_API_BASE_URL not configured')
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Backend request failed (${res.status})`)
  }
  return res.json()
}

// Merges a live quote+fundamentals payload onto the local demo baseline.
// Any field the provider doesn't supply falls back to the demo reference
// value EXCEPT roce/debtToEquity, which this provider structurally never
// supplies — those are left null so the UI renders "N/A" instead of a
// fabricated number.
function mergeLiveStock(demoStock, quote, fundamentals) {
  const pick = (liveVal, demoVal) => (liveVal !== null && liveVal !== undefined ? liveVal : demoVal)
  return {
    ...demoStock,
    price: pick(quote?.price, demoStock.price),
    change: pick(quote?.change, demoStock.change),
    changePct: pick(quote?.changePct, demoStock.changePct),
    marketCapCr: pick(fundamentals?.marketCapCr ?? quote?.marketCapCr, demoStock.marketCapCr),
    pe: pick(fundamentals?.pe, demoStock.pe),
    pb: pick(fundamentals?.pb, demoStock.pb),
    eps: pick(fundamentals?.eps, demoStock.eps),
    roe: pick(fundamentals?.roe, demoStock.roe),
    roce: fundamentals ? fundamentals.roce : demoStock.roce, // null if live mode — provider doesn't supply this
    debtToEquity: fundamentals ? fundamentals.debtToEquity : demoStock.debtToEquity, // same
    dividendYield: pick(fundamentals?.dividendYield, demoStock.dividendYield),
    week52High: pick(fundamentals?.week52High ?? quote?.week52High, demoStock.week52High),
    week52Low: pick(fundamentals?.week52Low ?? quote?.week52Low, demoStock.week52Low),
    revenueGrowth: pick(fundamentals?.revenueGrowth, demoStock.revenueGrowth),
    profitGrowth: pick(fundamentals?.profitGrowth, demoStock.profitGrowth),
    operatingMargin: pick(fundamentals?.operatingMargin, demoStock.operatingMargin),
    netMargin: pick(fundamentals?.netMargin, demoStock.netMargin),
    _meta: {
      isDemo: false,
      source: quote?.source || fundamentals?.source || 'alpha_vantage',
      isDelayed: quote?.isDelayed ?? true,
      fetchedAt: quote?.fetchedAt || fundamentals?.fetchedAt || null,
      unsupportedFields: ['roce', 'debtToEquity'],
    },
  }
}

function withDemoMeta(stock) {
  return {
    ...stock,
    _meta: {
      isDemo: true,
      source: 'demo',
      isDelayed: true,
      fetchedAt: null,
      unsupportedFields: [],
    },
  }
}

async function fetchLiveStock(ticker) {
  const demoStock = getStockByTicker(ticker)
  if (!demoStock) return null
  const [quoteRes, fundamentalsRes] = await Promise.allSettled([
    apiGet(`/market/quote/${ticker}`),
    apiGet(`/market/fundamentals/${ticker}`),
  ])
  const quote = quoteRes.status === 'fulfilled' ? quoteRes.value : null
  const fundamentals = fundamentalsRes.status === 'fulfilled' ? fundamentalsRes.value : null
  if (!quote && !fundamentals) throw new Error('Backend returned no live data for this ticker')
  return mergeLiveStock(demoStock, quote, fundamentals)
}

export const marketService = {
  async getBackendStatus() {
    try {
      const status = await apiGet('/market/status')
      return { ...status, reachable: true }
    } catch (err) {
      return { reachable: false, error: err.message }
    }
  },

  async getIndices() {
    // Alpha Vantage (the configured provider) does not offer NIFTY/SENSEX
    // index data — see server/routes/market.js. This is reported honestly
    // rather than faked; the app falls back to clearly-labelled demo data.
    await delay()
    const withHistory = INDICES.map((idx) => ({
      ...idx,
      history: generatePriceHistory({
        seed: idx.seed,
        endPrice: idx.value,
        volatility: idx.volatility,
        trend: idx.trend,
        days: 90,
      }),
    }))
    return {
      data: withHistory,
      isDemo: true,
      note: 'Index-level data (NIFTY/SENSEX/NIFTY BANK/NIFTY IT) is not available from the connected provider on its free tier — shown as demo reference data.',
    }
  },

  async getSectorSnapshot() {
    await delay(120)
    return { data: SECTOR_SNAPSHOT, isDemo: true }
  },

  async getMarketMeta() {
    await delay(100)
    return { data: MARKET_META, isDemo: true }
  },

  async getMovers() {
    const { data: stocks } = await this.getAllStocks()
    const sorted = [...stocks].sort((a, b) => b.changePct - a.changePct)
    const gainers = sorted.filter((s) => s.changePct > 0).slice(0, 5)
    const losers = sorted
      .filter((s) => s.changePct < 0)
      .sort((a, b) => a.changePct - b.changePct)
      .slice(0, 5)
    return { data: { gainers, losers }, isDemo: !API_BASE }
  },

  // Fetches live data for every mapped ticker in parallel, falling back
  // per-stock to demo data if the live fetch fails for that ticker.
  async getAllStocks() {
    if (!API_BASE) {
      await delay()
      return { data: STOCKS.map(withDemoMeta), isDemo: true }
    }
    const results = await Promise.all(
      STOCKS.map(async (demoStock) => {
        try {
          const live = await fetchLiveStock(demoStock.ticker)
          return live || withDemoMeta(demoStock)
        } catch {
          return withDemoMeta(demoStock)
        }
      })
    )
    return { data: results, isDemo: false }
  },

  async search(query) {
    await delay(90)
    return { data: searchStocks(query), isDemo: true }
  },

  async getStock(ticker) {
    const demoStock = getStockByTicker(ticker)
    if (!demoStock) return { data: null, isDemo: true }
    if (!API_BASE) {
      await delay()
      return { data: withDemoMeta(demoStock), isDemo: true }
    }
    try {
      const live = await fetchLiveStock(ticker)
      if (!live) return { data: withDemoMeta(demoStock), isDemo: true }
      return { data: live, isDemo: false }
    } catch (err) {
      console.warn(`[marketService] Live fetch failed for ${ticker}, using demo data:`, err.message)
      return { data: withDemoMeta(demoStock), isDemo: true, fallbackReason: err.message }
    }
  },

  async getPriceHistory(ticker, range = '1Y') {
    const demoStock = getStockByTicker(ticker)
    if (!demoStock) return { data: [], isDemo: true }

    if (API_BASE) {
      try {
        const full = range === '1Y' || range === '5Y'
        const res = await apiGet(`/market/history/${ticker}?range=${full ? '5Y' : 'compact'}`)
        if (res.series && res.series.length) {
          const points = res.series.map((r) => ({ date: r.date, price: r.close }))
          const daysMap = { '1M': 30, '6M': 182, '1Y': 365, '5Y': 1825 }
          const n = daysMap[range] || 365
          return {
            data: points.slice(-n),
            isDemo: false,
            source: res.source,
            fetchedAt: res.fetchedAt,
          }
        }
      } catch (err) {
        console.warn(`[marketService] Live history fetch failed for ${ticker}, using demo data:`, err.message)
      }
    }

    await delay(180)
    const full = generatePriceHistory({
      seed: demoStock.seed,
      endPrice: demoStock.price,
      volatility: demoStock.volatility,
      trend: demoStock.trend,
      days: 1825,
    })
    return { data: sliceRange(full, range), isDemo: true }
  },
}
