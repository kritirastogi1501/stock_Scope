import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Clock } from 'lucide-react'
import { marketService } from '../services/marketService'
import { reportService } from '../services/reportService'
import Panel from '../components/Panel'
import { DemoBadge } from '../components/Badge'
import { EmptyState, LoadingState } from '../components/StateViews'
import { formatINR, formatDate } from '../utils/formatters'
import ChangeTag from '../components/ChangeTag'

export default function Reports() {
  const [stocks, setStocks] = useState(null)
  const [savedReports, setSavedReports] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    marketService.getAllStocks().then((r) => setStocks(r.data))
    reportService.listSavedReports().then((r) => setSavedReports(r.reports))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-display font-semibold text-ink-900">Research Reports</h1>
          <p className="text-sm text-ink-600 mt-0.5">
            Generate a print-friendly, exportable research report for any covered company.
          </p>
        </div>
        <DemoBadge />
      </div>

      <Panel title="Previously Saved Reports" right={<Clock size={16} className="text-ink-500" />}>
        {!savedReports ? (
          <LoadingState compact />
        ) : savedReports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No saved reports yet"
            description="Generate a report below and tap “Save Report” to keep it here for later."
          />
        ) : (
          <div className="space-y-2">
            {savedReports.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`/reports/saved/${r.id}`)}
                className="w-full flex items-center justify-between gap-3 border border-paper-200 rounded-md px-4 py-3 hover:border-accent text-left transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-ink-900">{r.title}</p>
                  <p className="text-2xs text-ink-500 mt-0.5">
                    Saved {formatDate(r.created_at || r.createdAt, { short: true })}
                  </p>
                </div>
                <FileText size={15} className="text-ink-400 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Select a Company">
        {!stocks ? (
          <LoadingState compact />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stocks.map((s) => (
              <button
                key={s.ticker}
                onClick={() => navigate(`/reports/${s.ticker}`)}
                className="text-left border border-paper-300 rounded-md p-4 hover:border-accent hover:shadow-panel transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-ink-900">{s.name}</p>
                    <p className="text-2xs text-ink-500">{s.ticker} · {s.sector}</p>
                  </div>
                  <FileText size={15} className="text-ink-400 shrink-0 mt-0.5" />
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-sm data-mono text-ink-800">{formatINR(s.price)}</span>
                  <ChangeTag changePct={s.changePct} />
                </div>
              </button>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
