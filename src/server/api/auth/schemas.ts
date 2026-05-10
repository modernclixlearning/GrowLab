/**
 * GrowLab Auth Validation Schemas
 * 
 * Zod schemas for runtime validation of authentication inputs.
 */

import { z } from 'zod'

/**
 * Registration request validation schema
 */
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  name: z.string().min(1).max(100).optional(),
})

/**
 * Login request validation schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string()
    .min(1, 'Password is required'),
})

/**
 * Refresh token request validation schema
 */
export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

/**
 * F2 — Update current user (PATCH /api/auth/me).
 *
 * All fields optional and validated independently. `name` accepts null so
 * the user can clear it. `unitsPreference` and `notificationPrefs` are
 * fully-typed JSON so a partial update has to send the whole object —
 * keeps DB writes consistent without merging on the server.
 */
export const updateMeSchema = z.object({
  name: z.string().min(1).max(100).nullable().optional(),
  stageMode: z
    .enum(['basic', 'expert'], {
      errorMap: () => ({ message: 'stageMode must be "basic" or "expert"' }),
    })
    .optional(),
  hasOnboarded: z.boolean().optional(),
  avatarUrl: z.string().url('avatarUrl must be a valid URL').nullable().optional(),
  defaultTentId: z.string().min(1).nullable().optional(),
  unitsPreference: z
    .object({
      temp: z.enum(['C', 'F']),
      length: z.enum(['cm', 'in']),
    })
    .optional(),
  notificationPrefs: z
    .object({
      push: z.boolean(),
      email: z.boolean(),
      inApp: z.boolean(),
    })
    .optional(),
})

/** TypeScript types inferred from schemas */
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RefreshInput = z.infer<typeof refreshSchema>
export type UpdateMeInput = z.infer<typeof updateMeSchema>
