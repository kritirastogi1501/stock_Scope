import { useEffect, useState } from 'react'
import { marketService } from '../services/marketService'
import Panel from '../components/Panel'
import { DemoBadge } from '../components/Badge'
import ChangeTag from '../components/ChangeTag'
import PriceChart from '../components/PriceChart'
import StockTable from '../components/StockTable'
import { LoadingState } from '../components/StateViews'
import { formatNumber } from '../utils/formatters'

export default function MarketOverview() {
  const [indices, setIndices] = useState(null)
  const [sectors, setSectors] = useState(null)
  const [meta, setMeta] = useState(null)
  const [stocks, setStocks] = useState(null)
  const [activeIndex, setActiveIndex] = useState(null)
  const [range, setRange] = useState('6M')

  useEffect(() => {
    marketService.getIndices().then((r) => {
      setIndices(r.data)
      setActiveIndex(r.data[0]?.code)
    })
    marketService.getSectorSnapshot().then((r) => setSectors(r.data))
    marketService.getMarketMeta().then((r) => setMeta(r.data))
    marketService.getAllStocks().then((r) => setStocks(r.data))
  }, [])

  const selected = indices?.find((i) => i.code === activeIndex)

  const rangedHistory = selected
    ? (() => {
        const daysMap = { '1M': 30, '6M': 90, '1Y': 90, '5Y': 90 }
        return selected.history
      })()
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-display font-semibold text-ink-900">Market Overview</h1>
          <p className="text-sm text-ink-600 mt-0.5">Index levels, sector performance and market breadth.</p>
        </div>
        <DemoBadge />
      </div>

      <Panel title="Index Performance">
        {!indices ? (
          <LoadingState compact />
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-4 no-print">
              {indices.map((idx) => (
                <button
                  key={idx.code}
                  onClick={() => setActiveIndex(idx.code)}
                  className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                    activeIndex === idx.code
                      ? 'bg-accent text-white border-accent'
                      : 'bg-white text-ink-700 border-paper-300 hover:border-accent hover:text-accent'
                  }`}
                >
                  {idx.name}
                </button>
              ))}
            </div>
            {selected && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-2xl font-semibold data-mono text-ink-900">{formatNumber(selected.value)}</p>
                  <ChangeTag changePct={selected.changePct} size="lg" />
                </div>
                <PriceChart
                  data={selected.history}
                  range="90D"
                  onRangeChange={() => {}}
                  isPositiveTrend={selected.changePct >= 0}
                />
                <p className="text-2xs text-ink-500 mt-1">90-day simulated trend — demo data.</p>
              </div>
            )}
          </>
        )}
      </Panel>

      <Panel title="Sector Performance">
        {!sectors ? (
          <LoadingState compact />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sectors
              .slice()
              .sort((a, b) => b.changePct - a.changePct)
              .map((s) => (
                <div key={s.sector} className="border border-paper-200 rounded-md px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-ink-800">{s.sector}</span>
                    <ChangeTag changePct={s.changePct} />
                  </div>
                  <div className="h-1.5 bg-paper-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.changePct >= 0 ? 'bg-gain' : 'bg-loss'}`}
                      style={{ width: `${Math.min(100, Math.abs(s.changePct) * 30)}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        )}
      </Panel>

      {meta && (
        <Panel title="Market Breadth">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="border border-paper-200 rounded-md py-3">
              <p className="text-lg font-semibold data-mono text-gain">{meta.advanceDecline.advances}</p>
              <p className="text-2xs text-ink-600 uppercase tracking-wide mt-1">Advances</p>
            </div>
            <div className="border border-paper-200 rounded-md py-3">
              <p className="text-lg font-semibold data-mono text-loss">{meta.advanceDecline.declines}</p>
              <p className="text-2xs text-ink-600 uppercase tracking-wide mt-1">Declines</p>
            </div>
            <div className="border border-paper-200 rounded-md py-3">
              <p className="text-lg font-semibold data-mono text-ink-700">{meta.advanceDecline.unchanged}</p>
              <p className="text-2xs text-ink-600 uppercase tracking-wide mt-1">Unchanged</p>
            </div>
          </div>
        </Panel>
      )}

      <Panel title="All Covered Stocks">
        {!stocks ? (
          <LoadingState compact />
        ) : (
          <StockTable
            stocks={stocks}
            columns={[
              { key: 'name', label: 'Company' },
              { key: 'price', label: 'Price' },
              { key: 'change', label: 'Change' },
              { key: 'marketCapCr', label: 'Mkt Cap' },
              { key: 'pe', label: 'P/E' },
            ]}
          />
        )}
      </Panel>
    </div>
  )
}
