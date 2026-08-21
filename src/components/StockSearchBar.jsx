import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { marketService } from '../services/marketService'
import { formatINR } from '../utils/formatters'
import ChangeTag from './ChangeTag'

export default function StockSearchBar({ placeholder = 'Search company or ticker (e.g. TCS, HDFC Bank)', autoFocus = false, size = 'md' }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    if (!query.trim()) {
      setResults([])
      return
    }
    marketService.search(query).then((res) => {
      if (active) setResults(res.data)
    })
    return () => {
      active = false
    }
  }, [query])

  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const goTo = (ticker) => {
    setOpen(false)
    setQuery('')
    navigate(`/research/${ticker}`)
  }

  const sizeClass = size === 'lg' ? 'py-3 text-base' : 'py-2 text-sm'

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        <input
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={`w-full ${sizeClass} pl-9 pr-8 border border-paper-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent placeholder:text-ink-500 text-ink-900`}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-900"
          >
            <X size={15} />
          </button>
        )}
      </div>
      {open && query.trim() && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-paper-300 rounded-md shadow-lg max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-4 text-sm text-ink-600">No matching stocks for “{query}”.</div>
          ) : (
            results.map((s) => (
              <button
                key={s.ticker}
                onClick={() => goTo(s.ticker)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-paper-100 text-left border-b border-paper-100 last:border-b-0"
              >
                <div>
                  <p className="text-sm font-medium text-ink-900">
                    {s.name} <span className="text-ink-500 font-normal">· {s.ticker}</span>
                  </p>
                  <p className="text-2xs text-ink-500">{s.sector}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm data-mono text-ink-800">{formatINR(s.price)}</span>
                  <ChangeTag changePct={s.changePct} />
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
