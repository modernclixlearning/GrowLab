/**
 * GrowLab Crypto Utility — AES-256-GCM encryption for sensor API keys
 *
 * API keys from cloud providers (Govee, Inkbird, SwitchBot) are encrypted
 * at rest using AES-256-GCM before being stored in sensor_devices.api_key_encrypted.
 *
 * Storage format: base64(iv):base64(ciphertext):base64(authTag)
 *
 * The key encryption key (KEK) is loaded from SENSOR_KEK env var (64 hex chars = 32 bytes).
 * Generate with: openssl rand -hex 32
 *
 * Security: F5 / RR6
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALG = 'aes-256-gcm'
const KEY_LENGTH = 32 // bytes

function getKek(): Buffer {
  const kek = process.env.SENSOR_KEK
  if (!kek) throw new Error('SENSOR_KEK env var not set')
  const buf = Buffer.from(kek, 'hex')
  if (buf.length !== KEY_LENGTH)
    throw new Error('SENSOR_KEK must be 32 bytes hex (64 hex chars)')
  return buf
}

/**
 * Encrypt a plain-text API key using AES-256-GCM.
 * Returns a ':'-separated base64 string: iv:ciphertext:authTag
 */
export function encryptApiKey(plaintext: string): string {
  const kek = getKek()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALG, kek, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv, encrypted, authTag].map((b) => b.toString('base64')).join(':')
}

/**
 * Decrypt a stored API key. Throws if tampered or missing fields.
 */
export function decryptApiKey(stored: string): string {
  const kek = getKek()
  const parts = stored.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted key format')
  const [ivB64, ctB64, tagB64] = parts as [string, string, string]
  const iv = Buffer.from(ivB64, 'base64')
  const ciphertext = Buffer.from(ctB64, 'base64')
  const authTag = Buffer.from(tagB64, 'base64')
  const decipher = createDecipheriv(ALG, kek, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}
