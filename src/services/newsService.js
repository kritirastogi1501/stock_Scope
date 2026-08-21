// News/developments service abstraction — backed by local demo data.
// Swap internals with a real news API integration later.

import { getNewsForTicker, getAllNews } from '../data/news'

const SIMULATED_LATENCY = 200

function delay(ms = SIMULATED_LATENCY) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function whyItMatters(item) {
  const impactPhrase =
    item.impact === 'Positive'
      ? 'this is likely to be viewed favourably by the market and could support sentiment'
      : item.impact === 'Negative'
      ? 'this could weigh on near-term sentiment and is worth monitoring'
      : 'this is largely informational and unlikely to move the stock materially on its own'
  const categoryPhrase =
    {
      Earnings: 'As a results-related update, it directly affects visibility into the company\u2019s financial trajectory.',
      'Corporate Action': 'Corporate actions like this can affect shareholder value or capital structure.',
      Regulatory: 'Regulatory developments can carry compliance or reputational implications.',
      Sector: 'This reflects a broader sector trend that may affect multiple peers, not just this company.',
      Management: 'Management-related updates can signal shifts in strategy or execution capability.',
      'Order Win': 'New order wins add to revenue visibility over the coming quarters.',
    }[item.category] || 'This is a notable company-specific development.'
  return `${categoryPhrase} Overall, ${impactPhrase}.`
}

export const newsService = {
  async getDevelopments(ticker) {
    await delay()
    const items = getNewsForTicker(ticker).map((item) => ({
      ...item,
      whyItMatters: whyItMatters(item),
    }))
    return { data: items, isDemo: true }
  },

  async getAllDevelopments() {
    await delay()
    const items = getAllNews().map((item) => ({
      ...item,
      whyItMatters: whyItMatters(item),
    }))
    return { data: items, isDemo: true }
  },
}
