// Deterministic pseudo-random price history generator.
// Uses a seeded LCG so the same stock always renders the same chart
// (no backend / no persistence needed for demo purposes).

function seededRandom(seed) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return function () {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/**
 * Generates `days` of daily close prices ending at `endPrice`, walking
 * backward with a random walk shaped by `volatility` and `trend`.
 */
export function generatePriceHistory({ seed, endPrice, volatility = 0.012, trend = 0.0001, days = 1825 }) {
  const rand = seededRandom(seed)
  const prices = new Array(days)
  prices[days - 1] = endPrice

  for (let i = days - 2; i >= 0; i--) {
    const noise = (rand() - 0.5) * 2 * volatility
    const drift = trend
    // walking backward: today = yesterday * (1 + drift + noise)
    // so yesterday = today / (1 + drift + noise)
    const factor = 1 + drift + noise
    prices[i] = prices[i + 1] / factor
  }

  const today = new Date()
  const series = prices.map((price, idx) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (days - 1 - idx))
    return {
      date: d.toISOString().slice(0, 10),
      price: Math.max(1, Number(price.toFixed(2))),
    }
  })
  return series
}

export function sliceRange(series, range) {
  const daysMap = { '1M': 30, '6M': 182, '1Y': 365, '5Y': 1825 }
  const n = daysMap[range] || 365
  return series.slice(-n)
}
