/**
 * GrowLab Garden Page
 *
 * Main garden view showing all user's plants with search and filtering.
 * Route: /garden
 *
 * F1 wiring (Master Plan §3 F1):
 *   - `<SystemPulse>` count derives from `derivePlantStats` (real numbers).
 *   - `<StagePills>` renders the 7-stage Expert filter (Basic/Expert toggle is F2).
 *   - Search filters by `name` (Plant has no `strain` field — `strainType`
 *     is enum-only, so we additionally match the human strain label from
 *     STRAIN_TYPE_CONFIG to honor "search by name and strain").
 *   - Per-plant `careTag` is derived in the parent and passed to `<PlantCard>`.
 */

import { Navigate, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { Leaf, Search, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/stores/auth'
import { NotificationBadge } from '@/components/notifications/NotificationBadge'
import { useNotificationDrawer } from '@/lib/stores/notification-drawer'
import { useFabAction } from '@/lib/stores/fab-action'
import { usePlants } from '@/lib/hooks/usePlants'
import { useCareLogs } from '@/lib/hooks/useCareLogs'
import { PlantCard } from '@/components/plants/PlantCard'
import { StagePills, type StageFilter } from '@/components/plants/StagePills'
import { AddPlantModal } from '@/components/plants/AddPlantModal'
import { Eyebrow, H1, H2, SystemPulse } from '@/components/shell'
import { derivePlantStats } from '@/lib/plantStats'
import { deriveCareTag, type CareTag } from '@/lib/careTag'
import {
  expertToBasic,
  BASIC_STAGE_LABEL,
  type BasicStage,
} from '@/lib/stage-mapping'
import type { Plant } from '@/types/plants'
import { STRAIN_TYPE_CONFIG, GROWTH_STAGE_CONFIG } from '@/types/plants'
import type { StageMode } from '@/types/auth'

/**
 * Filter the plant list by search query (name + human strain label) and
 * stage. The stage comparison is mode-aware: in Basic mode, plants are
 * mapped through `expertToBasic` before checking against the bucket so
 * harvesting/drying/curing/completed all match the "harvest" pill.
 *
 * Pure helper — exposed for unit testing.
 */
function filterPlants(
  plants: Plant[],
  search: string,
  stageFilter: StageFilter,
  stageMode: StageMode,
): Plant[] {
  const q = search.trim().toLowerCase()
  return plants.filter((p) => {
    if (stageFilter !== 'all') {
      if (stageMode === 'basic') {
        if (expertToBasic(p.growthStage) !== (stageFilter as BasicStage)) {
          return false
        }
      } else if (p.growthStage !== stageFilter) {
        return false
      }
    }
    if (!q) return true
    const strainLabel = STRAIN_TYPE_CONFIG[p.strainType]?.label ?? p.strainType
    return (
      p.name.toLowerCase().includes(q) ||
      strainLabel.toLowerCase().includes(q) ||
      p.strainType.toLowerCase().includes(q)
    )
  })
}

/**
 * Inner row that renders a `<PlantCard>` and pulls the plant's care logs
 * to derive the careTag. Care logs are scoped per-plant in the API, so
 * each card needs its own query — React Query dedupes.
 */
function PlantCardWithCareTag({
  plant,
  onClick,
}: {
  plant: Plant
  onClick: () => void
}) {
  // Narrow per-card query to the single most recent water log: deriveCareTag
  // only inspects water events, and a 1-row payload bounds the N+1 cost
  // (one query per visible card) until a server-side aggregate lands.
  const { data: careLogsData } = useCareLogs(plant.id, {
    logType: 'water',
    sortOrder: 'desc',
    limit: 1,
  })

  const careTag: CareTag | undefined = useMemo(() => {
    if (!careLogsData) return undefined
    return deriveCareTag(careLogsData.careLogs)
  }, [careLogsData])

  return <PlantCard plant={plant} onClick={onClick} careTag={careTag} />
}

export default function GardenPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const stageMode: StageMode = user?.stageMode ?? 'expert'
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<StageFilter>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const { open: openNotifications } = useNotificationDrawer()
  const { register: registerFab } = useFabAction()

  // Wire the BottomNav FAB to the AddPlantModal while Garden is mounted.
  useEffect(() => {
    registerFab(() => setShowAddModal(true))
    return () => registerFab(null)
  }, [registerFab])

  // When the user flips Basic↔Expert in Profile, the previously-selected
  // filter may no longer be a valid pill (e.g., 'flowering' isn't a
  // Basic bucket). Reset to 'all' on stageMode change so the UI never
  // ends up with an orphan filter that hides every plant.
  useEffect(() => {
    setStageFilter('all')
  }, [stageMode])

  // Redirect to login if not authenticated. Returning <Navigate> instead of
  // calling navigate() keeps the render side-effect-free (avoids "cannot
  // update during render" warnings and double-navigation loops).
  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Fetch the full plant list once and apply filters client-side so the
  // SystemPulse counts always reflect the unfiltered totals while the
  // visible list responds to filters. Backend filtering would force two
  // queries per render — overkill for the typical < 100-plant garden.
  const { data, isLoading, error } = usePlants({
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    limit: 100,
  })

  const allPlants = data?.plants ?? []
  const stats = useMemo(() => derivePlantStats(allPlants), [allPlants])
  const stageCounts = useMemo(() => {
    const counts: Partial<Record<StageFilter, number>> = { all: allPlants.length }
    if (stageMode === 'basic') {
      for (const p of allPlants) {
        const bucket = expertToBasic(p.growthStage)
        counts[bucket] = (counts[bucket] ?? 0) + 1
      }
    } else {
      for (const p of allPlants) {
        counts[p.growthStage] = (counts[p.growthStage] ?? 0) + 1
      }
    }
    return counts
  }, [allPlants, stageMode])

  const filtered = useMemo(
    () => filterPlants(allPlants, search, stageFilter, stageMode),
    [allPlants, search, stageFilter, stageMode],
  )

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="text-center">
          <Leaf className="mx-auto h-12 w-12 animate-pulse text-accent" />
          <p className="mt-4 text-fg-3">Loading...</p>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-full">
      <header className="px-5 pt-5 pb-2">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-soft text-accent">
              <Leaf className="h-5 w-5" />
            </div>
            <H1 className="text-[28px]">Garden</H1>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="hidden text-xs text-fg-3 sm:block max-w-[120px] truncate"
              title={user?.name || user?.email}
            >
              {user?.name || user?.email}
            </span>
            <NotificationBadge onClick={openNotifications} />
            <button
              onClick={handleLogout}
              className="rounded-md border border-line bg-card p-2 text-fg-2 transition-colors hover:bg-card-2 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        <SystemPulse
          count={stats.active}
          label={`Active Plants · ${stats.flowering} Flowering`}
        />
      </header>

      <main className="px-5 pt-3">
        {/* Search */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-fg-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-line bg-card pl-10 pr-4 py-2.5 text-sm text-fg placeholder:text-fg-4 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="Search your plants..."
            aria-label="Search plants"
          />
        </div>

        {/* Stage filter pills — F2 reactive to user.stageMode. */}
        <StagePills
          selected={stageFilter}
          onChange={setStageFilter}
          counts={stageCounts}
          stageMode={stageMode}
          className="mb-5 -mx-5 px-5"
        />

        {/* Content */}
        {isLoading ? (
          <div className="py-12 text-center">
            <Leaf className="mx-auto h-10 w-10 animate-pulse text-accent" />
            <p className="mt-3 text-fg-3">Loading plants...</p>
          </div>
        ) : error ? (
          <div className="rounded-md border border-status-warn/40 bg-card p-6 py-12 text-center">
            <p className="text-status-warn">Failed to load plants. Please try again.</p>
          </div>
        ) : filtered.length > 0 ? (
          <>
            {/* Plant Count */}
            <Eyebrow tone="muted" className="mb-3 block">
              {filtered.length} plant{filtered.length !== 1 ? 's' : ''}
              {stageFilter !== 'all'
                ? ` · ${
                    stageMode === 'basic'
                      ? BASIC_STAGE_LABEL[stageFilter as BasicStage]
                      : GROWTH_STAGE_CONFIG[
                          stageFilter as Exclude<StageFilter, 'all' | BasicStage>
                        ]?.label ?? stageFilter
                  }`
                : ''}
              {search ? ` · "${search}"` : ''}
            </Eyebrow>

            {/* Plant List — single column on mobile, multi-column on
                tablet/desktop to use the wider canvas. */}
            <div className="grid grid-cols-1 gap-3 pb-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((plant) => (
                <PlantCardWithCareTag
                  key={plant.id}
                  plant={plant}
                  onClick={() => navigate(`/plants/${plant.id}`)}
                />
              ))}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="rounded-lg border border-line bg-card p-8 py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft">
              <Leaf className="h-8 w-8 text-accent" />
            </div>
            <Eyebrow tone="accent" className="mb-2 block">
              Empty Garden
            </Eyebrow>
            <H2 className="mb-2">
              {search || stageFilter !== 'all' ? 'No plants found' : 'Your garden is empty'}
            </H2>
            <p className="mb-6 text-sm text-fg-3">
              {search || stageFilter !== 'all'
                ? 'Try adjusting your filters or search term'
                : 'Start your growing journey by adding your first plant'}
            </p>
            {!search && stageFilter === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-bg shadow-accent-glow transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                Add Your First Plant
              </button>
            )}
          </div>
        )}
      </main>

      {/* Add Plant Modal */}
      <AddPlantModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  )
}

// Exported for tests — pure filter helper for the search + stage pipeline.
export { filterPlants }
