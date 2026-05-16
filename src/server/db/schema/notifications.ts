import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core'
import { nanoid } from 'nanoid'
import { users } from './auth'

export const NOTIFICATION_TYPES = ['schedule_due', 'sensor_alert'] as const
export type NotificationType = typeof NOTIFICATION_TYPES[number]

export const REFERENCE_TYPES = ['plant', 'tent', 'care_log'] as const
export type ReferenceType = typeof REFERENCE_TYPES[number]

export const notifications = pgTable(
  'notifications',
  {
    id: text('id').primaryKey().$defaultFn(() => nanoid()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    referenceId: text('reference_id'),
    referenceType: text('reference_type'),
    channelKey: text('channel_key'),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_notifications_user_created').on(table.userId, table.createdAt),
    index('idx_notifications_user_read').on(table.userId, table.readAt),
    index('idx_notifications_channel_key').on(table.userId, table.channelKey, table.createdAt),
  ],
)

export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert
