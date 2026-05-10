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
  /** F2 — defaults to 'expert' so existing goldens keep their 7-stage pills. */
  stageMode?: 'basic' | 'expert'
  /** F2 — `false` shows the StageMode onboarding overlay; defaults `true`. */
  hasOnboarded?: boolean
  /** F2 — null means no avatar (Profile shows placeholder). */
  avatarUrl?: string | null
  /** F2 — see types/auth UnitsPreference. */
  unitsPreference?: { temp: 'C' | 'F'; length: 'cm' | 'in' } | null
  /** F2 — notification channel toggles. */
  notificationPrefs?: {
    push: boolean
    email: boolean
    inApp: boolean
  } | null
  /** F2 — default tent id (or null). */
  defaultTentId?: string | null
  createdAt: string
  updatedAt: string
}

export interface MockTent {
  id: string
  userId: string
  name: string
  lightTarget: string | null
  humidityTargetPct: string | null
  tempTargetC: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface MockStrainTemplate {
  id: string
  name: string
  strainType: 'indica' | 'sativa' | 'hybrid' | 'auto'
  stageDurations: Record<string, number> | null
  defaultLightSchedule: { veg?: string; flower?: string } | null
  description: string | null
  createdAt: string
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
  // F2 — all optional in fixtures; mock helper fills defaults.
  tentId?: string | null
  strainTemplateId?: string | null
  strainName?: string | null
  stageDurationOverride?: Record<string, number> | null
  lightSchedule?: string | null
  heroPhotoUrl?: string | null
  weekDeltaCache?: string | null
  /** Server-derived. Defaulted by the mock helper if not set. */
  weekOfStage?: number
  totalWeeks?: number | null
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
  // F3 scheduling fields — optional so existing fixture call sites need no changes
  scheduledAt?: string | null
  completedAt?: string | null
  recurrenceRule?: Record<string, unknown> | null
  parentScheduleId?: string | null
}

export const FIXED_USER: MockUser = {
  id: 'user-1',
  email: 'grower@growlab.test',
  name: 'Jane Grower',
  stageMode: 'expert',
  hasOnboarded: true,
  avatarUrl: null,
  unitsPreference: { temp: 'C', length: 'cm' },
  notificationPrefs: { push: true, email: true, inApp: true },
  defaultTentId: null,
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
      // F2 — exercise lightCyclePill + totalWeeks tile in plant-detail
      // golden by giving Blue Dream a known light schedule and a
      // pre-derived totalWeeks (mock layer normally fills weekOfStage).
      lightSchedule: '18/6',
      totalWeeks: 5,
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

/**
 * Single representative tent for Profile-screen goldens. F2 — minimal
 * shape: enough to render the TentList row with light/humidity/temp
 * tokens without exercising every column.
 */
export function profileSeedTents(): MockTent[] {
  return [
    {
      id: 'tent-veg-room',
      userId: FIXED_USER.id,
      name: 'Veg Room',
      lightTarget: '18/6',
      humidityTargetPct: '55',
      tempTargetC: '24',
      notes: 'Primary tent — strain: White Widow.',
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-01T00:00:00.000Z',
    },
  ]
}

/** Strain template seed mirroring `db/seed/strain-templates.ts` (subset). */
export function profileSeedStrainTemplates(): MockStrainTemplate[] {
  return [
    {
      id: 'strain-tpl-blue-dream',
      name: 'Blue Dream',
      strainType: 'hybrid',
      stageDurations: {
        seedling: 14,
        vegetative: 35,
        flowering: 63,
        harvesting: 7,
        drying: 10,
        curing: 30,
      },
      defaultLightSchedule: { veg: '18/6', flower: '12/12' },
      description:
        'Sativa-leaning hybrid. Vigorous vegetative growth, sweet berry profile.',
      createdAt: '2026-01-01T00:00:00.000Z',
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
  /** Tents returned by `GET /api/tents`. Default empty. (F2) */
  tents?: MockTent[]
  /** Strain templates returned by `GET /api/strain-templates`. Default empty. (F2) */
  strainTemplates?: MockStrainTemplate[]
  /**
   * F3 — scheduled care logs returned by `GET /api/care-logs`.
   * The mock ignores query params (scheduledFrom/scheduledTo/plantId)
   * to keep fixtures simple. Default empty.
   */
  scheduledCareLogs?: MockCareLog[]
}

/**
 * Fill F2-derived plant fields the server normally computes (`weekOfStage`,
 * `totalWeeks`) so fixture-only tests don't have to set them every time.
 * Caller may still override by setting them explicitly on a MockPlant.
 */
function withDerivedStats(plant: MockPlant): MockPlant {
  if (typeof plant.weekOfStage === 'number') return plant
  // Default: 1-indexed week from stageStartDate. Mirrors the server helper.
  const start = new Date(plant.stageStartDate).getTime()
  const now = new Date(FIXED_NOW).getTime()
  const elapsedDays = Math.max(0, (now - start) / (1000 * 60 * 60 * 24))
  return {
    ...plant,
    weekOfStage: Math.floor(elapsedDays / 7) + 1,
    totalWeeks: plant.totalWeeks ?? null,
    tentId: plant.tentId ?? null,
    strainTemplateId: plant.strainTemplateId ?? null,
    strainName: plant.strainName ?? null,
    stageDurationOverride: plant.stageDurationOverride ?? null,
    lightSchedule: plant.lightSchedule ?? null,
    heroPhotoUrl: plant.heroPhotoUrl ?? null,
    weekDeltaCache: plant.weekDeltaCache ?? null,
  }
}

/**
 * Install network mocks on the page. Must be called BEFORE `page.goto`.
 *
 * The mock surface is intentionally narrow — only the endpoints F1 routes
 * actually call. Anything else returns a 404 to surface drift loudly in CI.
 */
export async function mockGrowlabApi(page: Page, opts: MockOptions = {}) {
  const plants = (opts.plants ?? []).map(withDerivedStats)
  const careLogsByPlant = opts.careLogsByPlant ?? {}
  const scheduledCareLogs: MockCareLog[] = opts.scheduledCareLogs ?? []
  const initialUser = opts.user === undefined ? FIXED_USER : opts.user
  // Mutable so PATCH /api/auth/me can update what subsequent GET /me returns
  // within the same test (e.g. onboarding completion → user.hasOnboarded=true).
  let user: MockUser | null = initialUser
  const tents = opts.tents ?? []
  const strainTemplates = opts.strainTemplates ?? []
  const accessToken = 'test-access-token'

  // Pin clock so relative dates ("3h ago") are deterministic.
  //
  // We wrap `Date` with a Proxy instead of subclassing it so that BOTH
  // `new Date()` and `Date()` (no `new`) keep working. A class-based
  // override would throw "class constructor cannot be invoked without
  // 'new'" the moment any dependency calls `Date()` as a function.
  await page.addInitScript((nowIso: string) => {
    const fixed = new Date(nowIso).getTime()
    const RealDate = Date

    const FrozenDate = new Proxy(RealDate, {
      construct(_target, args) {
        if (args.length === 0) return new RealDate(fixed)
        // Forward all other constructor signatures to the real Date.
        return new RealDate(
          ...(args as ConstructorParameters<typeof Date>),
        )
      },
      apply() {
        // `Date()` (without `new`) returns a string per spec; mimic that
        // using the frozen instant so relative-time strings stay stable.
        return new RealDate(fixed).toString()
      },
      get(target, prop, receiver) {
        if (prop === 'now') return () => fixed
        return Reflect.get(target, prop, receiver)
      },
    })

    // @ts-expect-error replace global Date with the proxy
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

    // PATCH /api/auth/me — apply the body diff to our local user copy
    // so subsequent /me reads reflect the change. Used by Profile toggle
    // and onboarding overlay tests.
    if (pathname === '/api/auth/me' && request.method() === 'PATCH') {
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
      const body = request.postDataJSON() as Partial<MockUser>
      user = { ...user, ...body }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ok({ user })),
      })
    }

    // Tents — list (F2)
    if (pathname === '/api/tents' && request.method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ok({ tents, total: tents.length })),
      })
    }

    // Strain templates — list (F2)
    if (pathname === '/api/strain-templates' && request.method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          ok({ strainTemplates, total: strainTemplates.length }),
        ),
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

    // F3 — Scheduled care logs (GET /api/care-logs)
    // Mock ignores query params — callers supply the full fixture list.
    if (pathname === '/api/care-logs' && request.method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ok({ careLogs: scheduledCareLogs, total: scheduledCareLogs.length })),
      })
    }

    // F3 — Complete a care log (POST /api/care-logs/:id/complete)
    const completeMatch = pathname.match(/^\/api\/care-logs\/([^/]+)\/complete$/)
    if (completeMatch && request.method() === 'POST') {
      const logId = completeMatch[1]!
      const log = scheduledCareLogs.find((l) => l.id === logId)
      if (!log) {
        return route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { code: 'CARE_LOG_NOT_FOUND', message: 'Not found' },
          }),
        })
      }
      const completed: MockCareLog = { ...log, completedAt: FIXED_NOW, loggedAt: FIXED_NOW }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ok({ careLog: completed, next: null })),
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
