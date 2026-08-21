import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import StockResearchHome from './pages/StockResearchHome'
import StockResearchDetail from './pages/StockResearchDetail'
import MarketOverview from './pages/MarketOverview'
import Watchlist from './pages/Watchlist'
import Screener from './pages/Screener'
import Reports from './pages/Reports'
import ReportView from './pages/ReportView'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/research" element={<StockResearchHome />} />
        <Route path="/research/:ticker" element={<StockResearchDetail />} />
        <Route path="/market" element={<MarketOverview />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/screener" element={<Screener />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports/:ticker" element={<ReportView />} />
        <Route path="/reports/saved/:id" element={<ReportView />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
