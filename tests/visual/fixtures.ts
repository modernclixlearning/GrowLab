/**
 * Playwright fixtures for visual regression goldens (F1).
 *
 * The dev server in this repo only runs the Vite frontend (see
 * `playwright.config.ts` → `webServer.command: 'npm run dev:web'`). The Hono
 * backend is not started during e2e runs to keep the harness lightweight,
 * which means authenticated routes (`/garden`, `/dashboard`, `/plants/:id`)
 * have no real API to talk to.
 *
 * Strategy: intercept `fetch` calls to `/api/**` with `page.route(...)`,
 * returning canonical fixtures. Each spec composes the helpers below to
 * declare its required data; the auth refresh succeeds → routes render
 * the authenticated state without touching a database.
 */

import type { Page, Route, Request } from '@playwright/test'

export interface MockUser {
  id: string
  email: string
  name: string | null
  createdAt: string
  updatedAt: string
}

export interface MockPlant {
  id: string
  userId: string
  name: string
  strainType: 'indica' | 'sativa' | 'hybrid' | 'auto'
  growthStage:
    | 'seedling'
    | 'vegetative'
    | 'flowering'
    | 'harvesting'
    | 'drying'
    | 'curing'
    | 'completed'
  stageStartDate: string
  healthStatus: 'healthy' | 'stressed' | 'sick' | 'recovering' | 'dead'
  photoUrl: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface MockCareLog {
  id: string
  plantId: string
  logType: 'water' | 'feed' | 'prune' | 'transplant' | 'train' | 'other'
  amount: string | null
  unit: string | null
  notes: string | null
  loggedAt: string
}

export const FIXED_USER: MockUser = {
  id: 'user-1',
  email: 'grower@growlab.test',
  name: 'Jane Grower',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const FIXED_NOW = '2026-05-09T12:00:00.000Z'

/** Build a deterministic 4-plant garden seed (Master Plan §3 F1 + §7.2). */
export function gardenSeedPlants(): MockPlant[] {
  return [
    {
      id: 'plant-og-kush-1',
      userId: FIXED_USER.id,
      name: 'OG Kush #1',
      strainType: 'indica',
      growthStage: 'seedling',
      stageStartDate: '2026-05-04T00:00:00.000Z',
      healthStatus: 'healthy',
      photoUrl: null,
      notes: 'First grow of the season.',
      createdAt: '2026-05-04T00:00:00.000Z',
      updatedAt: '2026-05-09T08:00:00.000Z',
    },
    {
      id: 'plant-blue-dream',
      userId: FIXED_USER.id,
      name: 'Blue Dream',
      strainType: 'hybrid',
      growthStage: 'vegetative',
      stageStartDate: '2026-04-15T00:00:00.000Z',
      healthStatus: 'healthy',
      photoUrl: null,
      notes: null,
      createdAt: '2026-03-25T00:00:00.000Z',
      updatedAt: '2026-05-09T07:30:00.000Z',
    },
    {
      id: 'plant-sour-d',
      userId: FIXED_USER.id,
      name: 'Sour Diesel',
      strainType: 'sativa',
      growthStage: 'flowering',
      stageStartDate: '2026-04-01T00:00:00.000Z',
      healthStatus: 'stressed',
      photoUrl: null,
      notes: null,
      createdAt: '2026-02-10T00:00:00.000Z',
      updatedAt: '2026-05-08T20:00:00.000Z',
    },
    {
      id: 'plant-northern',
      userId: FIXED_USER.id,
      name: 'Northern Lights',
      strainType: 'indica',
      growthStage: 'curing',
      stageStartDate: '2026-04-20T00:00:00.000Z',
      healthStatus: 'healthy',
      photoUrl: null,
      notes: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-05-07T10:00:00.000Z',
    },
  ]
}

export function plantDetailCareLogs(plantId: string): MockCareLog[] {
  // Logs ordered by recency. Mix of types to exercise the timeline.
  return [
    {
      id: 'log-1',
      plantId,
      logType: 'water',
      amount: '400',
      unit: 'ml',
      notes: 'pH 6.3',
      loggedAt: '2026-05-09T09:14:00.000Z',
    },
    {
      id: 'log-2',
      plantId,
      logType: 'feed',
      amount: '200',
      unit: 'ml',
      notes: 'Bloom feed (PK 13/14)',
      loggedAt: '2026-05-08T19:02:00.000Z',
    },
    {
      id: 'log-3',
      plantId,
      logType: 'prune',
      amount: null,
      unit: null,
      notes: 'Removed lower fan leaves.',
      loggedAt: '2026-05-07T16:45:00.000Z',
    },
    {
      id: 'log-4',
      plantId,
      logType: 'water',
      amount: '500',
      unit: 'ml',
      notes: null,
      loggedAt: '2026-05-06T08:00:00.000Z',
    },
  ]
}

interface ApiSuccess<T> {
  success: true
  data: T
}

function ok<T>(data: T): ApiSuccess<T> {
  return { success: true, data }
}

interface MockOptions {
  /** Plants returned by `GET /api/plants`. Pass `[]` for an empty garden. */
  plants?: MockPlant[]
  /** Map plantId → care logs; default empty. */
  careLogsByPlant?: Record<string, MockCareLog[]>
  /** Override authenticated user (default: `FIXED_USER`). */
  user?: MockUser | null
}

/**
 * Install network mocks on the page. Must be called BEFORE `page.goto`.
 *
 * The mock surface is intentionally narrow — only the endpoints F1 routes
 * actually call. Anything else returns a 404 to surface drift loudly in CI.
 */
export async function mockGrowlabApi(page: Page, opts: MockOptions = {}) {
  const plants = opts.plants ?? []
  const careLogsByPlant = opts.careLogsByPlant ?? {}
  const user = opts.user === undefined ? FIXED_USER : opts.user
  const accessToken = 'test-access-token'

  // Pin clock so relative dates ("3h ago") are deterministic.
  await page.addInitScript((nowIso: string) => {
    const fixed = new Date(nowIso).getTime()
    const RealDate = Date
    class FrozenDate extends RealDate {
      constructor(...args: unknown[]) {
        if (args.length === 0) {
          super(fixed)
        } else {
          // @ts-expect-error spread args into Date
          super(...args)
        }
      }
      static now() {
        return fixed
      }
    }
    // @ts-expect-error replace global Date
    globalThis.Date = FrozenDate
  }, FIXED_NOW)

  const handle = async (route: Route, request: Request) => {
    const url = new URL(request.url())
    const pathname = url.pathname

    // Auth refresh — succeeds if user is set, fails otherwise.
    if (pathname === '/api/auth/refresh' && request.method() === 'POST') {
      if (!user) {
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
          }),
        })
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ok({ accessToken })),
      })
    }

    if (pathname === '/api/auth/me' && request.method() === 'GET') {
      if (!user) {
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
          }),
        })
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ok({ user })),
      })
    }

    if (pathname === '/api/auth/logout') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ok({ message: 'logged out' })),
      })
    }

    // Plants — list
    if (pathname === '/api/plants' && request.method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ok({ plants, total: plants.length })),
      })
    }

    // Plants — detail
    const plantDetail = pathname.match(/^\/api\/plants\/([^/]+)$/)
    if (plantDetail && request.method() === 'GET') {
      const plant = plants.find((p) => p.id === plantDetail[1])
      if (!plant) {
        return route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Plant not found' },
          }),
        })
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ok({ plant })),
      })
    }

    // Care logs — list per plant
    const careLogList = pathname.match(/^\/api\/plants\/([^/]+)\/logs$/)
    if (careLogList && request.method() === 'GET') {
      const logs = careLogsByPlant[careLogList[1] ?? ''] ?? []
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ok({ careLogs: logs, total: logs.length })),
      })
    }

    // Anything else under /api/ → 404, surfaces drift.
    if (pathname.startsWith('/api/')) {
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { code: 'NOT_FOUND', message: `Unmocked API ${pathname}` },
        }),
      })
    }

    return route.continue()
  }

  await page.route('**/api/**', handle)
}

/** Wait for fonts so headings are not captured in fallback frame. */
export async function waitForFonts(page: Page) {
  await page.evaluate(() => document.fonts.ready)
}
