/**
 * GrowLab - Frontend Types for Care Logs
 * 
 * TypeScript types matching backend API responses for care logging.
 */

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
}

export interface ListCareLogsParams {
  logType?: CareLogType
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
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
