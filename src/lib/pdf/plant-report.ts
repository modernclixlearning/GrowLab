interface PlantForPDF {
  id: string
  name: string
  strainName?: string | null
  strainType: string
  growthStage: string
  healthStatus?: string | null
  createdAt: string
}

interface CareLogForPDF {
  id: string
  logType: string
  loggedAt: string
  amount?: string | null
  unit?: string | null
  notes?: string | null
}

interface GrowthForPDF {
  id: string
  metric: string
  value: string
  recordedAt: string
}

export async function generatePlantPDF(
  plant: PlantForPDF,
  careLogs: CareLogForPDF[],
  growthMeasurements: GrowthForPDF[],
): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const margin = 15
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - margin * 2
  let y = margin

  // Title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(plant.name, margin, y)
  y += 8

  // Subtitle
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(
    `${plant.strainName ?? plant.strainType} · ${plant.growthStage} · Planted ${new Date(plant.createdAt).toLocaleDateString()}`,
    margin,
    y,
  )
  doc.setTextColor(0, 0, 0)
  y += 10

  // Divider
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6

  // Care logs section
  if (careLogs.length > 0) {
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Care Logs', margin, y)
    y += 6

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')

    const colWidths = [30, 25, 20, 15, contentWidth - 30 - 25 - 20 - 15]
    const colHeaders = ['Date', 'Type', 'Amount', 'Unit', 'Notes']

    // Header row
    doc.setFont('helvetica', 'bold')
    let x = margin
    colHeaders.forEach((h, i) => {
      doc.text(h, x, y)
      x += colWidths[i]!
    })
    y += 5

    doc.setFont('helvetica', 'normal')
    for (const log of careLogs.slice(0, 30)) {
      if (y > 270) { doc.addPage(); y = margin }
      x = margin
      const cols = [
        new Date(log.loggedAt).toLocaleDateString(),
        log.logType,
        log.amount ?? '',
        log.unit ?? '',
        (log.notes ?? '').slice(0, 40),
      ]
      cols.forEach((v, i) => {
        doc.text(String(v), x, y)
        x += colWidths[i]!
      })
      y += 5
    }
    y += 4
  }

  // Growth section
  if (growthMeasurements.length > 0) {
    if (y > 250) { doc.addPage(); y = margin }
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Growth Measurements', margin, y)
    y += 6

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')

    const colWidths2 = [35, 30, 40]
    const colHeaders2 = ['Date', 'Metric', 'Value']

    doc.setFont('helvetica', 'bold')
    let x = margin
    colHeaders2.forEach((h, i) => { doc.text(h, x, y); x += colWidths2[i]! })
    y += 5

    doc.setFont('helvetica', 'normal')
    for (const m of growthMeasurements.slice(0, 30)) {
      if (y > 270) { doc.addPage(); y = margin }
      x = margin
      const cols2 = [new Date(m.recordedAt).toLocaleDateString(), m.metric, m.value]
      cols2.forEach((v, i) => { doc.text(String(v), x, y); x += colWidths2[i]! })
      y += 5
    }
  }

  const dateStr = new Date().toISOString().slice(0, 10)
  const safeName = plant.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
  doc.save(`growlab-${safeName}-${dateStr}.pdf`)
}
