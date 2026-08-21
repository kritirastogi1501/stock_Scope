import { useCallback, useEffect, useState } from 'react'
import { databaseService } from '../services/databaseService'

// Same external interface as before ({ tickers, isWatched, add, remove, toggle })
// so existing components (Watchlist page, StockResearchDetail) don't need to
// change — only the persistence layer underneath moved from raw localStorage
// to Supabase (with an automatic localStorage fallback baked into
// databaseService if the database is unavailable).
export function useWatchlist() {
  const [tickers, setTickers] = useState([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState('local')

  useEffect(() => {
    let active = true
    databaseService.getWatchlist().then((res) => {
      if (!active) return
      setTickers(res.tickers)
      setSource(res.source)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const isWatched = useCallback((ticker) => tickers.includes(ticker), [tickers])

  const add = useCallback(async (ticker) => {
    setTickers((prev) => (prev.includes(ticker) ? prev : [...prev, ticker])) // optimistic
    const res = await databaseService.addToWatchlist(ticker)
    setSource(res.source)
  }, [])

  const remove = useCallback(async (ticker) => {
    setTickers((prev) => prev.filter((t) => t !== ticker)) // optimistic
    const res = await databaseService.removeFromWatchlist(ticker)
    setSource(res.source)
  }, [])

  const toggle = useCallback(
    async (ticker) => {
      if (tickers.includes(ticker)) {
        await remove(ticker)
      } else {
        await add(ticker)
      }
    },
    [tickers, add, remove]
  )

  return { tickers, isWatched, add, remove, toggle, loading, source }
}
