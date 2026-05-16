export type NotificationType = 'schedule_due' | 'sensor_alert'
export type ReferenceType = 'plant' | 'tent' | 'care_log'

export interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  referenceId: string | null
  referenceType: ReferenceType | null
  channelKey: string | null
  readAt: string | null
  createdAt: string
}

export interface NotificationsListResponse {
  notifications: AppNotification[]
  total: number
  unreadCount: number
}
