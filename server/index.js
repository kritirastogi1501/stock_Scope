import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { marketRouter } from './routes/market.js'

const app = express()
const PORT = process.env.PORT || 8787

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ ok: true }))
app.use('/api/market', marketRouter)

app.use((err, req, res, next) => {
  console.error('[server error]', err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`StockScope AI backend listening on http://localhost:${PORT}`)
  if (!process.env.MARKET_API_KEY) {
    console.warn('MARKET_API_KEY not set — /api/market routes will fail until configured in server/.env')
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Supabase not configured — caching disabled, provider will be called every request')
  }
})
