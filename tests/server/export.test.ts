/**
 * Export service unit tests — mock-DB approach.
 *
 * Verifies CSV output format, field escaping, the 10k-row hard cap,
 * and ZIP structure. No real DB connection needed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted shared state ──────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  selectQueue: [] as unknown[][],
}))

function makeChain(val: unknown) {
  const c: Record<string, unknown> = {}
  for (const m of ['from', 'where', 'innerJoin', 'orderBy', 'limit', 'offset', 'select']) {
    c[m] = vi.fn().mockReturnValue(c)
  }
  c['then'] = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(val).then(res, rej)
  return c
}

vi.mock('@/server/db', () => ({
  db: {
    select: vi.fn().mockImplementation(() => makeChain(mocks.selectQueue.shift() ?? [])),
    insert: vi.fn().mockReturnValue(makeChain([])),
    update: vi.fn().mockReturnValue(makeChain([])),
    delete: vi.fn().mockReturnValue(makeChain(undefined)),
  },
}))

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('buildPlantsCSV', () => {
  beforeEach(() => { mocks.selectQueue.length = 0 })

  it('produces a header with all required columns', async () => {
    mocks.selectQueue.push([])
    const { buildPlantsCSV } = await import('@/server/api/export/service')
    const csv = await buildPlantsCSV('u-1')
    const header = csv.split('\n')[0]!
    for (const col of ['id', 'name', 'strainName', 'strainType', 'growthStage', 'healthStatus', 'tentId', 'createdAt', 'updatedAt']) {
      expect(header).toContain(col)
    }
  })

  it('includes data rows for each plant', async () => {
    const plant = {
      id: 'p-1', name: 'Blue Dream', strainName: 'Blue Dream', strainType: 'hybrid',
      growthStage: 'vegetative', healthStatus: 'healthy', tentId: 't-1',
      createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-15'),
      userId: 'u-1', heroPhotoUrl: null, photoUrl: null,
      strainTemplateId: null, stageStartDate: '2026-01-01',
      notes: null, lightSchedule: null, weekOfStage: null, totalWeeks: null,
      stageDurationOverride: null, weekDeltaCache: null,
    }
    mocks.selectQueue.push([plant])
    const { buildPlantsCSV } = await import('@/server/api/export/service')
    const csv = await buildPlantsCSV('u-1')
    const lines = csv.split('\n')
    expect(lines).toHaveLength(2) // header + 1 data row
    expect(lines[1]).toContain('p-1')
    expect(lines[1]).toContain('Blue Dream')
  })
})

describe('buildCareLogsCSV — CSV escaping', () => {
  beforeEach(() => { mocks.selectQueue.length = 0 })

  it('escapes commas in the notes field', async () => {
    const row = {
      id: 'cl-1', plantId: 'p-1', plantName: 'OG Kush',
      logType: 'feed', amount: '500', unit: 'ml',
      notes: 'Added CalMag, pH 6.2',  // comma should be escaped
      loggedAt: new Date('2026-02-01'),
      scheduledAt: null, completedAt: null, recurrenceRule: null,
    }
    mocks.selectQueue.push([row])
    const { buildCareLogsCSV } = await import('@/server/api/export/service')
    const csv = await buildCareLogsCSV('u-1')
    expect(csv).toContain('"Added CalMag, pH 6.2"')
  })

  it('escapes double quotes in notes by doubling them', async () => {
    const row = {
      id: 'cl-2', plantId: 'p-1', plantName: 'Tent A',
      logType: 'water', amount: null, unit: null,
      notes: 'Watered with "filtered" water',
      loggedAt: new Date('2026-02-02'),
      scheduledAt: null, completedAt: null, recurrenceRule: null,
    }
    mocks.selectQueue.push([row])
    const { buildCareLogsCSV } = await import('@/server/api/export/service')
    const csv = await buildCareLogsCSV('u-1')
    expect(csv).toContain('"Watered with ""filtered"" water"')
  })
})

describe('buildSensorReadingsCSV — hard cap', () => {
  beforeEach(() => { mocks.selectQueue.length = 0 })

  it('adds warning line when over 10000 rows are returned', async () => {
    // Simulate DB returning 10001 rows (1 over cap)
    const mockDevices = [{ id: 'dev-1', label: 'Sensor A' }]
    const mockReadings = Array.from({ length: 10_001 }, (_, i) => ({
      id: `r-${i}`, sensorDeviceId: 'dev-1', plantId: null, tentId: 't-1',
      metric: 'humidity', value: '60.00', unit: '%',
      recordedAt: new Date(),
    }))
    mocks.selectQueue.push(mockDevices, mockReadings)

    const { buildSensorReadingsCSV } = await import('@/server/api/export/service')
    const from = new Date('2026-01-01')
    const to = new Date()
    const csv = await buildSensorReadingsCSV('u-1', from, to)

    const lines = csv.split('\n')
    expect(lines[0]).toBe(
      '# WARNING: results truncated to 10000 rows (most recent). Use sensorFrom/sensorTo to filter.',
    )
    // warning + header + 10000 data rows = 10002 lines
    expect(lines).toHaveLength(10_002)
  })

  it('does NOT add warning when under cap', async () => {
    const mockDevices = [{ id: 'dev-1', label: 'Sensor A' }]
    const mockReadings = Array.from({ length: 5 }, (_, i) => ({
      id: `r-${i}`, sensorDeviceId: 'dev-1', plantId: null, tentId: 't-1',
      metric: 'humidity', value: '60.00', unit: '%', recordedAt: new Date(),
    }))
    mocks.selectQueue.push(mockDevices, mockReadings)

    const { buildSensorReadingsCSV } = await import('@/server/api/export/service')
    const csv = await buildSensorReadingsCSV('u-1', new Date('2026-01-01'), new Date())
    expect(csv.startsWith('#')).toBe(false)
  })
})

describe('buildExportZip', () => {
  it('returns a Uint8Array ZIP containing exactly 5 named entries', async () => {
    const { buildExportZip } = await import('@/server/api/export/service')
    const csvMap = {
      'plants.csv': 'id,name\np-1,Rose',
      'care-logs.csv': 'id,logType\ncl-1,water',
      'sensor-readings.csv': 'id,metric\nr-1,humidity',
      'growth-measurements.csv': 'id,metric\ng-1,height_cm',
      'photos-metadata.csv': 'id,url\nph-1,https://example.com/photo.jpg',
    }
    const zip = buildExportZip(csvMap)

    expect(zip).toBeInstanceOf(Uint8Array)
    expect(zip.length).toBeGreaterThan(0)

    // Verify ZIP signature (PK magic bytes: 0x50 0x4B)
    expect(zip[0]).toBe(0x50)
    expect(zip[1]).toBe(0x4B)

    // Verify all 5 filenames are present in the ZIP bytes
    const text = new TextDecoder('latin1').decode(zip)
    for (const filename of Object.keys(csvMap)) {
      expect(text).toContain(filename)
    }
  })
})
