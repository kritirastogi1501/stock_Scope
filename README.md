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
```Setup

### 1. Database (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/migrations/001_init_schema.sql`.
3. From Project Settings → API, note:
   - `Project URL`
   - `anon` public key (frontend)
   - `service_role` secret key (backend only — never expose this)

### 2. Market data provider (Alpha Vantage)

1. Get a free API key at [alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key).
2. Note: Alpha Vantage supplies Indian equities via `.BSE` symbols and
   covers price, daily history, and most fundamentals — but **not**
   ROCE, Debt/Equity, or NIFTY/SENSEX index levels. Those fields show as
   `N/A` or fall back to labelled demo data rather than being invented.
   Data is end-of-day/delayed, never real-time.

### 3. Backend

```bash
cd server
cp .env.example .env
# fill in MARKET_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev      # http://localhost:8787
```

### 4. Frontend

```bash
# from the project root
cp .env.example .env
# fill in VITE_API_BASE_URL (defaults to http://localhost:8787/api),
# VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm install
npm run dev       # http://localhost:5173
```

```The frontend and backend run as two separate processes in development.

## Notes on this package

- No `node_modules`, `dist`, or real `.env` files are included.
- No lockfile is included — `npm install` in this project's build
  environment did not have network access, so a `package-lock.json`
  could not be generated. Running `npm install` locally will create one.
- Everything works with zero external services configured: without
  `.env` values, the app runs entirely on local demo data, clearly
  labelled as such throughout the UI.

## Disclaimer

> StockScope AI provides research and educational information only. It
> does not constitute investment advice, a recommendation, or a
> guarantee of future performance.```
