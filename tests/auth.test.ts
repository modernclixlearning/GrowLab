/**
 * GrowLab Auth Service Tests
 * 
 * Unit tests for authentication service functions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { registerSchema, loginSchema } from '@/server/api/auth/schemas'

describe('Auth Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should validate a valid registration', () => {
      const input = {
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
      }

      const result = registerSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const input = {
        email: 'invalid-email',
        password: 'Password123',
      }

      const result = registerSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject short password', () => {
      const input = {
        email: 'test@example.com',
        password: 'short',
      }

      const result = registerSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject password without uppercase', () => {
      const input = {
        email: 'test@example.com',
        password: 'password123',
      }

      const result = registerSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject password without number', () => {
      const input = {
        email: 'test@example.com',
        password: 'PasswordABC',
      }

      const result = registerSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should allow optional name', () => {
      const input = {
        email: 'test@example.com',
        password: 'Password123',
      }

      const result = registerSchema.safeParse(input)
      expect(result.success).toBe(true)
    })
  })

  describe('loginSchema', () => {
    it('should validate valid login', () => {
      const input = {
        email: 'test@example.com',
        password: 'anypassword',
      }

      const result = loginSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should reject missing email', () => {
      const input = {
        password: 'anypassword',
      }

      const result = loginSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject missing password', () => {
      const input = {
        email: 'test@example.com',
      }

      const result = loginSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })
})

describe('Password Utilities', () => {
  it('should hash and verify password correctly', async () => {
    const { hashPassword, verifyPassword } = await import('@/server/lib/password')
    
    const password = 'TestPassword123'
    const hash = await hashPassword(password)

    // Hash should be different from original
    expect(hash).not.toBe(password)
    
    // Should verify correctly
    const isValid = await verifyPassword(password, hash)
    expect(isValid).toBe(true)

    // Wrong password should fail
    const isInvalid = await verifyPassword('WrongPassword', hash)
    expect(isInvalid).toBe(false)
  })
})

describe('JWT Utilities', () => {
  beforeEach(() => {
    vi.stubEnv('JWT_ACCESS_SECRET', 'test-access-secret-key-12345678')
    vi.stubEnv('JWT_REFRESH_SECRET', 'test-refresh-secret-key-12345678')
  })

  it('should generate and verify access token', async () => {
    const { generateAccessToken, verifyAccessToken } = await import('@/server/lib/jwt')

    const payload = {
      userId: 'user-123',
      email: 'test@example.com',
      subscriptionTier: 'free',
    }

    const token = await generateAccessToken(payload)
    expect(token).toBeDefined()
    expect(typeof token).toBe('string')

    const verified = await verifyAccessToken(token)
    expect(verified).not.toBeNull()
    expect(verified?.userId).toBe(payload.userId)
    expect(verified?.email).toBe(payload.email)
  })

  it('should generate and verify refresh token', async () => {
    const { generateRefreshToken, verifyRefreshToken } = await import('@/server/lib/jwt')

    const userId = 'user-123'
    const tokenId = 'token-456'

    const token = await generateRefreshToken(userId, tokenId)
    expect(token).toBeDefined()

    const verified = await verifyRefreshToken(token)
    expect(verified).not.toBeNull()
    expect(verified?.userId).toBe(userId)
    expect(verified?.tokenId).toBe(tokenId)
  })

  it('should reject invalid token', async () => {
    const { verifyAccessToken } = await import('@/server/lib/jwt')

    const verified = await verifyAccessToken('invalid-token')
    expect(verified).toBeNull()
  })
})
