import { describe, it, expect } from 'vitest'
import { pushSubscribeSchema, pushUnsubscribeSchema } from '@/server/api/push/schemas'

describe('pushSubscribeSchema', () => {
  const validPayload = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
    keys: { p256dh: 'dGVzdC1rZXk=', auth: 'dGVzdA==' },
  }

  it('accepts a valid subscription', () => {
    expect(pushSubscribeSchema.safeParse(validPayload).success).toBe(true)
  })

  it('accepts optional userAgent', () => {
    const result = pushSubscribeSchema.safeParse({ ...validPayload, userAgent: 'Chrome/120' })
    expect(result.success).toBe(true)
  })

  it('rejects missing endpoint', () => {
    const { endpoint: _e, ...rest } = validPayload
    expect(pushSubscribeSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects non-URL endpoint', () => {
    expect(pushSubscribeSchema.safeParse({ ...validPayload, endpoint: 'not-a-url' }).success).toBe(false)
  })

  it('rejects missing keys.p256dh', () => {
    expect(
      pushSubscribeSchema.safeParse({ ...validPayload, keys: { auth: 'dGVzdA==' } }).success,
    ).toBe(false)
  })

  it('rejects empty keys.auth', () => {
    expect(
      pushSubscribeSchema.safeParse({ ...validPayload, keys: { p256dh: 'dGVzdC1rZXk=', auth: '' } }).success,
    ).toBe(false)
  })
})

describe('pushUnsubscribeSchema', () => {
  it('accepts a valid endpoint', () => {
    expect(
      pushUnsubscribeSchema.safeParse({ endpoint: 'https://fcm.googleapis.com/test' }).success,
    ).toBe(true)
  })

  it('rejects a non-URL endpoint', () => {
    expect(pushUnsubscribeSchema.safeParse({ endpoint: 'not-url' }).success).toBe(false)
  })
})
