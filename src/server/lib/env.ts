import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.string().optional(),
  INTERNAL_CRON_SECRET: z
    .string()
    .min(32, 'INTERNAL_CRON_SECRET must be at least 32 characters'),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  ${i.path.join('.')}: ${i.message}`)
    .join('\n')
  throw new Error(`Missing or invalid environment variables:\n${issues}`)
}

export const env = parsed.data

const vapidMissing =
  !env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT

if (vapidMissing) {
  if (env.NODE_ENV === 'production') {
    throw new Error(
      'VAPID keys are required in production. Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT.',
    )
  }
  console.warn('[env] VAPID keys not configured — Web Push delivery will be unavailable')
}
