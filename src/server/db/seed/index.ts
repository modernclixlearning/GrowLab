/**
 * GrowLab DB Seed Runner
 *
 * Aggregates every seed module and runs them in sequence. Each module is
 * responsible for being idempotent (use ON CONFLICT DO NOTHING / NOOP).
 *
 * Invoke via `npm run db:seed`.
 */

import { db } from '../index'
import { seedStrainTemplates } from './strain-templates'

async function main() {
  // eslint-disable-next-line no-console
  console.log('[seed] starting...')

  const strain = await seedStrainTemplates()
  // eslint-disable-next-line no-console
  console.log(`[seed] strain_templates: inserted ${strain.inserted} new rows`)

  await db.$client.end({ timeout: 5 })
  // eslint-disable-next-line no-console
  console.log('[seed] done.')
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed] failed', err)
  process.exit(1)
})
