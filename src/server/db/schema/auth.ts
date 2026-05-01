/**
 * GrowLab Database Schema - User Model
 * 
 * User accounts with authentication and subscription tier.
 * Implements JWT-based authentication with httpOnly refresh tokens.
 */

import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

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
