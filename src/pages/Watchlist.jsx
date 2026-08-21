import { useEffect, useState } from 'react'
import { Star, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { marketService } from '../services/marketService'
import { useWatchlist } from '../hooks/useWatchlist'
import Panel from '../components/Panel'
import { EmptyState } from '../components/StateViews'
import { formatINR, formatMarketCap } from '../utils/formatters'
import ChangeTag from '../components/ChangeTag'

export default function Watchlist() {
  const { tickers, remove } = useWatchlist()
  const [allStocks, setAllStocks] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    marketService.getAllStocks().then((r) => setAllStocks(r.data))
  }, [])

  const watchedStocks = (allStocks || []).filter((s) => tickers.includes(s.ticker))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-semibold text-ink-900">Watchlist</h1>
        <p className="text-sm text-ink-600 mt-0.5">
          Saved to this browser via local storage — add stocks from any research page.
        </p>
      </div>

      <Panel title={`Saved Stocks (${watchedStocks.length})`}>
        {!allStocks ? null : watchedStocks.length === 0 ? (
          <EmptyState
            icon={Star}
            title="Your watchlist is empty"
            description="Open a company's research page and tap “Add to Watchlist” to track it here."
            action={
              <button
                onClick={() => navigate('/research')}
                className="text-sm font-medium text-white bg-accent hover:bg-accent-dark px-4 py-2 rounded-md"
              >
                Browse Stock Research
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-300 text-2xs text-ink-600 uppercase tracking-wide">
                  <th className="text-left font-medium py-2 pl-0 pr-2">Company</th>
                  <th className="text-left font-medium py-2 px-2">Price</th>
                  <th className="text-left font-medium py-2 px-2">Change</th>
                  <th className="text-left font-medium py-2 px-2">Mkt Cap</th>
                  <th className="text-left font-medium py-2 px-2">P/E</th>
                  <th className="text-left font-medium py-2 px-2">ROE</th>
                  <th className="py-2 px-2" />
                </tr>
              </thead>
              <tbody>
                {watchedStocks.map((s) => (
                  <tr
                    key={s.ticker}
                    onClick={() => navigate(`/research/${s.ticker}`)}
                    className="border-b border-paper-100 last:border-b-0 hover:bg-paper-100 cursor-pointer"
                  >
                    <td className="py-2.5 pl-0 pr-2">
                      <p className="font-medium text-ink-900">{s.name}</p>
                      <p className="text-2xs text-ink-500">
                        {s.ticker} · {s.sector}
                      </p>
                    </td>
                    <td className="py-2.5 px-2 data-mono">{formatINR(s.price)}</td>
                    <td className="py-2.5 px-2">
                      <ChangeTag changePct={s.changePct} />
                    </td>
                    <td className="py-2.5 px-2 data-mono">{formatMarketCap(s.marketCapCr)}</td>
                    <td className="py-2.5 px-2 data-mono">{s.pe.toFixed(1)}x</td>
                    <td className="py-2.5 px-2 data-mono">{s.roe.toFixed(1)}%</td>
                    <td className="py-2.5 px-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => remove(s.ticker)}
                        className="text-ink-500 hover:text-loss p-1"
                        title="Remove from watchlist"
                      >
                        <X size={15} />
                      </button>
                    </td>
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
