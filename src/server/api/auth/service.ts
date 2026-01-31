/**
 * GrowLab Auth Service
 * 
 * Business logic for authentication operations.
 * Handles user registration, login, token refresh, and logout.
 */

import { eq } from 'drizzle-orm'
import { db } from '@/server/db'
import { users, refreshTokens, type User, type NewUser } from '@/server/db/schema'
import { hashPassword, verifyPassword } from '@/server/lib/password'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  REFRESH_TOKEN_EXPIRY_MS,
} from '@/server/lib/jwt'
import type { RegisterInput, LoginInput } from './schemas'

/**
 * Error codes for auth operations
 */
export const AuthErrorCodes = {
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
} as const

/**
 * Auth operation result type
 */
export type AuthResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; fields?: Record<string, string> } }

/**
 * Public user data (excludes password hash)
 */
export type PublicUser = Omit<User, 'passwordHash'>

/**
 * Generate a UUID using crypto
 */
function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Convert User to PublicUser (remove sensitive data)
 */
function toPublicUser(user: User): PublicUser {
  const { passwordHash: _, ...publicUser } = user
  return publicUser
}

/**
 * Register a new user account
 * 
 * @param input - Registration data (email, password, name?)
 * @returns User data and access token, or error
 */
export async function register(
  input: RegisterInput
): Promise<AuthResult<{ user: PublicUser; accessToken: string; refreshToken: string }>> {
  // Check if email already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, input.email.toLowerCase()),
  })

  if (existingUser) {
    return {
      success: false,
      error: {
        code: AuthErrorCodes.EMAIL_EXISTS,
        message: 'An account with this email already exists',
        fields: { email: 'Email is already registered' },
      },
    }
  }

  // Hash password
  const passwordHash = await hashPassword(input.password)

  // Create user
  const userId = generateId()
  const now = new Date()

  const newUser: NewUser = {
    id: userId,
    email: input.email.toLowerCase(),
    passwordHash,
    name: input.name ?? null,
    subscriptionTier: 'free',
    createdAt: now,
    updatedAt: now,
  }

  const [createdUser] = await db.insert(users).values(newUser).returning()

  // Generate tokens
  const accessToken = await generateAccessToken({
    userId: createdUser.id,
    email: createdUser.email,
    subscriptionTier: createdUser.subscriptionTier,
  })

  const tokenId = generateId()
  const refreshToken = await generateRefreshToken(createdUser.id, tokenId)

  // Store refresh token in database
  await db.insert(refreshTokens).values({
    id: tokenId,
    userId: createdUser.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
    createdAt: now,
  })

  return {
    success: true,
    data: {
      user: toPublicUser(createdUser),
      accessToken,
      refreshToken,
    },
  }
}

/**
 * Authenticate user and return tokens
 * 
 * @param input - Login credentials (email, password)
 * @returns User data and tokens, or error
 */
export async function login(
  input: LoginInput
): Promise<AuthResult<{ user: PublicUser; accessToken: string; refreshToken: string }>> {
  // Find user by email
  const user = await db.query.users.findFirst({
    where: eq(users.email, input.email.toLowerCase()),
  })

  if (!user) {
    return {
      success: false,
      error: {
        code: AuthErrorCodes.INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      },
    }
  }

  // Verify password
  const isValidPassword = await verifyPassword(input.password, user.passwordHash)

  if (!isValidPassword) {
    return {
      success: false,
      error: {
        code: AuthErrorCodes.INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      },
    }
  }

  // Generate tokens
  const accessToken = await generateAccessToken({
    userId: user.id,
    email: user.email,
    subscriptionTier: user.subscriptionTier,
  })

  const tokenId = generateId()
  const refreshToken = await generateRefreshToken(user.id, tokenId)

  // Store refresh token in database
  await db.insert(refreshTokens).values({
    id: tokenId,
    userId: user.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
    createdAt: new Date(),
  })

  return {
    success: true,
    data: {
      user: toPublicUser(user),
      accessToken,
      refreshToken,
    },
  }
}

/**
 * Refresh access token using refresh token
 * 
 * @param token - Refresh token from cookie
 * @returns New access token, or error
 */
export async function refresh(
  token: string
): Promise<AuthResult<{ accessToken: string }>> {
  // Verify refresh token JWT
  const payload = await verifyRefreshToken(token)

  if (!payload) {
    return {
      success: false,
      error: {
        code: AuthErrorCodes.INVALID_TOKEN,
        message: 'Invalid or expired refresh token',
      },
    }
  }

  // Check if token exists in database
  const storedToken = await db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.id, payload.tokenId),
  })

  if (!storedToken || storedToken.token !== token) {
    return {
      success: false,
      error: {
        code: AuthErrorCodes.INVALID_TOKEN,
        message: 'Refresh token not found or revoked',
      },
    }
  }

  // Check if token is expired
  if (new Date() > storedToken.expiresAt) {
    // Clean up expired token
    await db.delete(refreshTokens).where(eq(refreshTokens.id, payload.tokenId))
    
    return {
      success: false,
      error: {
        code: AuthErrorCodes.TOKEN_EXPIRED,
        message: 'Refresh token has expired',
      },
    }
  }

  // Get user data
  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.userId),
  })

  if (!user) {
    return {
      success: false,
      error: {
        code: AuthErrorCodes.USER_NOT_FOUND,
        message: 'User not found',
      },
    }
  }

  // Generate new access token
  const accessToken = await generateAccessToken({
    userId: user.id,
    email: user.email,
    subscriptionTier: user.subscriptionTier,
  })

  return {
    success: true,
    data: { accessToken },
  }
}

/**
 * Invalidate refresh token (logout)
 * 
 * @param token - Refresh token to invalidate
 * @returns Success message
 */
export async function logout(
  token: string
): Promise<AuthResult<{ message: string }>> {
  // Verify refresh token to get token ID
  const payload = await verifyRefreshToken(token)

  if (payload) {
    // Delete token from database
    await db.delete(refreshTokens).where(eq(refreshTokens.id, payload.tokenId))
  }

  return {
    success: true,
    data: { message: 'Logged out successfully' },
  }
}

/**
 * Get current authenticated user by ID
 * 
 * @param userId - User ID from access token
 * @returns User data or error
 */
export async function getCurrentUser(
  userId: string
): Promise<AuthResult<{ user: PublicUser }>> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  if (!user) {
    return {
      success: false,
      error: {
        code: AuthErrorCodes.USER_NOT_FOUND,
        message: 'User not found',
      },
    }
  }

  return {
    success: true,
    data: { user: toPublicUser(user) },
  }
}
