import { useNavigate } from 'react-router-dom'
import { formatINR, formatMarketCap, formatMetric } from '../utils/formatters'
import ChangeTag from './ChangeTag'

const DEFAULT_COLUMNS = [
  { key: 'name', label: 'Company' },
  { key: 'price', label: 'Price' },
  { key: 'change', label: 'Change' },
  { key: 'marketCapCr', label: 'Mkt Cap' },
  { key: 'pe', label: 'P/E' },
  { key: 'roe', label: 'ROE' },
]

export default function StockTable({ stocks, columns = DEFAULT_COLUMNS, extraColumn }) {
  const navigate = useNavigate()

  if (!stocks.length) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-paper-300 text-2xs text-ink-600 uppercase tracking-wide">
            {columns.map((col) => (
              <th key={col.key} className="text-left font-medium py-2 px-2 first:pl-0">
                {col.label}
              </th>
            ))}
            {extraColumn && <th className="py-2 px-2" />}
          </tr>
        </thead>
        <tbody>
          {stocks.map((s) => (
            <tr
              key={s.ticker}
              onClick={() => navigate(`/research/${s.ticker}`)}
              className="border-b border-paper-100 last:border-b-0 hover:bg-paper-100 cursor-pointer transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className="py-2.5 px-2 first:pl-0 tabular">
                  {renderCell(col.key, s)}
                </td>
              ))}
              {extraColumn && (
                <td className="py-2.5 px-2 text-right" onClick={(e) => e.stopPropagation()}>
                  {extraColumn(s)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderCell(key, s) {
  switch (key) {
    case 'name':
      return (
        <div>
          <p className="font-medium text-ink-900">{s.name}</p>
          <p className="text-2xs text-ink-500">
            {s.ticker} · {s.sector}
          </p>
        </div>
      )
    case 'price':
      return <span className="data-mono text-ink-900">{formatINR(s.price)}</span>
    case 'change':
      return <ChangeTag changePct={s.changePct} />
    case 'marketCapCr':
      return <span className="data-mono text-ink-700">{formatMarketCap(s.marketCapCr)}</span>
    case 'pe':
      return <span className="data-mono text-ink-700">{s.pe.toFixed(1)}x</span>
    case 'roe':
      return <span className="data-mono text-ink-700">{s.roe.toFixed(1)}%</span>
    case 'roce':
      return <span className="data-mono text-ink-700">{formatMetric(s.roce, 1, '%')}</span>
    case 'debtToEquity':
      return <span className="data-mono text-ink-700">{formatMetric(s.debtToEquity, 2)}</span>
    case 'dividendYield':
      return <span className="data-mono text-ink-700">{s.dividendYield.toFixed(1)}%</span>
    case 'revenueGrowth':
      return <span className="data-mono text-ink-700">{s.revenueGrowth.toFixed(1)}%</span>
    case 'profitGrowth':
      return <span className="data-mono text-ink-700">{s.profitGrowth.toFixed(1)}%</span>
    default:
      return s[key]
  }
}
