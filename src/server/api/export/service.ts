import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { zipSync } from 'fflate'
import { db } from '@/server/db'
import { plants } from '@/server/db/schema/plants'
import { careLogs } from '@/server/db/schema/care-logs'
import { sensorReadings } from '@/server/db/schema/sensor-readings'
import { sensorDevices } from '@/server/db/schema/sensor-devices'
import { growthMeasurements } from '@/server/db/schema/growth-measurements'
import { plantPhotos } from '@/server/db/schema/plant-photos'

const SENSOR_ROW_CAP = 10_000
const WARNING_LINE =
  '# WARNING: results truncated to 10000 rows (most recent). Use sensorFrom/sensorTo to filter.'

// ── CSV helpers ───────────────────────────────────────────────────────────────

function csvEscape(val: unknown): string {
  if (val === null || val === undefined) return ''
  const s = String(val)
  // RFC 4180: if the field contains a comma, double-quote, or newline, wrap in
  // double quotes and escape any internal double quotes by doubling them.
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function buildCSV(headers: string[], rows: unknown[][]): string {
  const headerLine = headers.map(csvEscape).join(',')
  const dataLines = rows.map((row) => row.map(csvEscape).join(','))
  return [headerLine, ...dataLines].join('\n')
}

// ── CSV builders ──────────────────────────────────────────────────────────────

export async function buildPlantsCSV(userId: string): Promise<string> {
  const rows = await db
    .select()
    .from(plants)
    .where(eq(plants.userId, userId))

  const headers = ['id', 'name', 'strainName', 'strainType', 'growthStage', 'healthStatus', 'tentId', 'createdAt', 'updatedAt']
  const data = rows.map((r) => [
    r.id, r.name, r.strainName, r.strainType, r.growthStage,
    r.healthStatus, r.tentId, r.createdAt?.toISOString(), r.updatedAt?.toISOString(),
  ])
  return buildCSV(headers, data)
}

export async function buildCareLogsCSV(userId: string): Promise<string> {
  const rows = await db
    .select({
      id: careLogs.id,
      plantId: careLogs.plantId,
      plantName: plants.name,
      logType: careLogs.logType,
      amount: careLogs.amount,
      unit: careLogs.unit,
      notes: careLogs.notes,
      loggedAt: careLogs.loggedAt,
      scheduledAt: careLogs.scheduledAt,
      completedAt: careLogs.completedAt,
      recurrenceRule: careLogs.recurrenceRule,
    })
    .from(careLogs)
    .innerJoin(plants, eq(careLogs.plantId, plants.id))
    .where(eq(plants.userId, userId))

  const headers = ['id', 'plantId', 'plantName', 'logType', 'amount', 'unit', 'notes', 'loggedAt', 'scheduledAt', 'completedAt', 'recurrenceRule']
  const data = rows.map((r) => [
    r.id, r.plantId, r.plantName, r.logType, r.amount, r.unit, r.notes,
    r.loggedAt?.toISOString(), r.scheduledAt?.toISOString(),
    r.completedAt?.toISOString(),
    r.recurrenceRule ? JSON.stringify(r.recurrenceRule) : null,
  ])
  return buildCSV(headers, data)
}

export async function buildSensorReadingsCSV(
  userId: string,
  from: Date,
  to: Date,
  deviceId?: string,
): Promise<string> {
  // Fetch user's devices first to enforce ownership.
  const userDevices = await db
    .select({ id: sensorDevices.id, label: sensorDevices.label })
    .from(sensorDevices)
    .where(eq(sensorDevices.userId, userId))

  const userDeviceIds = userDevices.map((d) => d.id)
  const deviceLabelMap = Object.fromEntries(userDevices.map((d) => [d.id, d.label]))

  if (userDeviceIds.length === 0) {
    return buildCSV(['id', 'sensorDeviceId', 'deviceLabel', 'plantId', 'tentId', 'metric', 'value', 'unit', 'recordedAt'], [])
  }

  const targetDeviceId = deviceId && userDeviceIds.includes(deviceId) ? deviceId : undefined
  const deviceFilter = targetDeviceId ? eq(sensorReadings.sensorDeviceId, targetDeviceId) : undefined

  const rows = await db
    .select()
    .from(sensorReadings)
    .where(
      and(
        deviceFilter,
        gte(sensorReadings.recordedAt, from),
        lte(sensorReadings.recordedAt, to),
      ),
    )
    .orderBy(desc(sensorReadings.recordedAt))
    .limit(SENSOR_ROW_CAP + 1)

  const truncated = rows.length > SENSOR_ROW_CAP
  const capped = truncated ? rows.slice(0, SENSOR_ROW_CAP) : rows

  const headers = ['id', 'sensorDeviceId', 'deviceLabel', 'plantId', 'tentId', 'metric', 'value', 'unit', 'recordedAt']
  const data = capped
    .filter((r) => !targetDeviceId || userDeviceIds.includes(r.sensorDeviceId))
    .map((r) => [
      r.id, r.sensorDeviceId, deviceLabelMap[r.sensorDeviceId] ?? '',
      r.plantId, r.tentId, r.metric, r.value, r.unit, r.recordedAt?.toISOString(),
    ])

  const csv = buildCSV(headers, data)
  return truncated ? `${WARNING_LINE}\n${csv}` : csv
}

export async function buildGrowthCSV(userId: string): Promise<string> {
  const rows = await db
    .select({
      id: growthMeasurements.id,
      plantId: growthMeasurements.plantId,
      plantName: plants.name,
      metric: growthMeasurements.metric,
      value: growthMeasurements.value,
      recordedAt: growthMeasurements.recordedAt,
    })
    .from(growthMeasurements)
    .innerJoin(plants, eq(growthMeasurements.plantId, plants.id))
    .where(eq(plants.userId, userId))

  const headers = ['id', 'plantId', 'plantName', 'metric', 'value', 'recordedAt']
  const data = rows.map((r) => [r.id, r.plantId, r.plantName, r.metric, r.value, r.recordedAt?.toISOString()])
  return buildCSV(headers, data)
}

export async function buildPhotosMetadataCSV(userId: string): Promise<string> {
  const rows = await db
    .select({
      id: plantPhotos.id,
      plantId: plantPhotos.plantId,
      plantName: plants.name,
      stage: plantPhotos.stage,
      url: plantPhotos.url,
      sourceType: plantPhotos.sourceType,
      aiProvider: plantPhotos.aiProvider,
      createdAt: plantPhotos.createdAt,
    })
    .from(plantPhotos)
    .innerJoin(plants, eq(plantPhotos.plantId, plants.id))
    .where(eq(plants.userId, userId))

  const headers = ['id', 'plantId', 'plantName', 'stage', 'url', 'sourceType', 'aiProvider', 'createdAt']
  const data = rows.map((r) => [r.id, r.plantId, r.plantName, r.stage, r.url, r.sourceType, r.aiProvider, r.createdAt?.toISOString()])
  return buildCSV(headers, data)
}

export function buildExportZip(csvMap: Record<string, string>): Uint8Array {
  const files: Record<string, Uint8Array> = {}
  for (const [filename, content] of Object.entries(csvMap)) {
    // fflate expects Uint8Array; encode string as UTF-8
    files[filename] = new TextEncoder().encode(content)
  }
  return zipSync(files, { level: 6 })
}
