/**
 * GrowLab Dashboard Page
 *
 * Main authenticated dashboard view with real plant data.
 */

import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Leaf, LogOut, Plus, Sprout, TreePine } from 'lucide-react'
import { useAuth } from '@/lib/stores/auth'
import { usePlants } from '@/lib/hooks/usePlants'
import { AddPlantModal } from '@/components/plants/AddPlantModal'
import { Eyebrow, H1, H2 } from '@/components/shell'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const { data: plantsData } = usePlants({ limit: 100 })
  const [showAddModal, setShowAddModal] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login')
    }
  }, [isLoading, isAuthenticated, navigate])

  if (!isLoading && !isAuthenticated) return null

  if (isLoading) {
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

  const totalPlants = plantsData?.total ?? 0
  const activePlants = plantsData?.plants.filter(
    (p) => p.growthStage !== 'completed'
  ).length ?? 0
  const seedlings = plantsData?.plants.filter(
    (p) => p.growthStage === 'seedling'
  ).length ?? 0
  const flowering = plantsData?.plants.filter(
    (p) => p.growthStage === 'flowering'
  ).length ?? 0

  return (
    <div className="min-h-full">
      {/* Header */}
      <header className="px-5 pt-5 pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-soft text-accent">
              <Leaf className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <Eyebrow tone="muted">GrowLab</Eyebrow>
              <p className="truncate text-sm text-fg-2">
                {user?.name || user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-md border border-line bg-card p-2 text-fg-2 transition-colors hover:bg-card-2 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="px-5 py-4">
        {/* Welcome Section */}
        <div className="mb-6">
          <Eyebrow tone="accent" className="mb-1 block">
            Today
          </Eyebrow>
          <H1 className="text-[28px]">
            Welcome back, {user?.name?.split(' ')[0] || 'Grower'}
          </H1>
          <p className="mt-1 text-sm text-fg-3">
            Here's an overview of your garden
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/garden')}
            className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-lg"
          >
            <StatCard
              title="Active Plants"
              value={String(activePlants)}
              icon={<Leaf className="h-6 w-6" />}
              tone="accent"
            />
          </button>
          <StatCard
            title="Total Plants"
            value={String(totalPlants)}
            icon={<TreePine className="h-6 w-6" />}
            tone="veg"
          />
          <StatCard
            title="Seedlings"
            value={String(seedlings)}
            icon={<Sprout className="h-6 w-6" />}
            tone="seedling"
          />
          <StatCard
            title="Flowering"
            value={String(flowering)}
            icon={<Leaf className="h-6 w-6" />}
            tone="flower"
          />
        </div>

        {/* Content */}
        {totalPlants > 0 ? (
          <div className="rounded-lg border border-line bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <H2 className="text-[18px]">Your Garden</H2>
              <button
                onClick={() => navigate('/garden')}
                className="font-mono text-[11px] uppercase tracking-eyebrow text-accent hover:text-fg transition-colors"
              >
                View All
              </button>
            </div>
            <p className="mb-4 text-sm text-fg-3">
              You have {activePlants} active plant{activePlants !== 1 ? 's' : ''} growing.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/garden')}
                className="inline-flex flex-1 items-center justify-center rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-bg shadow-accent-glow transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                <Leaf className="mr-2 h-4 w-4" />
                View Garden
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex flex-1 items-center justify-center rounded-md border border-line bg-card-2 px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Plant
              </button>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-lg border border-line bg-card p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft">
              <Leaf className="h-8 w-8 text-accent" />
            </div>
            <Eyebrow tone="accent" className="mb-2 block">
              First Plant
            </Eyebrow>
            <H2 className="mb-2">No plants yet</H2>
            <p className="mb-6 text-sm text-fg-3">
              Start your garden by adding your first plant
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-bg shadow-accent-glow transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Plant
            </button>
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

interface StatCardProps {
  title: string
  value: string
  icon: React.ReactNode
  tone: 'accent' | 'veg' | 'seedling' | 'flower'
}

function StatCard({ title, value, icon, tone }: StatCardProps) {
  const toneClasses: Record<StatCardProps['tone'], string> = {
    accent: 'bg-accent-soft text-accent',
    veg: 'bg-stage-veg/15 text-stage-veg',
    seedling: 'bg-stage-seedling/15 text-stage-seedling',
    flower: 'bg-stage-flower/15 text-stage-flower',
  }

  return (
    <div className="rounded-lg border border-line bg-card p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md ${toneClasses[tone]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <Eyebrow tone="muted">{title}</Eyebrow>
          <p className="font-display text-2xl font-bold text-fg">{value}</p>
        </div>
      </div>
    </div>
  )
}
