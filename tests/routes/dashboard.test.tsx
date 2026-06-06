/**
 * GrowLab — Dashboard route tests (F6e RTL rewrite)
 *
 * Phase F6e: upgraded from F1 pure-helper smoke to @testing-library/react
 * render tests with full hook mocking. Retains the derivePlantStats /
 * buildBuckets unit tests from the original F1 file.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { buildBuckets } from '@/components/dashboard/MiniChart'
import { derivePlantStats } from '@/lib/plantStats'
import type { Plant, GrowthStage } from '@/types/plants'

// ── Mock modules before component import ───────────────────────────────────

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('@/lib/stores/auth', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'grower@test.com', name: 'Test Grower', stageMode: 'basic', hasOnboarded: true },
    isAuthenticated: true,
    isLoading: false,
    logout: vi.fn(),
  }),
}))

vi.mock('@/lib/hooks/usePlants', () => ({
  usePlants: () => ({ data: { plants: [] }, isLoading: false }),
}))

vi.mock('@/lib/hooks/useCareLogs', () => ({
  useCareLogs: () => ({ data: { careLogs: [] }, isLoading: false }),
  useScheduledCareLogs: () => ({ data: { careLogs: [] }, isLoading: false }),
  useCompleteCareLog: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/lib/hooks/useSensors', () => ({
  useSensorDevices: () => ({ data: { devices: [] }, isLoading: false }),
}))

vi.mock('@/components/plants/AddPlantModal', () => ({
  AddPlantModal: () => null,
}))

vi.mock('@/components/notifications/NotificationBadge', () => ({
  NotificationBadge: () => null,
}))

vi.mock('@/lib/stores/notification-drawer', () => ({
  NotificationDrawerProvider: ({ children }: { children: React.ReactNode }) => children,
  useNotificationDrawer: () => ({ isOpen: false, open: vi.fn(), close: vi.fn() }),
}))

vi.mock('@/lib/stores/fab-action', () => ({
  FabActionProvider: ({ children }: { children: React.ReactNode }) => children,
  useFabAction: () => ({ trigger: vi.fn(), register: vi.fn(), hasAction: false }),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import React from 'react'
import DashboardPage from '@/routes/dashboard'


const NOW = new Date('2026-05-09T12:00:00.000Z')

function makePlant(id: string, stage: GrowthStage, createdDaysAgo: number): Plant {
  const created = new Date(NOW.getTime() - createdDaysAgo * 24 * 60 * 60 * 1000)
  return {
    id,
    userId: 'u1',
    name: `Plant ${id}`,
    strainType: 'indica',
    growthStage: stage,
    stageStartDate: created.toISOString(),
    healthStatus: 'healthy',
    photoUrl: null,
    notes: null,
    // F2 nullable defaults
    tentId: null,
    strainTemplateId: null,
    strainName: null,
    stageDurationOverride: null,
    lightSchedule: null,
    heroPhotoUrl: null,
    weekDeltaCache: null,
    weekOfStage: 1,
    totalWeeks: null,
    createdAt: created.toISOString(),
    updatedAt: created.toISOString(),
  }
}

describe('Dashboard — derived data', () => {
  it('derivePlantStats reflects the active/flowering split shown in the header', () => {
    const plants = [
      makePlant('1', 'seedling', 30),
      makePlant('2', 'flowering', 20),
      makePlant('3', 'flowering', 25),
      makePlant('4', 'completed', 80),
    ]
    const stats = derivePlantStats(plants)
    expect(stats.active).toBe(3)
    expect(stats.flowering).toBe(2)
    expect(stats.total).toBe(4)
  })

  it('buildBuckets returns 5 buckets and is monotonically non-decreasing', () => {
    // Plants created 28, 21, 14, 7, 0 days ago — one alive each week.
    const plants = [
      makePlant('a', 'seedling', 28),
      makePlant('b', 'vegetative', 21),
      makePlant('c', 'vegetative', 14),
      makePlant('d', 'flowering', 7),
      makePlant('e', 'flowering', 0),
    ]
    const buckets = buildBuckets(plants, NOW)
    expect(buckets).toHaveLength(5)
    // Each bucket sums "plants alive at week-end", so as time progresses we
    // accumulate plants — strictly non-decreasing.
    for (let i = 1; i < buckets.length; i++) {
      expect(buckets[i]).toBeGreaterThanOrEqual(buckets[i - 1] ?? 0)
    }
    // Last bucket = current week → all 5 plants alive.
    expect(buckets[4]).toBe(5)
  })

  it('buildBuckets returns zeros for an empty plant list', () => {
    expect(buildBuckets([], NOW)).toEqual([0, 0, 0, 0, 0])
  })
})

// ── RTL rendering tests ───────────────────────────────────────────────────

describe('DashboardPage — rendering', () => {
  it('renders without crashing and shows the user greeting', () => {
    render(<DashboardPage />)
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
  })

  it('shows the Total Plants stat card', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Total Plants')).toBeInTheDocument()
  })

  it('shows 0 as Total Plants count when garden is empty', () => {
    render(<DashboardPage />)
    // StatCard renders value={totalPlants} — 0 for an empty plant list
    expect(screen.getAllByText('0').length).toBeGreaterThan(0)
  })
})
