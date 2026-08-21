import { AreaChart, Area, ResponsiveContainer } from 'recharts'

export default function Sparkline({ data, positive = true, height = 44 }) {
  const stroke = positive ? '#0E8A4B' : '#C22A2A'
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${positive ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="price"
            stroke={stroke}
            strokeWidth={1.5}
            fill={`url(#spark-${positive ? 'up' : 'down'})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
