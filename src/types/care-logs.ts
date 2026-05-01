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
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  feed: {
    label: 'Feed',
    icon: 'flask-conical',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
  },
  prune: {
    label: 'Prune',
    icon: 'scissors',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  transplant: {
    label: 'Transplant',
    icon: 'arrow-right-left',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
  },
  train: {
    label: 'Train',
    icon: 'move',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
  },
  other: {
    label: 'Other',
    icon: 'circle-dot',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
}
