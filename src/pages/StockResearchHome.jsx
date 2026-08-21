import { useEffect, useState } from 'react'
import { marketService } from '../services/marketService'
import Panel from '../components/Panel'
import { DemoBadge } from '../components/Badge'
import StockTable from '../components/StockTable'
import StockSearchBar from '../components/StockSearchBar'
import { LoadingState } from '../components/StateViews'

export default function StockResearchHome() {
  const [stocks, setStocks] = useState(null)

  useEffect(() => {
    marketService.getAllStocks().then((r) => setStocks(r.data))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-display font-semibold text-ink-900">Stock Research</h1>
          <p className="text-sm text-ink-600 mt-0.5">
            Search a company or browse the full coverage universe to open a research page.
          </p>
        </div>
        <DemoBadge />
      </div>

      <Panel bodyClassName="p-4">
        <StockSearchBar size="lg" />
      </Panel>

      <Panel title="Coverage Universe" subtitle={stocks ? `${stocks.length} companies covered` : undefined}>
        {!stocks ? (
          <LoadingState label="Loading coverage universe…" />
        ) : (
          <StockTable
            stocks={stocks}
            columns={[
              { key: 'name', label: 'Company' },
              { key: 'price', label: 'Price' },
              { key: 'change', label: 'Change' },
              { key: 'marketCapCr', label: 'Mkt Cap' },
              { key: 'pe', label: 'P/E' },
              { key: 'roe', label: 'ROE' },
            ]}
          />
        )}
      </Panel>
    </div>
  )
}
