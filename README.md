# StockScope AI — Indian Equity Research Intelligence

A research assistant for financial advisors covering Indian listed companies:
search a stock → market data → fundamentals → price performance →
news/developments → AI analysis → risks → client explanation → research report.

This is **research and educational tooling only** — not a broker, trading app,
portfolio manager, or investment advice platform.

## Architecture

```text
Alpha Vantage (market data provider)
        v
server/  (Express backend — holds provider + Supabase secrets)
        v
Supabase PostgreSQL (cached market data, watchlist, saved reports)
        v
src/     (React + Vite frontend)
```

- **Frontend** (`src/`): React + Vite + Tailwind + Recharts. Never holds
  provider API keys or the Supabase service-role key — only the public
  Supabase anon key (safe to ship, access is governed by Row Level Security).
- **Backend** (`server/`): small Express API that calls Alpha Vantage,
  caches normalized results into Supabase using the service-role key, and
  exposes `/api/market/*` endpoints for the frontend to consume.
- **Database** (`supabase/migrations/`): PostgreSQL schema for company
  master data, market prices, historical prices, fundamentals, news,
  watchlist, and saved research reports.

If the backend or database is unreachable, the app falls back to clearly
labelled demo/simulated data rather than pretending it's live — see the
data source badges throughout the UI.

## Project structure

```text
src/
  components/    Panel, StockTable, PriceChart, ScoreGauge, RiskRadar,
                 DataSourceBadge, Toast, StateViews, etc.
  pages/         Dashboard, Stock Research, Market Overview, Watchlist,
                 Screener, Research Reports, Settings
  layouts/       MainLayout (sidebar + header)
  data/          Local reference/demo data (company master fields, demo
                 fallback fundamentals, demo news)
  services/      marketService, aiService, newsService, reportService,
                 databaseService, supabaseClient, anonUser
  hooks/         useWatchlist (Supabase-backed), useToast
  utils/         formatters, priceGen, screenerNLP

server/
  index.js       Express entrypoint
  routes/        /api/market/* endpoints
  services/      alphaVantage.js (provider adapter), marketCache.js
                 (cache-first Supabase logic), supabaseAdmin.js
                 (service-role client — server-only)

supabase/
  migrations/    SQL schema + Row Level Security policies
```
dation, or a
> guarantee of future performance.```
