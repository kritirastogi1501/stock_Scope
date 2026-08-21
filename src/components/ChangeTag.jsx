import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { formatPercent } from '../utils/formatters'

export default function ChangeTag({ changePct, size = 'sm' }) {
  const isUp = changePct > 0
  const isDown = changePct < 0
  const Icon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : Minus
  const colorClass = isUp ? 'text-gain bg-gain-bg' : isDown ? 'text-loss bg-loss-bg' : 'text-ink-600 bg-paper-200'
  const padding = size === 'lg' ? 'px-2.5 py-1 text-sm' : 'px-1.5 py-0.5 text-2xs'
  return (
    <span className={`inline-flex items-center gap-0.5 rounded font-semibold tabular data-mono ${colorClass} ${padding}`}>
      <Icon size={size === 'lg' ? 14 : 11} />
      {formatPercent(changePct)}
    </span>
  )
}
