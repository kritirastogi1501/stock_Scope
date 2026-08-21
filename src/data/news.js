// Demo / simulated developments feed. NOT a live news API.
// category: 'Earnings' | 'Corporate Action' | 'Regulatory' | 'Sector' | 'Management' | 'Order Win'
// importance: 'High' | 'Medium' | 'Low'
// impact: 'Positive' | 'Negative' | 'Neutral'

export const NEWS = {
  TCS: [
    { date: '2026-08-10', headline: 'Q1 net profit rises 6% YoY, beats street estimates on deal wins', category: 'Earnings', importance: 'High', impact: 'Positive' },
    { date: '2026-07-22', headline: 'Announces $1.2B multi-year deal with European retail major', category: 'Order Win', importance: 'High', impact: 'Positive' },
    { date: '2026-06-30', headline: 'Board approves ₹18/share interim dividend', category: 'Corporate Action', importance: 'Medium', impact: 'Positive' },
    { date: '2026-05-14', headline: 'Attrition rate rises to 14.2%, management flags wage pressure', category: 'Management', importance: 'Medium', impact: 'Negative' },
  ],
  RELIANCE: [
    { date: '2026-08-05', headline: 'Jio adds 4.1 million subscribers in the quarter', category: 'Earnings', importance: 'High', impact: 'Positive' },
    { date: '2026-07-18', headline: 'Retail arm to raise $2B via minority stake sale, reports suggest', category: 'Corporate Action', importance: 'Medium', impact: 'Positive' },
    { date: '2026-06-25', headline: 'Refining margins compress amid volatile crude prices', category: 'Sector', importance: 'Medium', impact: 'Negative' },
    { date: '2026-05-30', headline: 'New energy giga-factory construction on track for FY27 launch', category: 'Corporate Action', importance: 'High', impact: 'Positive' },
  ],
  HDFCBANK: [
    { date: '2026-08-12', headline: 'Net interest margin steady at 3.4% despite rate cycle pressure', category: 'Earnings', importance: 'High', impact: 'Neutral' },
    { date: '2026-07-20', headline: 'RBI clears additional stake increase in subsidiary NBFC', category: 'Regulatory', importance: 'Medium', impact: 'Positive' },
    { date: '2026-06-15', headline: 'Gross NPA improves to 1.24% from 1.31% sequentially', category: 'Earnings', importance: 'Medium', impact: 'Positive' },
  ],
  INFY: [
    { date: '2026-08-08', headline: 'Raises FY27 revenue growth guidance to 6-8% in constant currency', category: 'Earnings', importance: 'High', impact: 'Positive' },
    { date: '2026-07-25', headline: 'Wins large AI-led transformation deal from US healthcare client', category: 'Order Win', importance: 'High', impact: 'Positive' },
    { date: '2026-06-10', headline: 'Announces ₹9,300 crore share buyback', category: 'Corporate Action', importance: 'High', impact: 'Positive' },
  ],
  ICICIBANK: [
    { date: '2026-08-14', headline: 'Retail loan book grows 19% YoY, credit costs remain benign', category: 'Earnings', importance: 'High', impact: 'Positive' },
    { date: '2026-07-11', headline: 'Announces leadership transition in digital banking vertical', category: 'Management', importance: 'Low', impact: 'Neutral' },
    { date: '2026-06-02', headline: 'RBI imposes minor penalty for KYC process lapses', category: 'Regulatory', importance: 'Low', impact: 'Negative' },
  ],
  ITC: [
    { date: '2026-08-01', headline: 'FMCG-Others segment margin expands 140bps on premiumisation', category: 'Earnings', importance: 'Medium', impact: 'Positive' },
    { date: '2026-07-05', headline: 'Hotels business demerger scheme completes final formalities', category: 'Corporate Action', importance: 'High', impact: 'Positive' },
    { date: '2026-05-20', headline: 'Cigarette volume growth moderates amid tax uncertainty', category: 'Sector', importance: 'Medium', impact: 'Negative' },
  ],
  TATAMOTORS: [
    { date: '2026-08-09', headline: 'JLR volumes decline 8% amid weak China demand', category: 'Earnings', importance: 'High', impact: 'Negative' },
    { date: '2026-07-15', headline: 'Domestic EV market share slips as competition intensifies', category: 'Sector', importance: 'Medium', impact: 'Negative' },
    { date: '2026-06-18', headline: 'Commercial vehicle division reports strongest quarter in 3 years', category: 'Earnings', importance: 'Medium', impact: 'Positive' },
  ],
  SBIN: [
    { date: '2026-08-13', headline: 'Advances growth at 14%, asset quality continues to improve', category: 'Earnings', importance: 'High', impact: 'Positive' },
    { date: '2026-07-08', headline: 'Board approves capital raise plan of up to ₹25,000 crore', category: 'Corporate Action', importance: 'Medium', impact: 'Neutral' },
  ],
  LT: [
    { date: '2026-08-06', headline: 'Order inflow at record high on strong infra and defence pipeline', category: 'Order Win', importance: 'High', impact: 'Positive' },
    { date: '2026-07-02', headline: 'Wins large international hydrocarbon EPC contract in Middle East', category: 'Order Win', importance: 'High', impact: 'Positive' },
    { date: '2026-05-28', headline: 'Working capital cycle elongates, management flags execution delays', category: 'Earnings', importance: 'Medium', impact: 'Negative' },
  ],
  BEL: [
    { date: '2026-08-11', headline: 'Order book crosses ₹75,000 crore on fresh defence contracts', category: 'Order Win', importance: 'High', impact: 'Positive' },
    { date: '2026-07-14', headline: 'Q1 margins expand on higher-value indigenous content', category: 'Earnings', importance: 'Medium', impact: 'Positive' },
    { date: '2026-06-05', headline: 'Government reiterates push for defence indigenisation, sector tailwind', category: 'Sector', importance: 'Medium', impact: 'Positive' },
  ],
}

export const getNewsForTicker = (ticker) => NEWS[ticker?.toUpperCase()] || []

export const getAllNews = () => {
  const all = []
  Object.entries(NEWS).forEach(([ticker, items]) => {
    items.forEach((item) => all.push({ ...item, ticker }))
  })
  return all.sort((a, b) => new Date(b.date) - new Date(a.date))
}
