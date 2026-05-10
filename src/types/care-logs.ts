/**
 * GrowLab - Frontend Types for Care Logs
 *
 * TypeScript types matching backend API responses for care logging.
 * F3: adds scheduling fields (scheduledAt, completedAt, recurrenceRule,
 *     parentScheduleId) and related request/response types.
 */

import type { RecurrenceRule } from '@/lib/recurrence'

/**
 * Care log type values
 */
export type CareLogType = 'water' | 'feed' | 'prune' | 'transplant' | 'train' | 'other'

/**
 * Care log entity (matches server CareLog type)
 */
export interface CareLog {
  id: string
  plantId: string
  logType: CareLogType
  amount: string | null
  unit: string | null
  notes: string | null
  loggedAt: string
  // F3 scheduling fields
  scheduledAt: string | null
  completedAt: string | null
  recurrenceRule: RecurrenceRule | null
  parentScheduleId: string | null
}

/**
 * Request types
 */
export interface CreateCareLogRequest {
  logType: CareLogType
  amount?: number
  unit?: string
  notes?: string
  loggedAt?: string
  // F3
  scheduledAt?: string
  recurrenceRule?: RecurrenceRule
}

export interface ListCareLogsParams {
  logType?: CareLogType
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

/** F3 — query params for the cross-plant scheduled window endpoint */
export interface ListScheduledCareLogsParams {
  plantId?: string
  scheduledFrom?: string
  scheduledTo?: string
}

/**
 * Response types
 */
export interface CareLogResponse {
  careLog: CareLog
}

export interface CareLogsListResponse {
  careLogs: CareLog[]
  total: number
}

/** F3 — response from POST /api/care-logs/:id/complete */
export interface CompleteCareLogResponse {
  careLog: CareLog
  next: CareLog | null
}

/**
 * Care log type display configuration
 */
export const CARE_LOG_TYPE_CONFIG: Record<CareLogType, {
  label: string
  icon: string
  color: string
  bgColor: string
}> = {
  water: {
    label: 'Water',
    icon: 'droplets',
    color: 'text-status-water',
    bgColor: 'bg-status-water/15',
  },
  feed: {
    label: 'Feed',
    icon: 'flask-conical',
    color: 'text-status-thirsty',
    bgColor: 'bg-status-thirsty/15',
  },
  prune: {
    label: 'Prune',
    icon: 'scissors',
    color: 'text-stage-seedling',
    bgColor: 'bg-stage-seedling/15',
  },
  transplant: {
    label: 'Transplant',
    icon: 'arrow-right-left',
    color: 'text-status-alert',
    bgColor: 'bg-status-alert/15',
  },
  train: {
    label: 'Train',
    icon: 'move',
    color: 'text-stage-flower',
    bgColor: 'bg-stage-flower/15',
  },
  other: {
    label: 'Other',
    icon: 'circle-dot',
    color: 'text-fg-2',
    bgColor: 'bg-card-2',
  },
}
