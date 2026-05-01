/**
 * GrowLab Garden Page
 * 
 * Main garden view showing all user's plants with search and filtering.
 * Route: /garden
 */

import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Leaf, Plus, Search, LogOut, Settings, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/lib/stores/auth'
import { usePlants } from '@/lib/hooks/usePlants'
import { PlantCard } from '@/components/plants/PlantCard'
import { AddPlantModal } from '@/components/plants/AddPlantModal'
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Leaf className="mx-auto h-12 w-12 animate-pulse text-primary-600" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
              <Leaf className="h-5 w-5 text-primary-700" />
            </div>
            <span className="text-xl font-bold text-gray-900">My Garden</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-gray-600 sm:block">
              {user?.name || user?.email}
            </span>
            <button
              onClick={() => navigate('/settings')}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
              placeholder="Search your plants..."
            />
          </div>

          {/* Stage Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {STAGE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStageFilter(filter.value)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  stageFilter === filter.value
                    ? 'bg-primary-700 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-12 text-center">
            <Leaf className="mx-auto h-10 w-10 animate-pulse text-primary-400" />
            <p className="mt-3 text-gray-500">Loading plants...</p>
          </div>
        ) : error ? (
          <div className="card py-12 text-center">
            <p className="text-red-600">Failed to load plants. Please try again.</p>
          </div>
        ) : data && data.plants.length > 0 ? (
          <>
            {/* Plant Count */}
            <p className="mb-4 text-sm text-gray-500">
              {data.total} plant{data.total !== 1 ? 's' : ''}
              {stageFilter !== 'all' ? ` in ${GROWTH_STAGE_CONFIG[stageFilter].label}` : ''}
              {search ? ` matching "${search}"` : ''}
            </p>

            {/* Plant List */}
            <div className="space-y-3">
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
          <div className="card py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
              <Leaf className="h-8 w-8 text-primary-600" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              {search || stageFilter !== 'all' ? 'No plants found' : 'Your garden is empty'}
            </h2>
            <p className="mb-6 text-gray-600">
              {search || stageFilter !== 'all'
                ? 'Try adjusting your filters or search term'
                : 'Start your growing journey by adding your first plant'}
            </p>
            {!search && stageFilter === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Plant
              </button>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary-700 text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        aria-label="Add plant"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Add Plant Modal */}
      <AddPlantModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  )
}
