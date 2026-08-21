export function formatINR(value, opts = {}) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: opts.decimals ?? 2,
    minimumFractionDigits: opts.decimals ?? 2,
  }).format(value)
}

export function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value)
}

// Market cap is stored in crore (₹ Cr). Convert to Lakh Cr for large values.
export function formatMarketCap(crValue) {
  if (crValue === null || crValue === undefined) return '—'
  if (crValue >= 100000) {
    return `₹${(crValue / 100000).toFixed(2)} Lakh Cr`
  }
  return `₹${formatNumber(crValue, 0)} Cr`
}

export function formatPercent(value, opts = {}) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const sign = value > 0 && opts.showSign !== false ? '+' : ''
  return `${sign}${value.toFixed(opts.decimals ?? 2)}%`
}

export function formatDate(dateStr, opts = {}) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: opts.short ? 'short' : 'long',
    year: 'numeric',
  })
}

// Null-safe numeric formatter for fields that may be genuinely unavailable
// from the connected data provider (e.g. ROCE, Debt/Equity are not part of
// Alpha Vantage's free-tier fundamentals). Never invents a value.
export function formatMetric(value, decimals = 1, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(value)) return 'N/A'
  return `${value.toFixed(decimals)}${suffix}`
}

export function classForChange(value) {
  if (value > 0) return 'text-gain'
  if (value < 0) return 'text-loss'
  return 'text-ink-700'
}
