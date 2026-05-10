/**
 * GrowLab Sensor Service (F5)
 *
 * Business logic for sensor device management and readings queries.
 * Verifies ownership before every operation.
 */

import { eq, and, desc, gte, lte } from 'drizzle-orm'
import { db } from '@/server/db'
import { sensorDevices, type SensorDevice } from '@/server/db/schema/sensor-devices'
import { sensorReadings } from '@/server/db/schema/sensor-readings'
import { plants } from '@/server/db/schema/plants'
import { tents } from '@/server/db/schema/tents'
import { encryptApiKey } from '@/server/lib/crypto'
import { nanoid } from 'nanoid'
import type { CreateSensorDeviceInput, UpdateSensorDeviceInput, ListReadingsQuery } from './schemas'

export const SensorErrorCodes = {
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
  DEVICE_FORBIDDEN: 'DEVICE_FORBIDDEN',
  PLANT_NOT_FOUND: 'PLANT_NOT_FOUND',
  TENT_NOT_FOUND: 'TENT_NOT_FOUND',
} as const

export type SensorResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function verifyPlantOwnership(
  plantId: string,
  userId: string,
): Promise<SensorResult<true>> {
  const plant = await db.query.plants.findFirst({
    where: eq(plants.id, plantId),
    columns: { id: true, userId: true },
  })
  if (!plant) {
    return { success: false, error: { code: SensorErrorCodes.PLANT_NOT_FOUND, message: 'Plant not found' } }
  }
  if (plant.userId !== userId) {
    return { success: false, error: { code: SensorErrorCodes.PLANT_NOT_FOUND, message: 'Plant not found' } }
  }
  return { success: true, data: true }
}

async function verifyTentOwnership(
  tentId: string,
  userId: string,
): Promise<SensorResult<true>> {
  const tent = await db.query.tents.findFirst({
    where: eq(tents.id, tentId),
    columns: { id: true, userId: true },
  })
  if (!tent) {
    return { success: false, error: { code: SensorErrorCodes.TENT_NOT_FOUND, message: 'Tent not found' } }
  }
  if (tent.userId !== userId) {
    return { success: false, error: { code: SensorErrorCodes.TENT_NOT_FOUND, message: 'Tent not found' } }
  }
  return { success: true, data: true }
}

// ─── Safe response type (never exposes apiKeyEncrypted) ──────────────────────

type SafeSensorDevice = Omit<SensorDevice, 'apiKeyEncrypted'>

function toSafe(device: SensorDevice): SafeSensorDevice {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { apiKeyEncrypted: _dropped, ...safe } = device
  return safe
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function createSensorDevice(
  userId: string,
  input: CreateSensorDeviceInput,
): Promise<SensorResult<{ device: SafeSensorDevice }>> {
  // Verify target ownership
  if (input.targetPlantId) {
    const check = await verifyPlantOwnership(input.targetPlantId, userId)
    if (!check.success) return check
  }
  if (input.targetTentId) {
    const check = await verifyTentOwnership(input.targetTentId, userId)
    if (!check.success) return check
  }

  const apiKeyEncrypted = input.apiKey ? encryptApiKey(input.apiKey) : null

  const [device] = await db
    .insert(sensorDevices)
    .values({
      id: nanoid(),
      userId,
      provider: input.provider,
      apiKeyEncrypted,
      label: input.label,
      targetPlantId: input.targetPlantId ?? null,
      targetTentId: input.targetTentId ?? null,
    })
    .returning()

  if (!device) {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create device' } }
  }

  return { success: true, data: { device: toSafe(device) } }
}

export async function listSensorDevices(
  userId: string,
): Promise<SensorResult<{ devices: SafeSensorDevice[] }>> {
  const devices = await db
    .select()
    .from(sensorDevices)
    .where(eq(sensorDevices.userId, userId))
    .orderBy(desc(sensorDevices.createdAt))

  return { success: true, data: { devices: devices.map(toSafe) } }
}

export async function getSensorDevice(
  deviceId: string,
  userId: string,
): Promise<SensorResult<{ device: SafeSensorDevice }>> {
  const device = await db.query.sensorDevices.findFirst({
    where: eq(sensorDevices.id, deviceId),
  })
  if (!device) {
    return { success: false, error: { code: SensorErrorCodes.DEVICE_NOT_FOUND, message: 'Device not found' } }
  }
  if (device.userId !== userId) {
    return { success: false, error: { code: SensorErrorCodes.DEVICE_FORBIDDEN, message: 'Access denied' } }
  }
  return { success: true, data: { device: toSafe(device) } }
}

export async function updateSensorDevice(
  deviceId: string,
  userId: string,
  input: UpdateSensorDeviceInput,
): Promise<SensorResult<{ device: SafeSensorDevice }>> {
  const existing = await db.query.sensorDevices.findFirst({
    where: eq(sensorDevices.id, deviceId),
  })
  if (!existing) {
    return { success: false, error: { code: SensorErrorCodes.DEVICE_NOT_FOUND, message: 'Device not found' } }
  }
  if (existing.userId !== userId) {
    return { success: false, error: { code: SensorErrorCodes.DEVICE_FORBIDDEN, message: 'Access denied' } }
  }

  const updates: Partial<SensorDevice> = {}
  if (input.provider !== undefined) updates.provider = input.provider
  if (input.label !== undefined) updates.label = input.label
  if (input.targetPlantId !== undefined) updates.targetPlantId = input.targetPlantId
  if (input.targetTentId !== undefined) updates.targetTentId = input.targetTentId
  if (input.apiKey !== undefined) updates.apiKeyEncrypted = encryptApiKey(input.apiKey)

  const [updated] = await db
    .update(sensorDevices)
    .set(updates)
    .where(eq(sensorDevices.id, deviceId))
    .returning()

  if (!updated) {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update device' } }
  }

  return { success: true, data: { device: toSafe(updated) } }
}

export async function deleteSensorDevice(
  deviceId: string,
  userId: string,
): Promise<SensorResult<{ deleted: true }>> {
  const existing = await db.query.sensorDevices.findFirst({
    where: eq(sensorDevices.id, deviceId),
  })
  if (!existing) {
    return { success: false, error: { code: SensorErrorCodes.DEVICE_NOT_FOUND, message: 'Device not found' } }
  }
  if (existing.userId !== userId) {
    return { success: false, error: { code: SensorErrorCodes.DEVICE_FORBIDDEN, message: 'Access denied' } }
  }

  await db.delete(sensorDevices).where(eq(sensorDevices.id, deviceId))
  return { success: true, data: { deleted: true } }
}

export async function listReadings(
  userId: string,
  query: ListReadingsQuery,
): Promise<SensorResult<{ readings: (typeof sensorReadings.$inferSelect)[] }>> {
  // Verify ownership of the target plant or tent
  if (query.plantId) {
    const check = await verifyPlantOwnership(query.plantId, userId)
    if (!check.success) return check
  }
  if (query.tentId) {
    const check = await verifyTentOwnership(query.tentId, userId)
    if (!check.success) return check
  }

  const conditions = []

  if (query.plantId) conditions.push(eq(sensorReadings.plantId, query.plantId))
  if (query.tentId) conditions.push(eq(sensorReadings.tentId, query.tentId))
  if (query.metric) conditions.push(eq(sensorReadings.metric, query.metric))
  if (query.from) conditions.push(gte(sensorReadings.recordedAt, new Date(query.from)))
  if (query.to) conditions.push(lte(sensorReadings.recordedAt, new Date(query.to)))

  const readings = await db
    .select()
    .from(sensorReadings)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(sensorReadings.recordedAt))
    .limit(query.limit)

  return { success: true, data: { readings } }
}
