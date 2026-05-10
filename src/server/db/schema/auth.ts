/**
 * GrowLab Database Schema - User Model
 *
 * User accounts with authentication and subscription tier.
 * Implements JWT-based authentication with httpOnly refresh tokens.
 *
 * F2 extensions (Master Plan §4.2):
 *   - `stageMode` Basic/Expert preference (default 'expert' to preserve
 *     pre-F2 behaviour for existing users; onboarding overrides for new ones).
 *   - `unitsPreference`, `avatarUrl`, `notificationPrefs` for Profile screen.
 *   - `defaultTentId` FK to tents (set null on tent delete).
 *   - `hasOnboarded` boolean flag, false for everyone at migration time so
 *     the StageMode onboarding overlay shows once and gets dismissed.
 */

import { pgTable, text, timestamp, jsonb, boolean, type AnyPgColumn } from 'drizzle-orm/pg-core'
import { tents } from './tents'

/**
 * Stage mode enum values — Basic vs Expert presentation.
 * Storage of `growthStage` is always the 7-stage Expert model; this flag
 * is purely presentational (issue 003 / N11).
 */
export const STAGE_MODES = ['basic', 'expert'] as const
export type StageMode = typeof STAGE_MODES[number]

/**
 * User preferences for unit display. Storage units are fixed (e.g. cm, C);
 * this only affects UI rendering.
 */
export interface UnitsPreference {
  temp: 'C' | 'F'
  length: 'cm' | 'in'
}

/**
 * Notification channel preferences.
 */
export interface NotificationPrefs {
  push: boolean
  email: boolean
  inApp: boolean
}

/** Default values applied at insert time when fields are missing. */
export const DEFAULT_UNITS_PREFERENCE: UnitsPreference = { temp: 'C', length: 'cm' }
export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  push: true,
  email: true,
  inApp: true,
}

/**
 * User entity - Core user account information
 */
export const users = pgTable('users', {
  /** Unique identifier (UUID) */
  id: text('id').primaryKey(),

  /** User's email address - must be unique */
  email: text('email').notNull().unique(),

  /** Bcrypt hashed password */
  passwordHash: text('password_hash').notNull(),

  /** Display name (optional) */
  name: text('name'),

  /** Subscription tier: 'free' | 'premium' */
  subscriptionTier: text('subscription_tier').notNull().default('free'),

  /** Stage mode toggle — 'basic' (3+harvest bucket) vs 'expert' (7 stages). */
  stageMode: text('stage_mode').notNull().default('expert'),

  /** Units preference (temp/length). Stored as JSON for forward-compat. */
  unitsPreference: jsonb('units_preference').$type<UnitsPreference>(),

  /** Avatar image URL (Profile screen). */
  avatarUrl: text('avatar_url'),

  /** Notification channel preferences. */
  notificationPrefs: jsonb('notification_prefs').$type<NotificationPrefs>(),

  /**
   * Default tent for new plants. Set null on tent delete so we don't break
   * the user; UI prompts them to pick a new default.
   *
   * The FK is wrapped in a `(): AnyPgColumn` thunk so TypeScript does not
   * recurse through the circular `users` ↔ `tents` definition (`tents.userId`
   * also references `users.id`). Drizzle's `references()` always defers
   * resolution at runtime, so the cast is purely for the type checker.
   */
  defaultTentId: text('default_tent_id').references(
    (): AnyPgColumn => tents.id,
    { onDelete: 'set null' },
  ),

  /**
   * Whether the user has completed the StageMode onboarding overlay.
   * Existing users at migration time get `false` and see the overlay once;
   * the toggle in Profile is independent of this flag (always reversible).
   */
  hasOnboarded: boolean('has_onboarded').notNull().default(false),

  /** Account creation timestamp */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),

  /** Last update timestamp */
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * RefreshToken entity - JWT refresh tokens for session management
 */
export const refreshTokens = pgTable('refresh_tokens', {
  /** Unique identifier (UUID) */
  id: text('id').primaryKey(),

  /** Reference to user */
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  /** The refresh token string */
  token: text('token').notNull().unique(),

  /** Token expiration timestamp */
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

  /** Token creation timestamp */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/** TypeScript types inferred from schema */
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type RefreshToken = typeof refreshTokens.$inferSelect
export type NewRefreshToken = typeof refreshTokens.$inferInsert
