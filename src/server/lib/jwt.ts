/**
 * GrowLab JWT Utilities
 * 
 * JWT token generation and verification using jose library.
 * Implements access tokens (15min) and refresh tokens (7 days).
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

/** Access token expiration: 15 minutes */
const ACCESS_TOKEN_EXPIRY = '15m'

/** Refresh token expiration: 7 days */
const REFRESH_TOKEN_EXPIRY = '7d'

/** Refresh token expiry in milliseconds (for database) */
export const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

/**
 * JWT payload structure for access tokens
 */
export interface AccessTokenPayload extends JWTPayload {
  userId: string
  email: string
  subscriptionTier: string
}

/**
 * JWT payload structure for refresh tokens
 */
export interface RefreshTokenPayload extends JWTPayload {
  userId: string
  tokenId: string
}

/**
 * Get secret key as Uint8Array for jose library
 */
function getSecretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret)
}

/**
 * Generate an access token for a user
 * 
 * @param payload - User data to encode in token
 * @returns Signed JWT access token
 */
export async function generateAccessToken(
  payload: Omit<AccessTokenPayload, 'iat' | 'exp'>
): Promise<string> {
  const secret = process.env.JWT_ACCESS_SECRET
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET environment variable is not set')
  }

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setIssuer('growlab')
    .setAudience('growlab-api')
    .sign(getSecretKey(secret))
}

/**
 * Generate a refresh token for a user
 * 
 * @param userId - User ID to encode
 * @param tokenId - Unique token ID for tracking in database
 * @returns Signed JWT refresh token
 */
export async function generateRefreshToken(
  userId: string,
  tokenId: string
): Promise<string> {
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET environment variable is not set')
  }

  return new SignJWT({ userId, tokenId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setIssuer('growlab')
    .setAudience('growlab-refresh')
    .sign(getSecretKey(secret))
}

/**
 * Verify and decode an access token
 * 
 * @param token - JWT access token to verify
 * @returns Decoded payload or null if invalid
 */
export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload | null> {
  try {
    const secret = process.env.JWT_ACCESS_SECRET
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET environment variable is not set')
    }

    const { payload } = await jwtVerify(token, getSecretKey(secret), {
      issuer: 'growlab',
      audience: 'growlab-api',
    })

    return payload as AccessTokenPayload
  } catch {
    return null
  }
}

/**
 * Verify and decode a refresh token
 * 
 * @param token - JWT refresh token to verify
 * @returns Decoded payload or null if invalid
 */
export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload | null> {
  try {
    const secret = process.env.JWT_REFRESH_SECRET
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET environment variable is not set')
    }

    const { payload } = await jwtVerify(token, getSecretKey(secret), {
      issuer: 'growlab',
      audience: 'growlab-refresh',
    })

    return payload as RefreshTokenPayload
  } catch {
    return null
  }
}
