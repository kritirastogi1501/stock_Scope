import express from 'express'
import * as cache from '../services/marketCache.js'
import { resolveProviderSymbol } from '../services/alphaVantage.js'

export const marketRouter = express.Router()

const SUPPORTED_TICKERS = ['TCS', 'RELIANCE', 'HDFCBANK', 'INFY', 'ICICIBANK', 'ITC', 'TATAMOTORS', 'SBIN', 'LT', 'BEL']

marketRouter.get('/status', (req, res) => {
  res.json({
    provider: 'alpha_vantage',
    providerConfigured: Boolean(process.env.MARKET_API_KEY),
    databaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    supportedTickers: SUPPORTED_TICKERS,
    isDelayed: true,
    note: 'Indian equity data is end-of-day / delayed via Alpha Vantage, not real-time. Index-level data (NIFTY/SENSEX) is not covered by this provider.',
  })
})

marketRouter.get('/quote/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase()
  if (!resolveProviderSymbol(ticker)) {
    return res.status(404).json({ error: `No provider mapping for ticker ${ticker}` })
  }
  try {
    const quote = await cache.getQuote(ticker)
    res.json({ ticker, ...quote })
  } catch (err) {
    res.status(502).json({ error: err.message, ticker })
  }
})

marketRouter.get('/fundamentals/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase()
  if (!resolveProviderSymbol(ticker)) {
    return res.status(404).json({ error: `No provider mapping for ticker ${ticker}` })
  }
  try {
    const fundamentals = await cache.getFundamentals(ticker)
    res.json({ ticker, ...fundamentals })
  } catch (err) {
    res.status(502).json({ error: err.message, ticker })
  }
})

marketRouter.get('/history/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase()
  const full = req.query.range === '5Y'
  if (!resolveProviderSymbol(ticker)) {
    return res.status(404).json({ error: `No provider mapping for ticker ${ticker}` })
  }
  try {
    const history = await cache.getHistory(ticker, { full })
    res.json({ ticker, ...history })
  } catch (err) {
    res.status(502).json({ error: err.message, ticker })
  }
})

// Indices (NIFTY 50 / SENSEX / NIFTY BANK / NIFTY IT): Alpha Vantage does
// not provide official NSE index data. Rather than fabricate or scrape,
// this endpoint reports that clearly so the frontend can fall back to
// clearly-labelled demo data instead of pretending it's live.
marketRouter.get('/indices', async (req, res) => {
  res.json({
    supported: false,
    reason:
      'The configured provider (Alpha Vantage) does not offer official NIFTY/SENSEX index data on its free tier. Connect an index-data-capable provider to enable this.',
  })
})
