/**
 * GrowLab — Plant Detail (F6e RTL rewrite)
 *
 * Phase F6e: upgraded from F1 module smoke to @testing-library/react
 * render tests with full hook mocking. Retains the pure derivation
 * tests for weekOfStage and deriveCareTag from the original F1 file.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { deriveCareTag } from '@/lib/careTag'
import type { CareLog } from '@/types/care-logs'

// ── Mock modules before component import ───────────────────────────────────

vi.mock('react-router-dom', () => ({
  Navigate: () => null,
  useNavigate: () => vi.fn(),
  useParams: () => ({ plantId: 'plant1' }),
}))

vi.mock('@/lib/stores/auth', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'test@test.com', name: 'Tester', stageMode: 'expert', hasOnboarded: true },
    isAuthenticated: true,
    isLoading: false,
    logout: vi.fn(),
  }),
}))

vi.mock('@/lib/hooks/usePlants', () => ({
  usePlant: () => ({ data: mockPlant, isLoading: false, error: null }),
  useUpdatePlant: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeletePlant: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('@/lib/hooks/useCareLogs', () => ({
  useCareLogs: () => ({ data: { careLogs: [] }, isLoading: false }),
}))

vi.mock('@/lib/hooks/useGrowth', () => ({
  useGrowthMeasurements: () => ({ data: { measurements: [], growthBars: [] }, isLoading: false }),
}))

vi.mock('@/lib/hooks/useStrainTemplates', () => ({
  useStrainTemplates: () => ({ data: { strainTemplates: [] }, isLoading: false }),
}))

vi.mock('@/components/care-logs/CareLogList', () => ({ CareLogList: () => null }))
vi.mock('@/components/plants/PhotoTimeline', () => ({ PhotoTimeline: () => null }))
vi.mock('@/components/plants/UploadZone', () => ({ UploadZone: () => null }))
vi.mock('@/components/plants/HumidityWidget', () => ({ HumidityWidget: () => null }))
vi.mock('@/components/plants/TempWidget', () => ({ TempWidget: () => null }))
vi.mock('@/components/plants/GrowthBars', () => ({ GrowthBars: () => null }))
vi.mock('@/components/export/PlantPDFButton', () => ({ PlantPDFButton: () => null }))
vi.mock('@/components/notifications/NotificationBadge', () => ({ NotificationBadge: () => null }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import PlantDetailPage from '@/routes/plants/$plantId'
import { NotificationDrawerProvider } from '@/lib/stores/notification-drawer'

/**
 * PlantDetail consumes `useNotificationDrawer`, which throws when rendered
 * outside its provider. Wrap renders so the component mounts in isolation.
 */
function renderPage() {
  return render(
    <NotificationDrawerProvider>
      <PlantDetailPage />
    </NotificationDrawerProvider>,
  )
}

const mockPlant = {
  id: 'plant1',
  userId: 'u1',
  name: 'OG Kush #1',
  strainType: 'indica' as const,
  growthStage: 'vegetative' as const,
  stageStartDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  healthStatus: 'healthy' as const,
  photoUrl: null,
  notes: null,
  tentId: null,
  strainTemplateId: null,
  strainName: null,
  stageDurationOverride: null,
  lightSchedule: null,
  heroPhotoUrl: null,
  weekDeltaCache: null,
  weekOfStage: 3,
  totalWeeks: null,
  createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
}

const NOW = new Date('2026-05-09T12:00:00.000Z')

function waterLog(hoursAgo: number, id = 'l1'): CareLog {
  return {
    id,
    plantId: 'p1',
    logType: 'water',
    amount: '500',
    unit: 'ml',
    notes: null,
    loggedAt: new Date(NOW.getTime() - hoursAgo * 60 * 60 * 1000).toISOString(),
  }
}

/** Mirrors the inline formula from `routes/plants/$plantId.tsx`. */
function weekOfStage(daysInStage: number): number {
  return Math.max(1, Math.floor(daysInStage / 7) + 1)
}

describe('Plant Detail — derivations', () => {
  it('weekOfStage maps day counts to 1-indexed week buckets', () => {
    expect(weekOfStage(0)).toBe(1)
    expect(weekOfStage(6)).toBe(1)
    expect(weekOfStage(7)).toBe(2)
    expect(weekOfStage(13)).toBe(2)
    expect(weekOfStage(14)).toBe(3)
    expect(weekOfStage(60)).toBe(Math.floor(60 / 7) + 1)
  })

  it('deriveCareTag drives the page Care Status pill (smoke through helper)', () => {
    const tag = deriveCareTag([waterLog(2)], NOW)
    expect(tag.tone).toBe('good')
    expect(tag.label).toBe('WATERED')
    // Page expects hoursSinceWater present so the "Xh since last water"
    // suffix renders.
    expect(typeof tag.hoursSinceWater).toBe('number')
  })

  it('deriveCareTag returns NO DATA when no water logs exist', () => {
    const tag = deriveCareTag([], NOW)
    expect(tag.label).toBe('NO DATA')
    expect(tag.tone).toBe('alert')
  })
})

// ── RTL rendering tests ───────────────────────────────────────────────────

describe('PlantDetailPage — rendering', () => {
  it('renders the plant name', () => {
    renderPage()
    expect(screen.getByText('OG Kush #1')).toBeInTheDocument()
  })

  it('renders the current growth stage label', () => {
    renderPage()
    // GROWTH_STAGE_CONFIG['vegetative'].label = 'Vegetative'
    expect(screen.getByText('Vegetative')).toBeInTheDocument()
  })

  it('renders weekOfStage from plant data', () => {
    renderPage()
    // StatTile renders "Week 3" (plant.weekOfStage = 3)
    expect(screen.getByText('Week 3')).toBeInTheDocument()
  })
})
