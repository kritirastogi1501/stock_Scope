import { Radio, FlaskConical } from 'lucide-react'
import Badge from './Badge'
import { formatDate } from '../utils/formatters'

// Shows whether the data on screen is live (and how delayed) or demo,
// plus a last-updated timestamp when available. Used anywhere real
// provider data may have replaced demo data, so the advisor always
// knows what they're looking at.
export default function DataSourceBadge({ meta, className = '' }) {
  if (!meta || meta.isDemo) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <Badge variant="demo">
          <FlaskConical size={10} /> Demo Data
        </Badge>
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
      <Badge variant="gain">
        <Radio size={10} /> Live · {meta.source === 'alpha_vantage' ? 'Alpha Vantage' : meta.source}
        {meta.isDelayed ? ' (end-of-day)' : ''}
      </Badge>
      {meta.fetchedAt && (
        <span className="text-2xs text-ink-500">Last updated {formatDate(meta.fetchedAt, { short: true })}</span>
      )}
    </span>
  )
}
