// Very small, local, rule-based parser for natural-language screener queries.
// Recognises phrases like:
//   "ROE above 15%", "low debt", "positive profit growth",
//   "PE below 20", "dividend yield above 2%", "high growth", "market cap above 500000"
// This is intentionally simple/heuristic — it is not a general NLP engine.

const METRIC_ALIASES = {
  roe: 'roe',
  'return on equity': 'roe',
  roce: 'roce',
  'return on capital employed': 'roce',
  pe: 'pe',
  'p/e': 'pe',
  'price to earnings': 'pe',
  pb: 'pb',
  'p/b': 'pb',
  'debt to equity': 'debtToEquity',
  'debt/equity': 'debtToEquity',
  debt: 'debtToEquity',
  'dividend yield': 'dividendYield',
  'revenue growth': 'revenueGrowth',
  'profit growth': 'profitGrowth',
  'market cap': 'marketCapCr',
}

const DIRECTION_WORDS = {
  above: '>',
  over: '>',
  greater: '>',
  more: '>',
  high: '>',
  below: '<',
  under: '<',
  less: '<',
  low: '<',
  lower: '<',
}

/**
 * Parses a free-text query into an array of criteria:
 * { metric, operator, value, label, reason }
 */
export function parseNaturalQuery(query) {
  const criteria = []
  const text = query.toLowerCase()

  // Explicit "metric operator value" patterns, e.g. "roe above 15", "pe below 20%"
  const metricPattern = new RegExp(
    `(${Object.keys(METRIC_ALIASES).join('|')})\\s+(above|over|greater than|more than|below|under|less than)\\s+(\\d+(?:\\.\\d+)?)`,
    'gi'
  )
  let match
  while ((match = metricPattern.exec(text)) !== null) {
    const metricKey = METRIC_ALIASES[match[1].trim()]
    const dirWord = match[2].split(' ')[0]
    const operator = DIRECTION_WORDS[dirWord] || '>'
    const value = parseFloat(match[3])
    criteria.push({
      metric: metricKey,
      operator,
      value,
      reason: `${match[1]} ${operator === '>' ? 'above' : 'below'} ${value}`,
    })
  }

  // Qualitative shortcuts
  if (/low debt|debt[- ]free|no debt/.test(text)) {
    criteria.push({ metric: 'debtToEquity', operator: '<', value: 0.4, reason: 'Low debt (Debt/Equity below 0.4)' })
  }
  if (/positive profit growth|growing profit/.test(text)) {
    criteria.push({ metric: 'profitGrowth', operator: '>', value: 0, reason: 'Positive profit growth' })
  }
  if (/positive revenue growth|growing revenue/.test(text)) {
    criteria.push({ metric: 'revenueGrowth', operator: '>', value: 0, reason: 'Positive revenue growth' })
  }
  if (/high growth/.test(text)) {
    criteria.push({ metric: 'revenueGrowth', operator: '>', value: 10, reason: 'Revenue growth above 10%' })
  }
  if (/cheap|undervalued|low pe|low valuation/.test(text)) {
    criteria.push({ metric: 'pe', operator: '<', value: 20, reason: 'P/E below 20 (relatively inexpensive)' })
  }
  if (/high dividend|good dividend|income stock/.test(text)) {
    criteria.push({ metric: 'dividendYield', operator: '>', value: 1.5, reason: 'Dividend yield above 1.5%' })
  }
  if (/quality|strong fundamentals/.test(text)) {
    criteria.push({ metric: 'roe', operator: '>', value: 15, reason: 'ROE above 15%' })
  }

  // De-duplicate by metric+operator, keep the last (most specific) instance
  const seen = new Map()
  criteria.forEach((c) => seen.set(`${c.metric}-${c.operator}`, c))
  return Array.from(seen.values())
}

export function applyCriteria(stocks, criteria) {
  if (!criteria.length) return []
  return stocks
    .map((stock) => {
      const matched = criteria.filter((c) => {
        const v = stock[c.metric]
        if (v === undefined) return false
        return c.operator === '>' ? v > c.value : v < c.value
      })
      return { stock, matched, qualifies: matched.length === criteria.length }
    })
    .filter((r) => r.qualifies)
}
