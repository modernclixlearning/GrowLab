import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core'
import { nanoid } from 'nanoid'
import { users } from './auth'

export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: text('id').primaryKey().$defaultFn(() => nanoid()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull().unique(),
    p256dhKey: text('p256dh_key').notNull(),
    authKey: text('auth_key').notNull(),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_push_subscriptions_user_id').on(table.userId),
  ],
)

export type PushSubscription = typeof pushSubscriptions.$inferSelect
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert
