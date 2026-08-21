-- StockScope AI — initial schema
-- Run this in the Supabase SQL editor, or via `supabase db push` if using the CLI.

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- Company master data
-- ---------------------------------------------------------------------
create table if not exists stocks (
  ticker        text primary key,
  name          text not null,
  sector        text,
  exchange      text default 'NSE',
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Latest market price snapshot (one row per ticker, upserted on refresh)
-- ---------------------------------------------------------------------
create table if not exists market_prices (
  ticker         text primary key references stocks(ticker) on delete cascade,
  price          numeric,
  change         numeric,
  change_pct     numeric,
  market_cap_cr  numeric,
  week52_high    numeric,
  week52_low     numeric,
  source         text not null,           -- e.g. 'alpha_vantage' | 'demo'
  is_delayed     boolean not null default true,
  fetched_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Historical daily closes (append-only, cached from provider)
-- ---------------------------------------------------------------------
create table if not exists historical_prices (
  id          uuid primary key default uuid_generate_v4(),
  ticker      text not null references stocks(ticker) on delete cascade,
  trade_date  date not null,
  close       numeric not null,
  source      text not null,
  fetched_at  timestamptz not null default now(),
  unique (ticker, trade_date)
);
create index if not exists idx_historical_prices_ticker_date
  on historical_prices (ticker, trade_date desc);

-- ---------------------------------------------------------------------
-- Company fundamentals (one row per ticker, upserted on refresh)
-- ---------------------------------------------------------------------
create table if not exists company_fundamentals (
  ticker            text primary key references stocks(ticker) on delete cascade,
  pe                numeric,
  pb                numeric,
  eps               numeric,
  roe               numeric,
  roce              numeric,
  debt_to_equity    numeric,
  dividend_yield    numeric,
  revenue_growth    numeric,
  profit_growth     numeric,
  operating_margin  numeric,
  net_margin        numeric,
  source            text not null,
  fetched_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- News / developments feed
-- ---------------------------------------------------------------------
create table if not exists news_developments (
  id          uuid primary key default uuid_generate_v4(),
  ticker      text not null references stocks(ticker) on delete cascade,
  event_date  date not null,
  headline    text not null,
  category    text,
  importance  text,
  impact      text,
  source      text not null default 'demo',
  created_at  timestamptz not null default now()
);
create index if not exists idx_news_developments_ticker
  on news_developments (ticker, event_date desc);

-- ---------------------------------------------------------------------
-- Watchlist (anonymous local user id — see src/services/anonUser.js)
-- ---------------------------------------------------------------------
create table if not exists watchlist (
  id          uuid primary key default uuid_generate_v4(),
  user_id     text not null,
  ticker      text not null references stocks(ticker) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, ticker)
);
create index if not exists idx_watchlist_user on watchlist (user_id);

-- ---------------------------------------------------------------------
-- Saved research reports
-- ---------------------------------------------------------------------
create table if not exists research_reports (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             text not null,
  ticker              text not null references stocks(ticker) on delete cascade,
  title               text not null,
  generated_analysis  jsonb not null,   -- AI summary, bull/bear, risks, score, client explanation
  data_snapshot       jsonb not null,   -- fundamentals/price snapshot at generation time
  created_at          timestamptz not null default now()
);
create index if not exists idx_research_reports_user on research_reports (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- Index-level prices (NIFTY 50, SENSEX, NIFTY BANK, NIFTY IT)
-- ---------------------------------------------------------------------
create table if not exists index_prices (
  code        text primary key,   -- e.g. 'NIFTY50'
  name        text not null,
  value       numeric,
  change      numeric,
  change_pct  numeric,
  source      text not null,
  is_delayed  boolean not null default true,
  fetched_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
-- Reference/market data: readable by anyone (anon key), writable only by
-- the backend service role (RLS default-denies writes for anon/authenticated).
alter table stocks enable row level security;
alter table market_prices enable row level security;
alter table historical_prices enable row level security;
alter table company_fundamentals enable row level security;
alter table news_developments enable row level security;
alter table index_prices enable row level security;

create policy "public read stocks" on stocks for select using (true);
create policy "public read market_prices" on market_prices for select using (true);
create policy "public read historical_prices" on historical_prices for select using (true);
create policy "public read company_fundamentals" on company_fundamentals for select using (true);
create policy "public read news_developments" on news_developments for select using (true);
create policy "public read index_prices" on index_prices for select using (true);

-- Watchlist and reports: no auth system yet, so access is scoped by the
-- caller-supplied user_id (anonymous local id) rather than Supabase auth.
-- This keeps the anon key usable directly from the frontend without a
-- backend round-trip for simple CRUD, at the cost of trusting user_id.
-- If real auth is added later, replace these with auth.uid()-based policies.
alter table watchlist enable row level security;
alter table research_reports enable row level security;

create policy "anon manage own watchlist" on watchlist
  for all using (true) with check (true);
create policy "anon manage own reports" on research_reports
  for all using (true) with check (true);
