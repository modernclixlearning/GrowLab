/**
 * GrowLab Database Schema Index
 *
 * Exports all database models for use throughout the application.
 *
 * NOTE on import order: Drizzle's relations work without ordering, but the
 * `*` re-export forwards declarations as-written. We export `tents` and
 * `strain-templates` BEFORE `auth`/`plants` so consumers that import from
 * '@/server/db/schema' directly resolve the FK targets first.
 */

export * from './tents'
export * from './strain-templates'
export * from './auth'
export * from './plants'
export * from './care-logs'
export * from './plant-photos'
export * from './sensor-devices'
export * from './sensor-readings'
export * from './growth-measurements'
