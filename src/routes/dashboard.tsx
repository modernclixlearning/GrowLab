/**
 * GrowLab Dashboard Page
 * 
 * Main authenticated dashboard view with real plant data.
 */

import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Leaf, LogOut, Settings, Plus, Sprout, TreePine } from 'lucide-react'
import { useAuth } from '@/lib/stores/auth'
import { usePlants } from '@/lib/hooks/usePlants'
import { AddPlantModal } from '@/components/plants/AddPlantModal'

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
              <Leaf className="h-5 w-5 text-primary-700" />
            </div>
            <span className="text-xl font-bold text-gray-900">GrowLab</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.name || user?.email}
            </span>
            <button
              onClick={() => navigate('/garden')}
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

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0] || 'Grower'}!
          </h1>
          <p className="mt-1 text-gray-600">
            Here's an overview of your garden
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => navigate('/garden')}
            className="text-left"
          >
            <StatCard
              title="Active Plants"
              value={String(activePlants)}
              icon={<Leaf className="h-6 w-6" />}
              color="primary"
            />
          </button>
          <StatCard
            title="Total Plants"
            value={String(totalPlants)}
            icon={<TreePine className="h-6 w-6" />}
            color="accent"
          />
          <StatCard
            title="Seedlings"
            value={String(seedlings)}
            icon={<Sprout className="h-6 w-6" />}
            color="secondary"
          />
          <StatCard
            title="Flowering"
            value={String(flowering)}
            icon={<Leaf className="h-6 w-6" />}
            color="gray"
          />
        </div>

        {/* Content */}
        {totalPlants > 0 ? (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Your Garden</h2>
              <button
                onClick={() => navigate('/garden')}
                className="text-sm font-medium text-primary-700 hover:text-primary-800"
              >
                View All
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              You have {activePlants} active plant{activePlants !== 1 ? 's' : ''} growing.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/garden')}
                className="btn-primary"
              >
                <Leaf className="mr-2 h-4 w-4" />
                View Garden
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-secondary"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Plant
              </button>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="card text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
              <Leaf className="h-8 w-8 text-primary-600" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              No plants yet
            </h2>
            <p className="mb-6 text-gray-600">
              Start your garden by adding your first plant
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
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
  color: 'primary' | 'secondary' | 'accent' | 'gray'
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-700',
    secondary: 'bg-green-100 text-green-700',
    accent: 'bg-emerald-100 text-emerald-700',
    gray: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="card">
      <div className="flex items-center gap-4">
        <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}
