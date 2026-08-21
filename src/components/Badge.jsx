const VARIANTS = {
  demo: 'bg-gold/10 text-gold border-gold/30',
  gain: 'bg-gain-bg text-gain border-gain/20',
  loss: 'bg-loss-bg text-loss border-loss/20',
  neutral: 'bg-paper-200 text-ink-700 border-paper-300',
  accent: 'bg-accent/10 text-accent border-accent/25',
  high: 'bg-loss-bg text-loss border-loss/20',
  medium: 'bg-gold/10 text-gold border-gold/30',
  low: 'bg-paper-200 text-ink-600 border-paper-300',
}

export default function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-2xs font-medium uppercase tracking-wide ${VARIANTS[variant] || VARIANTS.neutral} ${className}`}
    >
      {children}
    </span>
  )
}

export function DemoBadge({ className = '' }) {
  return (
    <Badge variant="demo" className={className}>
      Demo Data
    </Badge>
  )
}
