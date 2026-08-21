import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

// Converts research-score breakdown into risk exposure (inverse of strength)
// so a higher radar value = higher relative risk on that dimension.
function toRiskData(score) {
  const inv = (v) => (v === null || v === undefined ? null : 100 - v)
  return [
    { axis: 'Growth Risk', value: inv(score.breakdown.growth) },
    { axis: 'Profitability Risk', value: inv(score.breakdown.profitability) },
    { axis: 'Leverage Risk', value: inv(score.breakdown.financialHealth) },
    { axis: 'Valuation Risk', value: inv(score.breakdown.valuation) },
    { axis: 'Price Stability Risk', value: inv(score.breakdown.stability) },
  ].filter((d) => d.value !== null)
}

export default function RiskRadar({ score }) {
  const data = toRiskData(score)
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="#E9ECF2" />
          <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: '#5B6B82' }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#9AA6B8' }} tickCount={4} />
          <Radar dataKey="value" stroke="#C22A2A" strokeWidth={1.5} fill="#C22A2A" fillOpacity={0.18} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
