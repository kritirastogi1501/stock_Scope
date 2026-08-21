import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Printer, Download, TrendingUp, Save, CheckCircle2 } from 'lucide-react'
import { reportService } from '../services/reportService'
import { useToast } from '../hooks/useToast'
import ToastStack from '../components/Toast'
import Badge, { DemoBadge } from '../components/Badge'
import ChangeTag from '../components/ChangeTag'
import ScoreGauge from '../components/ScoreGauge'
import { LoadingState, ErrorState } from '../components/StateViews'
import { formatINR, formatMarketCap, formatPercent, formatDate } from '../utils/formatters'

export default function ReportView() {
  const { ticker, id } = useParams()
  const navigate = useNavigate()
  const { toasts, showToast, dismissToast } = useToast()
  const [report, setReport] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    setReport(null)
    setError(false)
    setSaved(false)

    const load = id ? reportService.loadSavedReport(id) : reportService.buildReport(ticker)

    load
      .then((r) => {
        if (!active) return
        if (!r || !r.stock) {
          setError(true)
        } else {
          setReport(r)
          if (r.saved) setSaved(true)
        }
      })
      .catch(() => active && setError(true))
    return () => {
      active = false
    }
  }, [ticker, id])

  const handleExport = async () => {
    if (!report) return
    setExporting(true)
    try {
      await reportService.exportPdf(report)
      showToast('Report exported as PDF')
    } catch {
      showToast('Could not export PDF — try Print instead', 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleSave = async () => {
    if (!report || saving) return
    setSaving(true)
    try {
      const { source } = await reportService.saveReport(report)
      setSaved(true)
      showToast(
        source === 'supabase' ? 'Report saved to your account' : 'Report saved locally (database unavailable)'
      )
    } catch {
      showToast('Could not save report', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (error) return <ErrorState message={`No coverage found for “${ticker}”.`} />
  if (!report) return <LoadingState label="Assembling research report…" />

  const { stock, ai, news, clientExplanation, generatedAt } = report

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <ToastStack toasts={toasts} dismissToast={dismissToast} />

      <div className="flex items-center justify-between flex-wrap gap-3 no-print">
        <button
          onClick={() => navigate('/reports')}
          className="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-accent"
        >
          <ArrowLeft size={15} /> Back to Research Reports
        </button>
        <div className="flex items-center gap-2">
          {!report.saved && (
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border border-paper-300 text-ink-700 hover:border-accent hover:text-accent font-medium disabled:opacity-60"
            >
              {saved ? <CheckCircle2 size={15} className="text-gain" /> : <Save size={15} />}
              {saved ? 'Saved' : saving ? 'Saving…' : 'Save Report'}
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border border-paper-300 text-ink-700 hover:border-accent hover:text-accent font-medium"
          >
            <Printer size={15} /> Print
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-md bg-accent hover:bg-accent-dark text-white font-medium disabled:opacity-60"
          >
            <Download size={15} /> {exporting ? 'Exporting…' : 'Export PDF'}
          </button>
        </div>
      </div>

      {report.saved && (
        <div className="no-print bg-accent/5 border border-accent/20 rounded-md px-4 py-2.5 text-sm text-ink-700 flex items-center gap-2">
          <CheckCircle2 size={15} className="text-accent" />
          Viewing a previously saved report{report.generatedAt ? ` from ${formatDate(report.generatedAt, { short: true })}` : ''}.
        </div>
      )}

      <div className="bg-white border border-paper-300 rounded-md shadow-panel p-8" id="report-root">
        {/* Report header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded bg-accent flex items-center justify-center">
            <TrendingUp size={14} className="text-white" />
          </div>
          <span className="font-display font-semibold text-ink-900 text-sm">StockScope AI — Equity Research Report</span>
        </div>
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <p className="text-2xs text-ink-500">Generated {formatDate(generatedAt, { short: true })}</p>
          {stock._meta?.isDemo === false ? (
            <Badge variant="gain">Live data · Alpha Vantage (end-of-day)</Badge>
          ) : (
            <DemoBadge />
          )}
          {stock._meta?.fetchedAt && (
            <span className="text-2xs text-ink-500">
              Last updated {formatDate(stock._meta.fetchedAt, { short: true })}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-paper-200 pb-5 mb-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-display font-semibold text-ink-900">{stock.name}</h1>
              <Badge variant="neutral">{stock.ticker}</Badge>
              <Badge variant="accent">{stock.sector}</Badge>
            </div>
            <p className="text-sm text-ink-600 mt-2 max-w-xl leading-relaxed">{stock.description}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold data-mono text-ink-900">{formatINR(stock.price)}</p>
            <ChangeTag changePct={stock.changePct} size="lg" />
          </div>
        </div>

        <Section title="Key Metrics">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-4 gap-y-3 text-sm">
            <Metric label="Market Cap" value={formatMarketCap(stock.marketCapCr)} />
            <Metric label="P/E" value={`${stock.pe.toFixed(1)}x`} />
            <Metric label="P/B" value={`${stock.pb.toFixed(1)}x`} />
            <Metric label="EPS" value={formatINR(stock.eps)} />
            <Metric label="ROE" value={formatPercent(stock.roe)} />
            <Metric label="ROCE" value={formatPercent(stock.roce)} />
            <Metric label="Debt/Equity" value={stock.debtToEquity.toFixed(2)} />
            <Metric label="Dividend Yield" value={formatPercent(stock.dividendYield)} />
            <Metric label="52W High" value={formatINR(stock.week52High)} />
            <Metric label="52W Low" value={formatINR(stock.week52Low)} />
            <Metric label="Revenue Growth" value={formatPercent(stock.revenueGrowth)} />
            <Metric label="Profit Growth" value={formatPercent(stock.profitGrowth)} />
          </div>
        </Section>

        <Section title="Fundamental Research Score">
          <ScoreGauge score={ai.score} />
        </Section>

        <Section title="AI Research Summary">
          <p className="text-sm text-ink-800 leading-relaxed">{ai.businessSnapshot}</p>
        </Section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Section title="What Looks Strong">
            <BulletList items={ai.strengths} color="text-gain" />
          </Section>
          <Section title="What Needs Attention">
            <BulletList items={ai.attention} color="text-loss" />
          </Section>
        </div>

        <Section title="Bull Case">
          <p className="text-sm text-ink-800 leading-relaxed">{ai.bullCase}</p>
        </Section>
        <Section title="Bear Case">
          <p className="text-sm text-ink-800 leading-relaxed">{ai.bearCase}</p>
        </Section>

        <Section title="Key Risks">
          <BulletList items={ai.risks} color="text-loss" />
        </Section>

        <Section title="Recent Developments">
          {news.length === 0 ? (
            <p className="text-sm text-ink-600">No recent developments available in demo data.</p>
          ) : (
            <ul className="space-y-2">
              {news.slice(0, 6).map((n, i) => (
                <li key={i} className="text-sm text-ink-800">
                  <span className="text-2xs text-ink-500 data-mono mr-2">{formatDate(n.date, { short: true })}</span>
                  {n.headline}
                  <span className="text-2xs text-ink-500"> [{n.category}, {n.impact}]</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Explain to Client">
          <p className="text-sm text-ink-800 leading-relaxed">{clientExplanation}</p>
        </Section>

        <div className="border-t border-paper-200 pt-4 mt-6">
          <p className="text-2xs text-ink-500 leading-relaxed italic">
            StockScope AI provides research and educational information only. It does not constitute investment
            advice, a recommendation, or a guarantee of future performance. All figures shown are simulated demo
            data unless connected to a live data source.
          </p>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xs font-semibold text-ink-700 uppercase tracking-wide mb-2">{title}</h2>
      {children}
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-2xs text-ink-500">{label}</p>
      <p className="data-mono font-medium text-ink-900">{value}</p>
    </div>
  )
}

function BulletList({ items, color }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-ink-800 leading-snug flex gap-2">
          <span className={`${color} mt-0.5`}>•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
