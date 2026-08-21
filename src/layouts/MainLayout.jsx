import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  LineChart,
  Globe2,
  Star,
  SlidersHorizontal,
  FileText,
  Settings as SettingsIcon,
  TrendingUp,
} from 'lucide-react'
import StockSearchBar from '../components/StockSearchBar'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/research', label: 'Stock Research', icon: LineChart },
  { to: '/market', label: 'Market Overview', icon: Globe2 },
  { to: '/watchlist', label: 'Watchlist', icon: Star },
  { to: '/screener', label: 'Stock Screener', icon: SlidersHorizontal },
  { to: '/reports', label: 'Research Reports', icon: FileText },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function MainLayout() {
  return (
    <div className="min-h-screen flex bg-paper-100">
      <aside className="w-60 shrink-0 bg-ink-950 text-paper-100 flex flex-col no-print">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded bg-accent flex items-center justify-center">
            <TrendingUp size={17} className="text-white" />
          </div>
          <div>
            <p className="font-display font-semibold text-sm leading-tight text-white">StockScope AI</p>
            <p className="text-2xs text-paper-300 leading-tight">Equity Research Intelligence</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-paper-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10 text-2xs text-paper-300 leading-relaxed">
          Research &amp; educational use only. Not investment advice.
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 bg-white border-b border-paper-300 flex items-center gap-4 px-6 no-print">
          <div className="max-w-md w-full">
            <StockSearchBar size="sm" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-2xs text-ink-600 hidden sm:inline">NSE / BSE · Indian Equities</span>
            <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent text-xs font-semibold">
              FA
            </div>
          </div>
        </header>
        <main className="flex-1 px-6 py-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
