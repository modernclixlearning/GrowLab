import { Hono } from 'hono'
import { authenticate } from '../lib/auth-middleware'
import { exportQuerySchema } from '../api/export/schemas'
import {
  buildPlantsCSV,
  buildCareLogsCSV,
  buildSensorReadingsCSV,
  buildGrowthCSV,
  buildPhotosMetadataCSV,
  buildExportZip,
} from '../api/export/service'

export const exportRoutes = new Hono()

/** GET /api/export — returns a ZIP with 5 CSV files */
exportRoutes.get('/', async (c) => {
  const auth = await authenticate(c.req.raw)
  if (!auth.authenticated) return auth.response as Response

  const rawParams = Object.fromEntries(new URL(c.req.raw.url).searchParams.entries())
  const validation = exportQuerySchema.safeParse(rawParams)
  if (!validation.success) {
    return c.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid query params' } },
      400,
    )
  }

  const { sensorFrom, sensorTo, deviceId } = validation.data
  const now = new Date()
  const from = sensorFrom ? new Date(sensorFrom) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const to = sensorTo ? new Date(sensorTo) : now

  try {
    const [plantsCSV, careLogsCSV, sensorReadingsCSV, growthCSV, photosCSV] =
      await Promise.all([
        buildPlantsCSV(auth.user.userId),
        buildCareLogsCSV(auth.user.userId),
        buildSensorReadingsCSV(auth.user.userId, from, to, deviceId),
        buildGrowthCSV(auth.user.userId),
        buildPhotosMetadataCSV(auth.user.userId),
      ])

    const zip = buildExportZip({
      'plants.csv': plantsCSV,
      'care-logs.csv': careLogsCSV,
      'sensor-readings.csv': sensorReadingsCSV,
      'growth-measurements.csv': growthCSV,
      'photos-metadata.csv': photosCSV,
    })

    const dateStr = now.toISOString().slice(0, 10)
    return new Response(zip, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="growlab-export-${dateStr}.zip"`,
        'Content-Length': String(zip.byteLength),
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Export failed' } }, 500)
  }
})
