import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, SlidersHorizontal, X } from 'lucide-react'
import { marketService } from '../services/marketService'
import { SECTORS } from '../data/stocks'
import { parseNaturalQuery, applyCriteria } from '../utils/screenerNLP'
import Panel from '../components/Panel'
import Badge, { DemoBadge } from '../components/Badge'
import ChangeTag from '../components/ChangeTag'
import { EmptyState, LoadingState } from '../components/StateViews'
import { formatINR, formatMarketCap, formatMetric } from '../utils/formatters'

const DEFAULT_FILTERS = {
  sector: 'All',
  peMax: '',
  roeMin: '',
  roceMin: '',
  deMax: '',
  revGrowthMin: '',
  profitGrowthMin: '',
  divYieldMin: '',
  marketCapMin: '',
}

export default function Screener() {
  const [stocks, setStocks] = useState(null)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [nlQuery, setNlQuery] = useState('')
  const [nlResults, setNlResults] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    marketService.getAllStocks().then((r) => setStocks(r.data))
  }, [])

  const filteredStocks = useMemo(() => {
    if (!stocks) return []
    return stocks.filter((s) => {
      if (filters.sector !== 'All' && s.sector !== filters.sector) return false
      if (filters.peMax && s.pe > parseFloat(filters.peMax)) return false
      if (filters.roeMin && s.roe < parseFloat(filters.roeMin)) return false
      if (filters.roceMin) {
        if (s.roce === null || s.roce === undefined || s.roce < parseFloat(filters.roceMin)) return false
      }
      if (filters.deMax) {
        if (s.debtToEquity === null || s.debtToEquity === undefined || s.debtToEquity > parseFloat(filters.deMax))
          return false
      }
      if (filters.revGrowthMin && s.revenueGrowth < parseFloat(filters.revGrowthMin)) return false
      if (filters.profitGrowthMin && s.profitGrowth < parseFloat(filters.profitGrowthMin)) return false
      if (filters.divYieldMin && s.dividendYield < parseFloat(filters.divYieldMin)) return false
      if (filters.marketCapMin && s.marketCapCr < parseFloat(filters.marketCapMin)) return false
      return true
    })
  }, [stocks, filters])

  const runNaturalQuery = () => {
    if (!stocks || !nlQuery.trim()) {
      setNlResults(null)
      return
    }
    const criteria = parseNaturalQuery(nlQuery)
    const results = applyCriteria(stocks, criteria)
    setNlResults({ criteria, results })
  }

  const clearFilters = () => setFilters(DEFAULT_FILTERS)
  const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-display font-semibold text-ink-900">Stock Screener</h1>
          <p className="text-sm text-ink-600 mt-0.5">Filter the coverage universe or describe what you're looking for.</p>
        </div>
        <DemoBadge />
      </div>

      <Panel title="Natural Language Search" right={<Sparkles size={16} className="text-accent" />}>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={nlQuery}
            onChange={(e) => setNlQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runNaturalQuery()}
            placeholder="e.g. Show companies with ROE above 15%, low debt and positive profit growth"
            className="flex-1 px-3 py-2 border border-paper-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
          <button
            onClick={runNaturalQuery}
            className="px-4 py-2 bg-accent hover:bg-accent-dark text-white text-sm font-medium rounded-md shrink-0"
          >
            Search
          </button>
          {nlResults && (
            <button
              onClick={() => {
                setNlQuery('')
                setNlResults(null)
              }}
              className="px-3 py-2 border border-paper-300 rounded-md text-sm text-ink-600 hover:text-ink-900 shrink-0"
            >
              Clear
            </button>
          )}
        </div>

        {nlResults && (
          <div className="mt-4">
            {nlResults.criteria.length === 0 ? (
              <p className="text-sm text-ink-600">
                Couldn't identify specific criteria in that query. Try phrases like "ROE above 15", "low debt", or "PE below 20".
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {nlResults.criteria.map((c, i) => (
                    <Badge key={i} variant="accent">
                      {c.reason}
                    </Badge>
                  ))}
                </div>
                {nlResults.results.length === 0 ? (
                  <EmptyState title="No matches" description="No covered stocks satisfy all of the parsed criteria." />
                ) : (
                  <div className="space-y-2">
                    {nlResults.results.map(({ stock, matched }) => (
                      <div
                        key={stock.ticker}
                        onClick={() => navigate(`/research/${stock.ticker}`)}
                        className="border border-paper-200 rounded-md px-4 py-3 hover:border-accent cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <p className="text-sm font-medium text-ink-900">
                              {stock.name} <span className="text-ink-500 font-normal">· {stock.ticker}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm data-mono">{formatINR(stock.price)}</span>
                            <ChangeTag changePct={stock.changePct} />
                          </div>
                        </div>
                        <p className="text-2xs text-ink-600 mt-1.5">
                          <span className="font-medium text-ink-700">Why it qualified: </span>
                          {matched.map((m) => m.reason).join(' · ')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Panel>

      <Panel
        title="Structured Filters"
        right={
          hasActiveFilters && (
            <button onClick={clearFilters} className="text-2xs text-ink-600 hover:text-loss flex items-center gap-1">
              <X size={12} /> Clear filters
            </button>
          )
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Field label="Sector">
            <select
              value={filters.sector}
              onChange={(e) => setFilters((f) => ({ ...f, sector: e.target.value }))}
              className="w-full px-2.5 py-1.5 border border-paper-300 rounded-md text-sm bg-white"
            >
              <option>All</option>
              {SECTORS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Max P/E">
            <NumInput value={filters.peMax} onChange={(v) => setFilters((f) => ({ ...f, peMax: v }))} placeholder="e.g. 30" />
          </Field>
          <Field label="Min ROE %">
            <NumInput value={filters.roeMin} onChange={(v) => setFilters((f) => ({ ...f, roeMin: v }))} placeholder="e.g. 15" />
          </Field>
          <Field label="Min ROCE %">
            <NumInput value={filters.roceMin} onChange={(v) => setFilters((f) => ({ ...f, roceMin: v }))} placeholder="e.g. 15" />
          </Field>
          <Field label="Max Debt/Equity">
            <NumInput value={filters.deMax} onChange={(v) => setFilters((f) => ({ ...f, deMax: v }))} placeholder="e.g. 0.5" />
          </Field>
          <Field label="Min Revenue Growth %">
            <NumInput value={filters.revGrowthMin} onChange={(v) => setFilters((f) => ({ ...f, revGrowthMin: v }))} placeholder="e.g. 8" />
          </Field>
          <Field label="Min Profit Growth %">
            <NumInput value={filters.profitGrowthMin} onChange={(v) => setFilters((f) => ({ ...f, profitGrowthMin: v }))} placeholder="e.g. 5" />
          </Field>
          <Field label="Min Dividend Yield %">
            <NumInput value={filters.divYieldMin} onChange={(v) => setFilters((f) => ({ ...f, divYieldMin: v }))} placeholder="e.g. 1" />
          </Field>
          <Field label="Min Market Cap (₹ Cr)">
            <NumInput value={filters.marketCapMin} onChange={(v) => setFilters((f) => ({ ...f, marketCapMin: v }))} placeholder="e.g. 50000" />
          </Field>
        </div>
      </Panel>

      <Panel
        title="Screener Results"
        subtitle={stocks ? `${filteredStocks.length} of ${stocks.length} companies match` : undefined}
        right={<SlidersHorizontal size={16} className="text-ink-500" />}
      >
        {!stocks ? (
          <LoadingState compact />
        ) : filteredStocks.length === 0 ? (
          <EmptyState title="No matches" description="Try relaxing one or more filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-300 text-2xs text-ink-600 uppercase tracking-wide">
                  <th className="text-left font-medium py-2 pl-0 pr-2">Company</th>
                  <th className="text-left font-medium py-2 px-2">Price</th>
                  <th className="text-left font-medium py-2 px-2">P/E</th>
                  <th className="text-left font-medium py-2 px-2">ROE</th>
                  <th className="text-left font-medium py-2 px-2">ROCE</th>
                  <th className="text-left font-medium py-2 px-2">D/E</th>
                  <th className="text-left font-medium py-2 px-2">Rev Growth</th>
                  <th className="text-left font-medium py-2 px-2">Mkt Cap</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((s) => (
                  <tr
                    key={s.ticker}
                    onClick={() => navigate(`/research/${s.ticker}`)}
                    className="border-b border-paper-100 last:border-b-0 hover:bg-paper-100 cursor-pointer"
                  >
                    <td className="py-2.5 pl-0 pr-2">
                      <p className="font-medium text-ink-900">{s.name}</p>
                      <p className="text-2xs text-ink-500">{s.ticker} · {s.sector}</p>
                    </td>
                    <td className="py-2.5 px-2 data-mono">{formatINR(s.price)}</td>
                    <td className="py-2.5 px-2 data-mono">{s.pe.toFixed(1)}x</td>
                    <td className="py-2.5 px-2 data-mono">{s.roe.toFixed(1)}%</td>
                    <td className="py-2.5 px-2 data-mono">{formatMetric(s.roce, 1, '%')}</td>
                    <td className="py-2.5 px-2 data-mono">{formatMetric(s.debtToEquity, 2)}</td>
                    <td className="py-2.5 px-2 data-mono">{s.revenueGrowth.toFixed(1)}%</td>
                    <td className="py-2.5 px-2 data-mono">{formatMarketCap(s.marketCapCr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-2xs text-ink-600 uppercase tracking-wide block mb-1">{label}</span>
      {children}
    </label>
  )
}

function NumInput({ value, onChange, placeholder }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-2.5 py-1.5 border border-paper-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
    />
  )
}
