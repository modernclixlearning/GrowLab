import { z } from 'zod'

const envSchema = z.object({
  INTERNAL_CRON_SECRET: z
    .string()
    .min(32, 'INTERNAL_CRON_SECRET must be at least 32 characters'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  ${i.path.join('.')}: ${i.message}`)
    .join('\n')
  throw new Error(`Missing or invalid environment variables:\n${issues}`)
}

export const env = parsed.data
