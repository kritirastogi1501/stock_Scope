export default function MetricCard({ label, value, hint, tone = 'default' }) {
  const toneClass =
    tone === 'gain' ? 'text-gain' : tone === 'loss' ? 'text-loss' : 'text-ink-900'
  return (
    <div className="border border-paper-300 rounded-md px-3 py-2.5 bg-white">
      <p className="text-2xs text-ink-600 uppercase tracking-wide">{label}</p>
      <p className={`text-base font-semibold tabular data-mono mt-0.5 ${toneClass}`}>{value}</p>
      {hint && <p className="text-2xs text-ink-500 mt-0.5">{hint}</p>}
    </div>
  )
}
