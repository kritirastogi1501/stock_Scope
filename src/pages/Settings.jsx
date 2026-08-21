import { Database, Newspaper, Sparkles, Info } from 'lucide-react'
import Panel from '../components/Panel'
import Badge from '../components/Badge'

const INTEGRATIONS = [
  {
    icon: Database,
    name: 'Market Data',
    status: 'Demo Data',
    description:
      'Prices, fundamentals and historical charts are currently simulated locally. Connect a market data vendor (e.g. NSE/BSE feed, a licensed data provider) by implementing the marketService interface with real API calls.',
  },
  {
    icon: Sparkles,
    name: 'AI Research Engine',
    status: 'Rule-Based (Local)',
    description:
      'Research summaries, bull/bear cases and the fundamental score are generated with local heuristics from structured data — no LLM call is made. Swap the aiService internals for a real LLM/API call to enable generative analysis.',
  },
  {
    icon: Newspaper,
    name: 'News & Developments',
    status: 'Demo Data',
    description:
      'Company developments shown are static demo entries. Connect a live news API (e.g. a financial news aggregator) via the newsService interface for real-time coverage.',
  },
]

export default function Settings() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-display font-semibold text-ink-900">Settings</h1>
        <p className="text-sm text-ink-600 mt-0.5">Data sources, integrations and application information.</p>
      </div>

      <Panel title="Data Source Status" subtitle="How this instance of StockScope AI is currently configured">
        <div className="space-y-4">
          {INTEGRATIONS.map((i) => (
            <div key={i.name} className="flex gap-3 border border-paper-200 rounded-md p-4">
              <div className="w-9 h-9 rounded-md bg-paper-100 flex items-center justify-center shrink-0">
                <i.icon size={17} className="text-accent" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-ink-900">{i.name}</p>
                  <Badge variant="demo">{i.status}</Badge>
                </div>
                <p className="text-2xs text-ink-600 mt-1 leading-relaxed">{i.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="About" right={<Info size={16} className="text-ink-500" />}>
        <p className="text-sm text-ink-700 leading-relaxed">
          StockScope AI is a research assistant for financial advisors covering Indian listed companies. It is
          designed for research and educational use, not for trading, portfolio execution, or investment advice.
        </p>
        <div className="mt-4 border-t border-paper-200 pt-4">
          <p className="text-2xs text-ink-500 leading-relaxed italic">
            StockScope AI provides research and educational information only. It does not constitute investment
            advice, a recommendation, or a guarantee of future performance.
          </p>
        </div>
      </Panel>
    </div>
  )
}
