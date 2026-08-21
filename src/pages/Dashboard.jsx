import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, LayoutGrid } from 'lucide-react'
import { marketService } from '../services/marketService'
import Panel from '../components/Panel'
import { DemoBadge } from '../components/Badge'
import ChangeTag from '../components/ChangeTag'
import Sparkline from '../components/Sparkline'
import StockTable from '../components/StockTable'
import StockSearchBar from '../components/StockSearchBar'
import { LoadingState } from '../components/StateViews'
import { formatNumber } from '../utils/formatters'

export default function Dashboard() {
  const [indices, setIndices] = useState(null)
  const [movers, setMovers] = useState(null)
  const [sectors, setSectors] = useState(null)
  const [meta, setMeta] = useState(null)

  useEffect(() => {
    marketService.getIndices().then((r) => setIndices(r.data))
    marketService.getMovers().then((r) => setMovers(r.data))
    marketService.getSectorSnapshot().then((r) => setSectors(r.data))
    marketService.getMarketMeta().then((r) => setMeta(r.data))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-display font-semibold text-ink-900">Dashboard</h1>
          <p className="text-sm text-ink-600 mt-0.5">Market snapshot and quick research access.</p>
        </div>
        <DemoBadge />
      </div>

      <Panel title="Quick Stock Search" subtitle="Jump straight into research for any covered company">
        <StockSearchBar autoFocus={false} size="lg" />
      </Panel>

      <div>
        <h2 className="text-sm font-semibold text-ink-800 mb-2">Key Indices</h2>
        {!indices ? (
          <LoadingState label="Loading indices…" compact />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {indices.map((idx) => (
              <div key={idx.code} className="bg-white border border-paper-300 rounded-md p-4 shadow-panel">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xs text-ink-600 uppercase tracking-wide">{idx.name}</p>
                    <p className="text-lg font-semibold data-mono text-ink-900 mt-0.5">{formatNumber(idx.value)}</p>
                  </div>
                  <ChangeTag changePct={idx.changePct} />
                </div>
                <div className="mt-2 -mx-1">
                  <Sparkline data={idx.history} positive={idx.changePct >= 0} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel
          title="Top Gainers"
          right={<TrendingUp size={16} className="text-gain" />}
        >
          {!movers ? (
            <LoadingState compact />
          ) : movers.gainers.length ? (
            <StockTable
              stocks={movers.gainers}
              columns={[
                { key: 'name', label: 'Company' },
                { key: 'price', label: 'Price' },
                { key: 'change', label: 'Change' },
              ]}
            />
          ) : (
            <p className="text-sm text-ink-600 py-4">No gainers in the current demo snapshot.</p>
          )}
        </Panel>

        <Panel
          title="Top Losers"
          right={<TrendingDown size={16} className="text-loss" />}
        >
          {!movers ? (
            <LoadingState compact />
          ) : movers.losers.length ? (
            <StockTable
              stocks={movers.losers}
              columns={[
                { key: 'name', label: 'Company' },
                { key: 'price', label: 'Price' },
                { key: 'change', label: 'Change' },
              ]}
            />
          ) : (
            <p className="text-sm text-ink-600 py-4">No losers in the current demo snapshot.</p>
          )}
        </Panel>
      </div>

      <Panel title="Sector Snapshot" right={<LayoutGrid size={16} className="text-ink-500" />}>
        {!sectors ? (
          <LoadingState compact />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {sectors.map((s) => (
              <div key={s.sector} className="border border-paper-200 rounded-md px-3 py-2.5 flex items-center justify-between">
                <span className="text-sm text-ink-800">{s.sector}</span>
                <ChangeTag changePct={s.changePct} />
              </div>
            ))}
          </div>
        )}
        {meta && (
          <p className="text-2xs text-ink-500 mt-3">
            Market breadth (demo): {meta.advanceDecline.advances} advances · {meta.advanceDecline.declines} declines ·{' '}
            {meta.advanceDecline.unchanged} unchanged
          </p>
        )}
      </Panel>
    </div>
  )
}
