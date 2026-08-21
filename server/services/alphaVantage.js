// Alpha Vantage provider adapter.
//
// Why Alpha Vantage: it is a legitimate, documented, official API (no
// scraping of NSE/BSE) that explicitly supports Indian equities via the
// ".BSE" symbol suffix (e.g. "RELIANCE.BSE"), and offers quote,
// historical daily-close, and fundamental "OVERVIEW" endpoints on a
// free-tier API key — enough to cover this project's needs without a
// paid subscription. Its data for Indian markets is END-OF-DAY /
// DELAYED, not real-time — the app must always represent it as such.
//
// Known limitation: Alpha Vantage has no direct NIFTY/SENSEX index
// endpoints. Index-level data (Market Overview page) therefore falls
// back to explicitly-labelled demo data unless a different provider is
// configured for that piece. See routes/market.js.
//
// To swap providers later, reimplement the three functions below
// (fetchQuote, fetchDailySeries, fetchFundamentals) with the same
// return shapes and nothing else in the app needs to change.

const BASE_URL = 'https://www.alphavantage.co/query'

function apiKey() {
  const key = process.env.MARKET_API_KEY
  if (!key) throw new Error('MARKET_API_KEY is not configured on the server')
  return key
}

// Indian NSE tickers -> Alpha Vantage BSE symbols
const SYMBOL_MAP = {
  TCS: 'TCS.BSE',
  RELIANCE: 'RELIANCE.BSE',
  HDFCBANK: 'HDFCBANK.BSE',
  INFY: 'INFY.BSE',
  ICICIBANK: 'ICICIBANK.BSE',
  ITC: 'ITC.BSE',
  TATAMOTORS: 'TATAMOTORS.BSE',
  SBIN: 'SBIN.BSE',
  LT: 'LT.BSE',
  BEL: 'BEL.BSE',
}

export function resolveProviderSymbol(ticker) {
  return SYMBOL_MAP[ticker?.toUpperCase()] || null
}

async function callAlphaVantage(params) {
  const url = new URL(BASE_URL)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  url.searchParams.set('apikey', apiKey())

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Alpha Vantage HTTP ${res.status}`)
  const json = await res.json()

  if (json.Note) throw new Error(`Alpha Vantage rate limit: ${json.Note}`)
  if (json['Error Message']) throw new Error(`Alpha Vantage error: ${json['Error Message']}`)
  if (json.Information) throw new Error(`Alpha Vantage info/limit: ${json.Information}`)

  return json
}

function toNumberOrNull(v) {
  if (v === undefined || v === null || v === '' || v === 'None' || v === '-') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * Returns normalized: { price, change, changePct, fetchedAt }
 */
export async function fetchQuote(ticker) {
  const symbol = resolveProviderSymbol(ticker)
  if (!symbol) return null
  const json = await callAlphaVantage({ function: 'GLOBAL_QUOTE', symbol })
  const q = json['Global Quote'] || {}
  if (!q['05. price']) return null
  return {
    price: toNumberOrNull(q['05. price']),
    change: toNumberOrNull(q['09. change']),
    changePct: toNumberOrNull((q['10. change percent'] || '').replace('%', '')),
    week52High: null, // not provided by GLOBAL_QUOTE; comes from fundamentals
    week52Low: null,
    fetchedAt: new Date().toISOString(),
  }
}

/**
 * Returns normalized: [{ date: 'YYYY-MM-DD', close: number }], newest last
 */
export async function fetchDailySeries(ticker, { full = false } = {}) {
  const symbol = resolveProviderSymbol(ticker)
  if (!symbol) return []
  const json = await callAlphaVantage({
    function: 'TIME_SERIES_DAILY',
    symbol,
    outputsize: full ? 'full' : 'compact',
  })
  const series = json['Time Series (Daily)']
  if (!series) return []
  return Object.entries(series)
    .map(([date, row]) => ({ date, close: toNumberOrNull(row['4. close']) }))
    .filter((r) => r.close !== null)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
}

/**
 * Returns normalized fundamentals. Fields Alpha Vantage does not supply
 * (e.g. ROCE) are returned as null — the caller must render these as N/A,
 * never invent a value.
 */
export async function fetchFundamentals(ticker) {
  const symbol = resolveProviderSymbol(ticker)
  if (!symbol) return null
  const json = await callAlphaVantage({ function: 'OVERVIEW', symbol })
  if (!json || !json.Symbol) return null

  return {
    pe: toNumberOrNull(json.PERatio),
    pb: toNumberOrNull(json.PriceToBookRatio),
    eps: toNumberOrNull(json.EPS),
    roe: toNumberOrNull(json.ReturnOnEquityTTM) !== null ? toNumberOrNull(json.ReturnOnEquityTTM) * 100 : null,
    roce: null, // not available from this provider
    debtToEquity: null, // not available from this provider
    dividendYield: toNumberOrNull(json.DividendYield) !== null ? toNumberOrNull(json.DividendYield) * 100 : null,
    revenueGrowth: toNumberOrNull(json.QuarterlyRevenueGrowthYOY) !== null
      ? toNumberOrNull(json.QuarterlyRevenueGrowthYOY) * 100
      : null,
    profitGrowth: toNumberOrNull(json.QuarterlyEarningsGrowthYOY) !== null
      ? toNumberOrNull(json.QuarterlyEarningsGrowthYOY) * 100
      : null,
    operatingMargin: toNumberOrNull(json.OperatingMarginTTM) !== null
      ? toNumberOrNull(json.OperatingMarginTTM) * 100
      : null,
    netMargin: toNumberOrNull(json.ProfitMargin) !== null ? toNumberOrNull(json.ProfitMargin) * 100 : null,
    marketCapCr: toNumberOrNull(json.MarketCapitalization) !== null
      ? toNumberOrNull(json.MarketCapitalization) / 10000000 // paise/INR units -> crore
      : null,
    week52High: toNumberOrNull(json['52WeekHigh']),
    week52Low: toNumberOrNull(json['52WeekLow']),
    fetchedAt: new Date().toISOString(),
  }
}

export const PROVIDER_NAME = 'alpha_vantage'
export const PROVIDER_IS_DELAYED = true // Alpha Vantage Indian equities are end-of-day, not real-time
