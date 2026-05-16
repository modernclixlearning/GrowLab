import { describe, it, expect } from 'vitest'
import { listNotificationsQuerySchema } from '@/server/api/notifications/schemas'

describe('listNotificationsQuerySchema', () => {
  it('accepts default empty params', () => {
    const result = listNotificationsQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    expect(result.data?.page).toBe(1)
    expect(result.data?.limit).toBe(20)
  })

  it('accepts valid page and limit', () => {
    const result = listNotificationsQuerySchema.safeParse({ page: '2', limit: '10' })
    expect(result.success).toBe(true)
    expect(result.data?.page).toBe(2)
    expect(result.data?.limit).toBe(10)
  })

  it('rejects page < 1', () => {
    expect(listNotificationsQuerySchema.safeParse({ page: '0' }).success).toBe(false)
  })

  it('rejects limit > 50', () => {
    expect(listNotificationsQuerySchema.safeParse({ limit: '51' }).success).toBe(false)
  })

  it('rejects non-numeric values', () => {
    expect(listNotificationsQuerySchema.safeParse({ page: 'abc' }).success).toBe(false)
  })
})
