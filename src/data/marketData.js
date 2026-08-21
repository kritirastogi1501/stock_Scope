// Demo / simulated index-level data. NOT live market data.

export const INDICES = [
  {
    code: 'NIFTY50',
    name: 'NIFTY 50',
    value: 24812.35,
    change: 118.4,
    changePct: 0.48,
    seed: 9001,
    volatility: 0.007,
    trend: 0.00015,
  },
  {
    code: 'SENSEX',
    name: 'SENSEX',
    value: 81652.9,
    change: 356.2,
    changePct: 0.44,
    seed: 9002,
    volatility: 0.007,
    trend: 0.00015,
  },
  {
    code: 'NIFTYBANK',
    name: 'NIFTY BANK',
    value: 52104.6,
    change: -142.8,
    changePct: -0.27,
    seed: 9003,
    volatility: 0.009,
    trend: 0.0001,
  },
  {
    code: 'NIFTYIT',
    name: 'NIFTY IT',
    value: 39872.15,
    change: 421.3,
    changePct: 1.07,
    seed: 9004,
    volatility: 0.012,
    trend: 0.0002,
  },
]

export const SECTOR_SNAPSHOT = [
  { sector: 'IT Services', changePct: 1.12 },
  { sector: 'Banking', changePct: 0.31 },
  { sector: 'Energy', changePct: -0.44 },
  { sector: 'FMCG', changePct: 0.28 },
  { sector: 'Automobile', changePct: -1.18 },
  { sector: 'Infrastructure', changePct: 0.86 },
  { sector: 'Defence', changePct: 2.02 },
]

export const MARKET_META = {
  lastUpdated: 'Demo snapshot — not live',
  advanceDecline: { advances: 1642, declines: 1108, unchanged: 84 },
}
