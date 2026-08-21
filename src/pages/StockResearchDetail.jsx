import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Sparkles,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Eye,
  Copy,
  MessageSquareText,
  FileText,
  Newspaper,
} from 'lucide-react'
import { marketService } from '../services/marketService'
import { aiService } from '../services/aiService'
import { newsService } from '../services/newsService'
import { useWatchlist } from '../hooks/useWatchlist'
import { useToast } from '../hooks/useToast'
import Panel from '../components/Panel'
import Badge, { DemoBadge } from '../components/Badge'
import DataSourceBadge from '../components/DataSourceBadge'
import ChangeTag from '../components/ChangeTag'
import MetricCard from '../components/MetricCard'
import PriceChart from '../components/PriceChart'
import ScoreGauge from '../components/ScoreGauge'
import RiskRadar from '../components/RiskRadar'
import WatchlistButton from '../components/WatchlistButton'
import ToastStack from '../components/Toast'
import { LoadingState, ErrorState } from '../components/StateViews'
import { formatINR, formatMarketCap, formatPercent, formatDate, formatMetric } from '../utils/formatters'

export default function StockResearchDetail() {
  const { ticker } = useParams()
  const navigate = useNavigate()
  const { isWatched, toggle } = useWatchlist()
  const { toasts, showToast, dismissToast } = useToast()

  const [stock, setStock] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [range, setRange] = useState('1Y')
  const [history, setHistory] = useState(null)
  const [historyMeta, setHistoryMeta] = useState(null)
  const [ai, setAi] = useState(null)
  const [news, setNews] = useState(null)
  const [clientExplanation, setClientExplanation] = useState(null)
  const [showClient, setShowClient] = useState(false)

  useEffect(() => {
    let active = true
    setStock(null)
    setAi(null)
    setNews(null)
    setClientExplanation(null)
    setNotFound(false)
    setShowClient(false)

    marketService.getStock(ticker).then((res) => {
      if (!active) return
      if (!res.data) {
        setNotFound(true)
        return
      }
      setStock(res.data)
      aiService.generateResearch(res.data).then((r) => active && setAi(r.data))
      newsService.getDevelopments(res.data.ticker).then((r) => active && setNews(r.data))
    })

    return () => {
      active = false
    }
  }, [ticker])

  useEffect(() => {
    if (!stock) return
    let active = true
    setHistory(null)
    marketService.getPriceHistory(stock.ticker, range).then((r) => {
      if (!active) return
      setHistory(r.data)
      setHistoryMeta({ isDemo: r.isDemo, source: r.source, fetchedAt: r.fetchedAt })
    })
    return () => {
      active = false
    }
  }, [stock, range])

  const handleClientExplanation = async () => {
    setShowClient(true)
    if (!clientExplanation) {
      const res = await aiService.generateClientExplanation(stock)
      setClientExplanation(res.data)
    }
  }

  const copyExplanation = () => {
    if (!clientExplanation) return
    navigator.clipboard
      .writeText(clientExplanation)
      .then(() => showToast('Client explanation copied to clipboard'))
      .catch(() => showToast('Could not copy — please copy manually', 'error'))
  }

  if (notFound) {
    return (
      <ErrorState message={`No coverage found for “${ticker}”. Try searching from Stock Research.`} />
    )
  }

  if (!stock) return <LoadingState label="Loading company research…" />

  const watched = isWatched(stock.ticker)

  return (
    <div className="space-y-6">
      <ToastStack toasts={toasts} dismissToast={dismissToast} />

      <button
        onClick={() => navigate('/research')}
        className="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-accent no-print"
      >
        <ArrowLeft size={15} /> Back to Stock Research
      </button>

      {/* Company Header */}
      <div className="bg-white border border-paper-300 rounded-md shadow-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-display font-semibold text-ink-900">{stock.name}</h1>
              <Badge variant="neutral">{stock.ticker}</Badge>
              <Badge variant="accent">{stock.sector}</Badge>
              <Badge variant="neutral">{stock.exchange}</Badge>
            </div>
            <p className="text-sm text-ink-600 mt-2 max-w-2xl leading-relaxed">{stock.description}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-semibold data-mono text-ink-900">{formatINR(stock.price)}</p>
            <div className="mt-1 flex items-center justify-end gap-2">
              <ChangeTag changePct={stock.changePct} size="lg" />
              <span className="text-2xs text-ink-500 data-mono">({formatPercent(stock.change, { showSign: true })} pts)</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4 no-print">
          <WatchlistButton watched={watched} onToggle={() => toggle(stock.ticker)} size="lg" />
          <button
            onClick={handleClientExplanation}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border border-paper-300 text-ink-700 hover:border-accent hover:text-accent font-medium"
          >
            <MessageSquareText size={15} /> Explain to Client
          </button>
          <button
            onClick={() => navigate(`/reports/${stock.ticker}`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border border-paper-300 text-ink-700 hover:border-accent hover:text-accent font-medium"
          >
            <FileText size={15} /> Generate Research Report
          </button>
          <DataSourceBadge meta={stock._meta} className="ml-auto" />
        </div>
      </div>

      {/* Client explanation panel */}
      {showClient && (
        <Panel
          title="Explain to Client"
          subtitle="Plain-language summary suitable for a non-finance client conversation"
          right={
            <button
              onClick={copyExplanation}
              disabled={!clientExplanation}
              className="inline-flex items-center gap-1.5 text-2xs font-medium px-2.5 py-1.5 rounded border border-paper-300 text-ink-700 hover:border-accent hover:text-accent disabled:opacity-50 no-print"
            >
              <Copy size={13} /> Copy Explanation
            </button>
          }
        >
          {!clientExplanation ? (
            <LoadingState compact label="Preparing client-friendly explanation…" />
          ) : (
            <p className="text-sm text-ink-800 leading-relaxed">{clientExplanation}</p>
          )}
        </Panel>
      )}

      {/* Key Metrics */}
      <div>
        <h2 className="text-sm font-semibold text-ink-800 mb-2">Key Metrics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard label="Market Cap" value={formatMarketCap(stock.marketCapCr)} />
          <MetricCard label="P/E" value={`${stock.pe.toFixed(1)}x`} />
          <MetricCard label="P/B" value={`${stock.pb.toFixed(1)}x`} />
          <MetricCard label="EPS" value={formatINR(stock.eps)} />
          <MetricCard label="ROE" value={`${stock.roe.toFixed(1)}%`} />
          <MetricCard label="ROCE" value={formatMetric(stock.roce, 1, '%')} />
          <MetricCard label="Debt/Equity" value={formatMetric(stock.debtToEquity, 2)} />
          <MetricCard label="Dividend Yield" value={`${stock.dividendYield.toFixed(1)}%`} />
          <MetricCard label="52W High" value={formatINR(stock.week52High)} />
          <MetricCard label="52W Low" value={formatINR(stock.week52Low)} />
          <MetricCard
            label="Revenue Growth"
            value={formatPercent(stock.revenueGrowth)}
            tone={stock.revenueGrowth >= 0 ? 'gain' : 'loss'}
          />
          <MetricCard
            label="Profit Growth"
            value={formatPercent(stock.profitGrowth)}
            tone={stock.profitGrowth >= 0 ? 'gain' : 'loss'}
          />
        </div>
      </div>

      {/* Price Chart */}
      <Panel
        title="Price Performance"
        subtitle={
          historyMeta?.isDemo === false
            ? `Historical closes from ${historyMeta.source === 'cache' ? 'cached provider data' : 'Alpha Vantage'} (end-of-day)`
            : 'Simulated historical series for demo purposes'
        }
      >
        {!history ? (
          <LoadingState compact label="Loading price history…" />
        ) : (
          <PriceChart
            data={history}
            range={range}
            onRangeChange={setRange}
            isPositiveTrend={history.length > 1 ? history[history.length - 1].price >= history[0].price : true}
          />
        )}
      </Panel>

      {/* Fundamental Snapshot */}
      <Panel title="Fundamental Snapshot">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <Row label="Operating Margin" value={formatPercent(stock.operatingMargin)} />
          <Row label="Net Margin" value={formatPercent(stock.netMargin)} />
          <Row label="Return on Equity" value={formatPercent(stock.roe)} />
          <Row label="Return on Capital Employed" value={formatPercent(stock.roce)} />
          <Row label="Debt to Equity" value={formatMetric(stock.debtToEquity, 2)} />
          <Row label="Dividend Yield" value={formatPercent(stock.dividendYield)} />
          <Row label="Revenue Growth (YoY)" value={formatPercent(stock.revenueGrowth)} />
          <Row label="Profit Growth (YoY)" value={formatPercent(stock.profitGrowth)} />
        </div>
      </Panel>

      {/* AI Research Summary */}
      <Panel
        title="AI Research Summary"
        subtitle="Generated from structured fundamental data — not a live LLM call in this demo"
        right={<Sparkles size={16} className="text-accent" />}
      >
        {!ai ? (
          <LoadingState compact label="Generating research summary…" />
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-ink-800 leading-relaxed">{ai.businessSnapshot}</p>

            <ScoreGauge score={ai.score} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <h3 className="text-2xs font-semibold text-gain uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <TrendingUp size={13} /> What Looks Strong
                </h3>
                <ul className="space-y-1.5">
                  {ai.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-ink-800 leading-snug flex gap-2">
                      <span className="text-gain mt-0.5">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-2xs font-semibold text-loss uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <TrendingDown size={13} /> What Needs Attention
                </h3>
                <ul className="space-y-1.5">
                  {ai.attention.map((s, i) => (
                    <li key={i} className="text-sm text-ink-800 leading-snug flex gap-2">
                      <span className="text-loss mt-0.5">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </Panel>

      {/* Bull / Bear case */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel title="Bull Case" bodyClassName="bg-gain-bg/40">
          {!ai ? <LoadingState compact /> : <p className="text-sm text-ink-800 leading-relaxed">{ai.bullCase}</p>}
        </Panel>
        <Panel title="Bear Case" bodyClassName="bg-loss-bg/40">
          {!ai ? <LoadingState compact /> : <p className="text-sm text-ink-800 leading-relaxed">{ai.bearCase}</p>}
        </Panel>
      </div>

      {/* Risk Radar */}
      <Panel
        title="Risk Radar"
        subtitle="Relative risk exposure derived from the fundamental research score"
        right={<ShieldAlert size={16} className="text-loss" />}
      >
        {!ai ? (
          <LoadingState compact />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <RiskRadar score={ai.score} />
            <div>
              <h3 className="text-2xs font-semibold text-ink-700 uppercase tracking-wide mb-2">Key Risks</h3>
              <ul className="space-y-1.5">
                {ai.risks.map((r, i) => (
                  <li key={i} className="text-sm text-ink-800 leading-snug flex gap-2">
                    <span className="text-loss mt-0.5">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
              <h3 className="text-2xs font-semibold text-ink-700 uppercase tracking-wide mt-4 mb-2">What To Watch</h3>
              <ul className="space-y-1.5">
                {ai.watchList.map((r, i) => (
                  <li key={i} className="text-sm text-ink-800 leading-snug flex gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Panel>

      {/* Recent Developments */}
      <Panel title="Recent Developments" right={<Newspaper size={16} className="text-ink-500" />}>
        {!news ? (
          <LoadingState compact />
        ) : news.length === 0 ? (
          <p className="text-sm text-ink-600 py-4">No recent developments in demo data for this company.</p>
        ) : (
          <ul className="divide-y divide-paper-100">
            {news.map((n, i) => (
              <li key={i} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-2xs text-ink-500 data-mono">{formatDate(n.date, { short: true })}</span>
                  <Badge variant="accent">{n.category}</Badge>
                  <Badge variant={n.importance.toLowerCase()}>{n.importance}</Badge>
                  <Badge variant={n.impact === 'Positive' ? 'gain' : n.impact === 'Negative' ? 'loss' : 'neutral'}>
                    {n.impact}
                  </Badge>
                </div>
                <p className="text-sm text-ink-900 font-medium">{n.headline}</p>
                <p className="text-2xs text-ink-600 mt-1 flex gap-1">
                  <Eye size={12} className="mt-0.5 shrink-0" />
                  <span>{n.whyItMatters}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="text-2xs text-ink-500 mt-3">
          Demo development feed — connect a live news API for real-time coverage.
        </p>
      </Panel>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-paper-100 py-1.5">
      <span className="text-ink-600">{label}</span>
      <span className="data-mono font-medium text-ink-900">{value}</span>
    </div>
  )
}
