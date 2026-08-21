// Research report assembly + export service.

import { marketService } from './marketService'
import { aiService } from './aiService'
import { newsService } from './newsService'
import { databaseService } from './databaseService'
import { formatINR, formatMarketCap, formatPercent, formatDate, formatMetric } from '../utils/formatters'

export const reportService = {
  /**
   * Pulls together all data needed to render a full research report
   * for a given ticker: metrics, price performance, AI analysis,
   * developments and client explanation.
   */
  async buildReport(ticker) {
    const [stockRes, historyRes, aiRes, newsRes, clientRes] = await Promise.all([
      marketService.getStock(ticker),
      marketService.getPriceHistory(ticker, '1Y'),
      (async () => {
        const s = await marketService.getStock(ticker)
        return aiService.generateResearch(s.data)
      })(),
      newsService.getDevelopments(ticker),
      (async () => {
        const s = await marketService.getStock(ticker)
        return aiService.generateClientExplanation(s.data)
      })(),
    ])

    return {
      stock: stockRes.data,
      history: historyRes.data,
      ai: aiRes.data,
      news: newsRes.data,
      clientExplanation: clientRes.data,
      generatedAt: new Date().toISOString(),
      isDemo: true,
    }
  },

  /**
   * Persists a generated report to the database (Supabase, or a local
   * fallback if the database is unavailable — see databaseService).
   */
  async saveReport(report) {
    const { report: saved, source } = await databaseService.saveReport({
      ticker: report.stock.ticker,
      title: `${report.stock.name} (${report.stock.ticker}) — Research Report`,
      generatedAnalysis: {
        ai: report.ai,
        news: report.news,
        clientExplanation: report.clientExplanation,
      },
      dataSnapshot: {
        stock: report.stock,
        generatedAt: report.generatedAt,
      },
    })
    return { report: saved, source }
  },

  /**
   * Lists previously saved reports, optionally filtered by ticker.
   */
  async listSavedReports(ticker) {
    return databaseService.getReports(ticker)
  },

  /**
   * Loads a single saved report by id and reshapes it back into the
   * same structure `buildReport` produces, so ReportView can render it
   * without special-casing "saved" vs "freshly generated" reports.
   */
  async loadSavedReport(id) {
    const { report, source } = await databaseService.getReportById(id)
    if (!report) return null
    const analysis = report.generated_analysis || report.generatedAnalysis
    const snapshot = report.data_snapshot || report.dataSnapshot
    return {
      id: report.id,
      stock: snapshot.stock,
      ai: analysis.ai,
      news: analysis.news,
      clientExplanation: analysis.clientExplanation,
      generatedAt: snapshot.generatedAt || report.created_at,
      isDemo: snapshot.stock?._meta?.isDemo ?? true,
      source,
      saved: true,
    }
  },

  /**
   * Exports the given report as a downloadable PDF using jsPDF.
   * This is a lightweight text-layout export, not a pixel-perfect
   * replica of the on-screen report.
   */
  async exportPdf(report) {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const marginX = 48
    let y = 56
    const pageWidth = doc.internal.pageSize.getWidth()
    const maxWidth = pageWidth - marginX * 2
    const lineGap = 15

    const addSpace = (h = 10) => {
      y += h
    }

    const checkPageBreak = (needed = 20) => {
      if (y + needed > doc.internal.pageSize.getHeight() - 48) {
        doc.addPage()
        y = 56
      }
    }

    const heading = (text, size = 14) => {
      checkPageBreak(size + 12)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(size)
      doc.setTextColor(14, 31, 56)
      doc.text(text, marginX, y)
      y += size + 8
    }

    const body = (text, size = 10) => {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(size)
      doc.setTextColor(40, 50, 65)
      const lines = doc.splitTextToSize(text, maxWidth)
      lines.forEach((line) => {
        checkPageBreak(lineGap)
        doc.text(line, marginX, y)
        y += lineGap
      })
      addSpace(4)
    }

    const bulletList = (items) => {
      items.forEach((item) => {
        const lines = doc.splitTextToSize(`•  ${item}`, maxWidth)
        lines.forEach((line, idx) => {
          checkPageBreak(lineGap)
          doc.text(line, marginX + (idx === 0 ? 0 : 12), y)
          y += lineGap
        })
      })
      addSpace(4)
    }

    const { stock, ai, news, clientExplanation } = report

    // Header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(27, 79, 156)
    doc.text('StockScope AI — Equity Research Report', marginX, y)
    y += 26
    doc.setFontSize(10)
    doc.setTextColor(90, 100, 115)
    doc.text(`Generated ${formatDate(report.generatedAt, { short: true })} · Demo research report`, marginX, y)
    y += 24

    heading(`${stock.name} (${stock.ticker})`, 16)
    body(`${stock.sector} · ${stock.exchange}`)
    body(
      `Price: ${formatINR(stock.price)}   Change: ${formatPercent(stock.changePct)}   Market Cap: ${formatMarketCap(stock.marketCapCr)}`
    )

    heading('Key Metrics')
    body(
      `P/E: ${stock.pe.toFixed(1)}x   P/B: ${stock.pb.toFixed(1)}x   EPS: ₹${stock.eps.toFixed(1)}   ROE: ${stock.roe.toFixed(1)}%   ROCE: ${formatMetric(stock.roce, 1, '%')}`
    )
    body(
      `Debt/Equity: ${formatMetric(stock.debtToEquity, 2)}   Dividend Yield: ${stock.dividendYield.toFixed(1)}%   52W High/Low: ₹${stock.week52High} / ₹${stock.week52Low}`
    )
    body(
      `Data source: ${stock._meta?.isDemo === false ? 'Live (Alpha Vantage, end-of-day)' : 'Demo / simulated data'}${
        stock._meta?.fetchedAt ? `   Last updated: ${formatDate(stock._meta.fetchedAt, { short: true })}` : ''
      }`
    )
    body(
      `Revenue Growth: ${stock.revenueGrowth.toFixed(1)}%   Profit Growth: ${stock.profitGrowth.toFixed(1)}%   Net Margin: ${stock.netMargin.toFixed(1)}%`
    )

    heading('Fundamental Research Score')
    body(`Overall: ${ai.score.overall}/100`)
    body(
      `Growth ${ai.score.breakdown.growth} · Profitability ${ai.score.breakdown.profitability} · Financial Health ${ai.score.breakdown.financialHealth} · Valuation ${ai.score.breakdown.valuation} · Stability ${ai.score.breakdown.stability}`
    )

    heading('AI Research Summary')
    body(ai.businessSnapshot)

    heading('What Looks Strong', 12)
    bulletList(ai.strengths)

    heading('What Needs Attention', 12)
    bulletList(ai.attention)

    heading('Bull Case', 12)
    body(ai.bullCase)

    heading('Bear Case', 12)
    body(ai.bearCase)

    heading('Key Risks', 12)
    bulletList(ai.risks)

    heading('Recent Developments', 12)
    if (news.length === 0) {
      body('No recent developments available in demo data.')
    } else {
      news.slice(0, 6).forEach((n) => {
        body(`${formatDate(n.date, { short: true })} — ${n.headline} [${n.category}, ${n.impact}]`)
      })
    }

    heading('Explain to Client', 12)
    body(clientExplanation)

    checkPageBreak(60)
    y += 8
    doc.setDrawColor(220, 225, 234)
    doc.line(marginX, y, pageWidth - marginX, y)
    y += 18
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8.5)
    doc.setTextColor(120, 130, 145)
    const disclaimer =
      'StockScope AI provides research and educational information only. It does not constitute investment advice, a recommendation, or a guarantee of future performance. All data shown is simulated demo data unless connected to a live source.'
    doc.text(doc.splitTextToSize(disclaimer, maxWidth), marginX, y)

    doc.save(`${stock.ticker}_StockScope_Research_Report.pdf`)
  },
}
