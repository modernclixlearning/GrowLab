/**
 * GrowLab — Sensors crypto tests (F5)
 *
 * Tests for AES-256-GCM encrypt/decrypt round-trip,
 * error handling on invalid inputs, and mock provider behavior.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// ─── encryptApiKey / decryptApiKey ─────────────────────────────────────────

describe('encryptApiKey / decryptApiKey', () => {
  const VALID_KEK = 'a'.repeat(64) // 64 hex chars = 32 bytes

  beforeEach(() => {
    process.env.SENSOR_KEK = VALID_KEK
  })

  afterEach(() => {
    delete process.env.SENSOR_KEK
  })

  it('round-trips a plaintext API key', async () => {
    const { encryptApiKey, decryptApiKey } = await import('@/server/lib/crypto')
    const plaintext = 'my-super-secret-api-key-12345'
    const stored = encryptApiKey(plaintext)
    expect(stored).not.toBe(plaintext)
    expect(stored).toContain(':') // iv:ciphertext:tag format
    expect(decryptApiKey(stored)).toBe(plaintext)
  })

  it('produces different ciphertexts for the same plaintext (random IV)', async () => {
    const { encryptApiKey } = await import('@/server/lib/crypto')
    const a = encryptApiKey('test-key')
    const b = encryptApiKey('test-key')
    expect(a).not.toBe(b)
  })

  it('throws when SENSOR_KEK is not set', async () => {
    delete process.env.SENSOR_KEK
    // Force re-import to reset cached module
    vi.resetModules()
    const { encryptApiKey } = await import('@/server/lib/crypto')
    expect(() => encryptApiKey('test')).toThrow(/SENSOR_KEK/)
  })

  it('throws when SENSOR_KEK is wrong length', async () => {
    process.env.SENSOR_KEK = 'tooshort'
    vi.resetModules()
    const { encryptApiKey } = await import('@/server/lib/crypto')
    expect(() => encryptApiKey('test')).toThrow(/32 bytes/)
  })

  it('throws on corrupt stored string (wrong segment count)', async () => {
    vi.resetModules()
    process.env.SENSOR_KEK = VALID_KEK
    const { decryptApiKey } = await import('@/server/lib/crypto')
    expect(() => decryptApiKey('onlyone')).toThrow(/Invalid encrypted key format/)
  })
})

// ─── Govee mock provider ────────────────────────────────────────────────────

describe('GoveeProvider (SENSOR_MOCK=true)', () => {
  beforeEach(() => {
    process.env.SENSOR_MOCK = 'true'
    vi.resetModules()
  })

  afterEach(() => {
    delete process.env.SENSOR_MOCK
    vi.resetModules()
  })

  it('returns mock humidity and temperature readings', async () => {
    const { GoveeProvider } = await import('@/server/integrations/govee')
    const provider = new GoveeProvider()
    const readings = await provider.fetchReadings({ apiKey: 'mock-key' })

    expect(readings.length).toBeGreaterThanOrEqual(2)
    const metrics = readings.map((r) => r.metric)
    expect(metrics).toContain('humidity')
    expect(metrics).toContain('temperature')

    for (const r of readings) {
      expect(typeof r.value).toBe('number')
      expect(typeof r.unit).toBe('string')
      expect(r.recordedAt).toBeInstanceOf(Date)
    }
  })
})
