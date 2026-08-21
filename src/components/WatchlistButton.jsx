import { Star } from 'lucide-react'

export default function WatchlistButton({ watched, onToggle, size = 'md' }) {
  const padding = size === 'lg' ? 'px-3 py-2 text-sm' : 'px-2.5 py-1.5 text-2xs'
  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium transition-colors ${padding} ${
        watched
          ? 'bg-accent/10 border-accent/40 text-accent'
          : 'bg-white border-paper-300 text-ink-700 hover:border-accent hover:text-accent'
      }`}
    >
      <Star size={size === 'lg' ? 15 : 13} fill={watched ? 'currentColor' : 'none'} />
      {watched ? 'In Watchlist' : 'Add to Watchlist'}
    </button>
  )
}
