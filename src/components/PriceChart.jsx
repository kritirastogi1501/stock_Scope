import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatINR, formatDate } from '../utils/formatters'

const RANGES = ['1M', '6M', '1Y', '5Y']

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-ink-900 text-paper-50 text-2xs rounded px-2.5 py-1.5 shadow-lg border border-ink-800">
      <p className="text-paper-300">{formatDate(label, { short: true })}</p>
      <p className="font-semibold data-mono">{formatINR(payload[0].value)}</p>
    </div>
  )
}

export default function PriceChart({ data, range, onRangeChange, isPositiveTrend }) {
  const strokeColor = isPositiveTrend ? '#0E8A4B' : '#C22A2A'
  const fillId = isPositiveTrend ? 'gainFill' : 'lossFill'

  return (
    <div>
      <div className="flex items-center justify-end gap-1 mb-2 no-print">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => onRangeChange(r)}
            className={`px-2.5 py-1 text-2xs font-medium rounded border transition-colors ${
              range === r
                ? 'bg-accent text-white border-accent'
                : 'bg-white text-ink-600 border-paper-300 hover:border-accent hover:text-accent'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gainFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0E8A4B" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#0E8A4B" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lossFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C22A2A" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#C22A2A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#E9ECF2" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#5B6B82' }}
              tickFormatter={(d) => formatDate(d, { short: true }).slice(0, 6)}
              minTickGap={40}
              axisLine={{ stroke: '#DCE1EA' }}
              tickLine={false}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: '#5B6B82' }}
              width={56}
              tickFormatter={(v) => `₹${Math.round(v)}`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={strokeColor}
              strokeWidth={1.75}
              fill={`url(#${fillId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
