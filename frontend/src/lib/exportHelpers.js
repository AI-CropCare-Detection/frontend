import { jsPDF } from 'jspdf'
import { exportAnalysisPDF as exportPDF } from './pdfExport'

/**
 * Export analyses in the chosen format.
 * @param {Array} analyses - List of analysis records
 * @param {Object} options - { format: 'pdf'|'csv'|'json'|'excel', includeImages: boolean, dateFrom?, dateTo? }
 * @returns {Promise<void>}
 */
export function exportAnalyses(analyses, options = {}) {
  const { format = 'pdf', includeImages = true, dateFrom, dateTo } = options
  let filtered = analyses
  if (dateFrom || dateTo) {
    filtered = analyses.filter((a) => {
      const t = a.timestamp ? new Date(a.timestamp).getTime() : 0
      if (dateFrom && t < new Date(dateFrom).getTime()) return false
      if (dateTo && t > new Date(dateTo).getTime()) return false
      return true
    })
  }

  const filename = `CropCare-Analysis-${new Date().toISOString().slice(0, 10)}`

  if (format === 'pdf') {
    return exportPDF(filtered, includeImages)
  }

  if (format === 'csv') {
    const header = 'Date,Time Taken (s),Accuracy (%),Recovery (%),Recommendations,Insights,Image URL'
    const rows = filtered.map((a) => {
      const date = a.timestamp ? new Date(a.timestamp).toLocaleString() : ''
      const rec = (a.recommendations || '').replace(/"/g, '""')
      const ins = (a.insights || '').replace(/"/g, '""')
      return `"${date}",${a.timeTaken ?? ''},${a.accuracyRate ?? ''},${a.recoveryRate ?? ''},"${rec}","${ins}","${a.imageUrl || ''}"`
    })
    const csv = [header, ...rows].join('\n')
    downloadBlob(csv, `${filename}.csv`, 'text/csv;charset=utf-8')
    return Promise.resolve()
  }

  if (format === 'json') {
    const data = filtered.map((a) => ({
      date: a.timestamp,
      timeTaken: a.timeTaken,
      accuracyRate: a.accuracyRate,
      recoveryRate: a.recoveryRate,
      recommendations: a.recommendations,
      insights: a.insights,
      imageUrl: includeImages ? a.imageUrl : undefined,
    }))
    const json = JSON.stringify(data, null, 2)
    downloadBlob(json, `${filename}.json`, 'application/json')
    return Promise.resolve()
  }

  if (format === 'excel') {
    // Excel: emit CSV with .xlsx extension hint or use same CSV (opens in Excel)
    const header = 'Date,Time Taken (s),Accuracy (%),Recovery (%),Recommendations,Insights'
    const rows = filtered.map((a) => {
      const date = a.timestamp ? new Date(a.timestamp).toLocaleString() : ''
      const rec = (a.recommendations || '').replace(/"/g, '""')
      const ins = (a.insights || '').replace(/"/g, '""')
      return `"${date}",${a.timeTaken ?? ''},${a.accuracyRate ?? ''},${a.recoveryRate ?? ''},"${rec}","${ins}"`
    })
    const csv = [header, ...rows].join('\n')
    downloadBlob(csv, `${filename}.csv`, 'application/vnd.ms-excel;charset=utf-8')
    return Promise.resolve()
  }
}

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function getSummaryStats(analyses) {
  if (!analyses.length) return { total: 0, avgAccuracy: 0, avgRecovery: 0, commonIssues: [] }
  const total = analyses.length
  const avgAccuracy = analyses.reduce((s, a) => s + (a.accuracyRate || 0), 0) / total
  const avgRecovery = analyses.reduce((s, a) => s + (a.recoveryRate || 0), 0) / total
  const issues = analyses.flatMap((a) => (a.recommendations || '').split(/[.!?]/).filter(Boolean).map((s) => s.trim().slice(0, 50)))
  const count = {}
  issues.forEach((i) => { count[i] = (count[i] || 0) + 1 })
  const commonIssues = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name]) => name)
  return { total, avgAccuracy: Math.round(avgAccuracy), avgRecovery: Math.round(avgRecovery), commonIssues }
}
