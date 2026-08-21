const LABELS = {
  growth: 'Growth',
  profitability: 'Profitability',
  financialHealth: 'Financial Health',
  valuation: 'Valuation',
  stability: 'Stability',
}

function bandColor(score) {
  if (score >= 70) return '#0E8A4B'
  if (score >= 45) return '#B8860B'
  return '#C22A2A'
}

function bandLabel(score) {
  if (score >= 70) return 'Strong'
  if (score >= 45) return 'Moderate'
  return 'Weak'
}

export default function ScoreGauge({ score }) {
  const color = bandColor(score.overall)
  const circumference = 2 * Math.PI * 42
  const offset = circumference - (score.overall / 100) * circumference

  return (
    <div className="flex flex-col sm:flex-row gap-6">
      <div className="flex flex-col items-center justify-center shrink-0">
        <svg width="112" height="112" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#E9ECF2" strokeWidth="9" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 50 50)"
          />
          <text x="50" y="47" textAnchor="middle" fontSize="22" fontWeight="700" fill="#0E1F38" fontFamily="IBM Plex Mono, monospace">
            {score.overall}
          </text>
          <text x="50" y="63" textAnchor="middle" fontSize="8.5" fill="#5B6B82">
            / 100
          </text>
        </svg>
        <p className="text-2xs font-semibold uppercase tracking-wide mt-1" style={{ color }}>
          {bandLabel(score.overall)}
        </p>
      </div>
      <div className="flex-1 space-y-2.5 min-w-[220px]">
        {Object.entries(score.breakdown).map(([key, val]) => (
          <div key={key}>
            <div className="flex items-center justify-between text-2xs mb-1">
              <span className="text-ink-700 font-medium">{LABELS[key]}</span>
              <span className="data-mono font-semibold text-ink-900">{val === null ? 'N/A' : val}</span>
            </div>
            <div className="h-1.5 bg-paper-200 rounded-full overflow-hidden">
              {val === null ? (
                <div className="h-full w-full bg-[repeating-linear-gradient(45deg,#E9ECF2,#E9ECF2_4px,#F4F6F9_4px,#F4F6F9_8px)]" />
              ) : (
                <div className="h-full rounded-full" style={{ width: `${val}%`, backgroundColor: bandColor(val) }} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
