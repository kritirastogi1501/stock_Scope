// AI research service abstraction.
//
// IMPORTANT: This currently generates analysis locally from structured
// fundamental data using simple rule-based heuristics — it does NOT call
// a language model. The function signatures and return shapes are
// designed so a future implementation can swap the internals for a real
// LLM call (e.g. via the Anthropic API) without changing any caller.
//
// To connect a real model: replace the body of `generateResearch` with
// a call to your backend/LLM endpoint that receives the same `stock`
// object and returns JSON matching the shape documented below.

const SIMULATED_LATENCY = 550

function delay(ms = SIMULATED_LATENCY) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function clampScore(v) {
  return Math.max(0, Math.min(100, Math.round(v)))
}

// --- Scoring sub-models -----------------------------------------------

function scoreGrowth(stock) {
  // Weighted on revenue + profit growth
  const rev = clampScore(50 + stock.revenueGrowth * 3)
  const profit = clampScore(50 + stock.profitGrowth * 2.5)
  return clampScore(rev * 0.5 + profit * 0.5)
}

function scoreProfitability(stock) {
  const roe = clampScore(stock.roe * 2.2)
  const margin = clampScore(stock.netMargin * 3)
  return clampScore(roe * 0.6 + margin * 0.4)
}

function scoreFinancialHealth(stock) {
  // Lower debt/equity is better. 0 = excellent, 1.5+ = weak.
  // roce/debtToEquity can be null when live data is connected (this
  // provider doesn't supply them) — never fabricate a value for a
  // missing input; instead compute from whichever inputs are present.
  const hasDE = stock.debtToEquity !== null && stock.debtToEquity !== undefined
  const hasROCE = stock.roce !== null && stock.roce !== undefined
  const deScore = hasDE ? clampScore(100 - stock.debtToEquity * 55) : null
  const roceScore = hasROCE ? clampScore(stock.roce * 2) : null

  if (deScore === null && roceScore === null) return null
  if (deScore === null) return roceScore
  if (roceScore === null) return deScore
  return clampScore(deScore * 0.55 + roceScore * 0.45)
}

function scoreValuation(stock) {
  // Lower PE relative to typical Indian large-cap band (~15-35) scores higher.
  // This is a simple heuristic, not a DCF or intrinsic value model.
  const peScore = clampScore(100 - (stock.pe - 12) * 2.2)
  const pbScore = clampScore(100 - (stock.pb - 2) * 6)
  return clampScore(peScore * 0.6 + pbScore * 0.4)
}

function scoreStability(stock) {
  // Proxy: lower volatility + closeness to 52w high = more stable trend
  const rangePos = (stock.price - stock.week52Low) / (stock.week52High - stock.week52Low || 1)
  const rangeScore = clampScore(rangePos * 100)
  const volScore = clampScore(100 - stock.volatility * 3500)
  return clampScore(rangeScore * 0.4 + volScore * 0.6)
}

const BASE_WEIGHTS = { growth: 0.25, profitability: 0.25, financialHealth: 0.2, valuation: 0.15, stability: 0.15 }

export function computeResearchScore(stock) {
  const rawBreakdown = {
    growth: scoreGrowth(stock),
    profitability: scoreProfitability(stock),
    financialHealth: scoreFinancialHealth(stock), // may be null — see scoreFinancialHealth
    valuation: scoreValuation(stock),
    stability: scoreStability(stock),
  }

  // If a component's inputs are entirely unavailable (e.g. financialHealth
  // when the live provider supplies neither ROCE nor Debt/Equity), drop it
  // from the score rather than fabricating a number, and redistribute its
  // weight proportionally across the remaining components.
  const available = Object.entries(rawBreakdown).filter(([, v]) => v !== null)
  const availableWeightSum = available.reduce((sum, [k]) => sum + BASE_WEIGHTS[k], 0)
  const overall = clampScore(
    available.reduce((sum, [k, v]) => sum + v * (BASE_WEIGHTS[k] / availableWeightSum), 0)
  )

  // Breakdown shown in the UI keeps the null so the score panel can
  // render "N/A" for that dimension rather than a fabricated bar.
  return { overall, breakdown: rawBreakdown, partial: available.length < Object.keys(rawBreakdown).length }
}

// --- Narrative generation ----------------------------------------------

function businessSnapshot(stock) {
  return `${stock.name} (${stock.ticker}) operates in the ${stock.sector} sector. ${stock.description} It currently trades at ${stock.pe.toFixed(1)}x trailing earnings with a return on equity of ${stock.roe.toFixed(1)}%.`
}

function whatLooksStrong(stock) {
  const points = []
  if (stock.roe > 18) points.push(`Strong return on equity of ${stock.roe.toFixed(1)}%, indicating efficient use of shareholder capital.`)
  if (stock.revenueGrowth > 10) points.push(`Healthy revenue growth of ${stock.revenueGrowth.toFixed(1)}% year-on-year.`)
  if (stock.profitGrowth > 8) points.push(`Profit growth of ${stock.profitGrowth.toFixed(1)}% outpaces many sector peers.`)
  if (stock.debtToEquity < 0.3) points.push(`Low debt-to-equity of ${stock.debtToEquity.toFixed(2)} gives balance-sheet flexibility.`)
  if (stock.netMargin > 18) points.push(`Wide net margin of ${stock.netMargin.toFixed(1)}% reflects strong pricing power or cost control.`)
  if (stock.dividendYield > 1.5) points.push(`Dividend yield of ${stock.dividendYield.toFixed(1)}% adds a income-return component for holders.`)
  if (points.length === 0) points.push('No standout strengths detected against current thresholds — fundamentals are broadly in line with sector norms.')
  return points.slice(0, 4)
}

function whatNeedsAttention(stock) {
  const points = []
  if (stock.debtToEquity > 0.7) points.push(`Debt-to-equity of ${stock.debtToEquity.toFixed(2)} is on the higher side and warrants monitoring interest costs.`)
  if (stock.profitGrowth < 0) points.push(`Profit growth is negative (${stock.profitGrowth.toFixed(1)}%), suggesting near-term earnings pressure.`)
  if (stock.pe > 35) points.push(`At ${stock.pe.toFixed(1)}x earnings, valuation is rich relative to historical Indian large-cap averages.`)
  if (stock.revenueGrowth < 5) points.push(`Revenue growth of ${stock.revenueGrowth.toFixed(1)}% is modest and should be tracked against sector peers.`)
  if (stock.roe < 12) points.push(`Return on equity of ${stock.roe.toFixed(1)}% is below the levels typically seen in quality compounders.`)
  const rangePos = (stock.price - stock.week52Low) / (stock.week52High - stock.week52Low || 1)
  if (rangePos < 0.25) points.push('Stock is trading closer to its 52-week low, reflecting recent weakness or negative sentiment.')
  if (points.length === 0) points.push('No major red flags detected against current thresholds, though valuation should still be assessed independently.')
  return points.slice(0, 4)
}

function bullCase(stock) {
  const drivers = []
  if (stock.sector === 'IT Services') drivers.push('a recovery in discretionary technology spending and AI-led deal wins')
  if (stock.sector === 'Banking') drivers.push('healthy credit growth and improving asset quality across the loan book')
  if (stock.sector === 'Defence') drivers.push('continued government push for indigenisation and a robust order book')
  if (stock.sector === 'Infrastructure') drivers.push('sustained capex cycle and strong order inflows')
  if (stock.sector === 'Energy') drivers.push('diversification into new energy and consumer businesses')
  if (stock.sector === 'FMCG') drivers.push('premiumisation trends and steady rural demand recovery')
  if (stock.sector === 'Automobile') drivers.push('a recovery in volumes and improving product mix')
  const driverText = drivers[0] || 'continued execution on its core strategy'
  return `If ${driverText} plays out as expected, combined with ${stock.roe > 15 ? 'its already strong return profile' : 'margin improvement over coming quarters'}, ${stock.name} could see multiple expansion and earnings upgrades from current levels.`
}

function bearCase(stock) {
  const risks = []
  if (stock.sector === 'IT Services') risks.push('a slowdown in global technology budgets or client-specific cutbacks')
  if (stock.sector === 'Banking') risks.push('asset quality deterioration in a rising rate or slowing-growth environment')
  if (stock.sector === 'Energy') risks.push('volatile crude prices compressing refining and petrochemical margins')
  if (stock.sector === 'Automobile') risks.push('input cost inflation or a slower-than-expected demand recovery')
  if (stock.sector === 'FMCG') risks.push('weak rural demand or intensifying competition on pricing')
  if (stock.sector === 'Infrastructure') risks.push('execution delays or working-capital stress on large projects')
  if (stock.sector === 'Defence') risks.push('order execution delays or budget allocation changes')
  const riskText = risks[0] || 'broader macro headwinds affecting the sector'
  return `A pullback scenario could emerge from ${riskText}, particularly if combined with ${stock.pe > 28 ? 'the current premium valuation leaving little room for disappointment' : 'a broader market de-rating'}.`
}

function keyRisks(stock) {
  const risks = [
    `Sector-wide cyclicality in ${stock.sector} can affect near-term earnings visibility.`,
  ]
  if (stock.debtToEquity > 0.5) risks.push('Elevated leverage increases sensitivity to interest rate movements.')
  if (stock.pe > 30) risks.push('Premium valuation leaves limited margin of safety if growth disappoints.')
  risks.push('Regulatory or policy changes specific to the sector could alter the earnings outlook.')
  risks.push('Broader market volatility and macro factors (rates, currency, global growth) remain outside company control.')
  return risks.slice(0, 4)
}

function whatToWatch(stock) {
  return [
    `Next quarterly results for continuation of ${stock.revenueGrowth > 8 ? 'current growth momentum' : 'a growth recovery'}.`,
    `Trend in ${stock.sector === 'Banking' ? 'asset quality and net interest margin' : 'operating margin'} over coming quarters.`,
    'Management commentary on demand outlook and capital allocation plans.',
    `Movement relative to its 52-week range (₹${stock.week52Low} – ₹${stock.week52High}).`,
  ]
}

export const aiService = {
  /**
   * Generates a full research package for a stock.
   * Return shape is stable and designed for a future LLM swap.
   */
  async generateResearch(stock) {
    await delay()
    if (!stock) return { data: null, isDemo: true }
    const score = computeResearchScore(stock)
    const data = {
      businessSnapshot: businessSnapshot(stock),
      strengths: whatLooksStrong(stock),
      attention: whatNeedsAttention(stock),
      bullCase: bullCase(stock),
      bearCase: bearCase(stock),
      risks: keyRisks(stock),
      watchList: whatToWatch(stock),
      score,
      disclaimer:
        'This analysis is generated from structured fundamental data using rule-based heuristics for research and educational purposes only. It is not investment advice or a buy/sell recommendation.',
    }
    return { data, isDemo: true }
  },

  /**
   * Generates a simplified, non-technical explanation for client conversations.
   */
  async generateClientExplanation(stock) {
    await delay(400)
    if (!stock) return { data: '', isDemo: true }
    const trendWord = stock.changePct >= 0 ? 'up' : 'down'
    const healthWord = stock.debtToEquity < 0.4 ? 'a healthy, low-debt balance sheet' : 'moderate borrowing levels that are worth keeping an eye on'
    const growthWord = stock.profitGrowth > 5 ? 'growing profits' : 'profits that have come under some pressure recently'
    const text = `${stock.name} is a ${stock.sector.toLowerCase()} company and one of the well-known names in the Indian stock market. Its share price is currently ₹${stock.price.toFixed(2)}, ${trendWord} for the day. In simple terms, the company has ${healthWord} and has been showing ${growthWord} lately. Like any stock, its price can go up or down based on company performance and overall market conditions, so it's best viewed as part of a diversified, long-term plan rather than a short-term bet.`
    return { data: text, isDemo: true }
  },
}
