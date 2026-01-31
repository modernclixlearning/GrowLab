/**
 * GrowLab Dashboard Page
 * 
 * Main authenticated dashboard view.
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Leaf, LogOut, Settings, Plus } from 'lucide-react'
import { useAuth } from '@/lib/stores/auth'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    navigate({ to: '/login' })
    return null
  }

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
    navigate({ to: '/' })
  }

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
              onClick={() => navigate({ to: '/settings' })}
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
          <StatCard
            title="Active Plants"
            value="0"
            icon={<Leaf className="h-6 w-6" />}
            color="primary"
          />
          <StatCard
            title="Care Tasks Today"
            value="0"
            icon={<Plus className="h-6 w-6" />}
            color="accent"
          />
          <StatCard
            title="This Week's Logs"
            value="0"
            icon={<Plus className="h-6 w-6" />}
            color="secondary"
          />
          <StatCard
            title="Photos"
            value="0"
            icon={<Plus className="h-6 w-6" />}
            color="gray"
          />
        </div>

        {/* Empty State */}
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
          <button className="btn-primary">
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Plant
          </button>
        </div>
      </main>
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
