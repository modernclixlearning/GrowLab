/**
 * GrowLab Garden Page
 *
 * Main garden view showing all user's plants with search and filtering.
 * Route: /garden
 */

import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Leaf, Plus, Search, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/stores/auth'
import { usePlants } from '@/lib/hooks/usePlants'
import { PlantCard } from '@/components/plants/PlantCard'
import { AddPlantModal } from '@/components/plants/AddPlantModal'
import { Eyebrow, H1, H2, SystemPulse } from '@/components/shell'
import type { GrowthStage } from '@/types/plants'
import { GROWTH_STAGE_CONFIG } from '@/types/plants'

/** Filter options for growth stage */
const STAGE_FILTERS: { value: GrowthStage | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'seedling', label: 'Seedling' },
  { value: 'vegetative', label: 'Veg' },
  { value: 'flowering', label: 'Flower' },
  { value: 'harvesting', label: 'Harvest' },
  { value: 'drying', label: 'Drying' },
  { value: 'curing', label: 'Curing' },
  { value: 'completed', label: 'Done' },
]

export default function GardenPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<GrowthStage | 'all'>('all')
  const [showAddModal, setShowAddModal] = useState(false)

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    navigate('/login')
    return null
  }

  const { data, isLoading, error } = usePlants({
    search: search || undefined,
    stage: stageFilter === 'all' ? undefined : stageFilter,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  })

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

  const totalActive = data?.plants.filter((p) => p.growthStage !== 'completed').length ?? 0
  const totalFlowering = data?.plants.filter((p) => p.growthStage === 'flowering').length ?? 0

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
          count={totalActive}
          label={`Active Plants · ${totalFlowering} Flowering`}
        />
      </header>

      <main className="px-5 pt-3">
        {/* Search and Filters */}
        <div className="mb-5 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-fg-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-line bg-card pl-10 pr-4 py-2.5 text-sm text-fg placeholder:text-fg-4 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Search your plants..."
            />
          </div>

          {/* Stage Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
            {STAGE_FILTERS.map((filter) => {
              const active = stageFilter === filter.value
              return (
                <button
                  key={filter.value}
                  onClick={() => setStageFilter(filter.value)}
                  className={[
                    'whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-eyebrow font-mono transition-colors',
                    active
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-line bg-card text-fg-3 hover:bg-card-2 hover:text-fg-2',
                  ].join(' ')}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>
        </div>

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
        ) : data && data.plants.length > 0 ? (
          <>
            {/* Plant Count */}
            <Eyebrow tone="muted" className="mb-3 block">
              {data.total} plant{data.total !== 1 ? 's' : ''}
              {stageFilter !== 'all' ? ` · ${GROWTH_STAGE_CONFIG[stageFilter].label}` : ''}
              {search ? ` · "${search}"` : ''}
            </Eyebrow>

            {/* Plant List */}
            <div className="space-y-3 pb-4">
              {data.plants.map((plant) => (
                <PlantCard
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
                className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-bg shadow-accent-glow transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                <Plus className="mr-2 h-4 w-4" />
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
