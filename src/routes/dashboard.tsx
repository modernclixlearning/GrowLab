/**
 * GrowLab Dashboard Page
 *
 * F1 redesign (Master Plan §3 F1):
 *   - <StatCard> tiles for active/total/seedling/flowering counts.
 *   - <CareTaskCard> read-only of recent care logs from the last 48h.
 * F3 adds:
 *   - "Pending today" section above "Recent Activity" using useScheduledCareLogs.
 */

import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  Leaf,
  LogOut,
  Plus,
  Sprout,
  TreePine,
  Activity,
  CalendarCheck,
} from 'lucide-react'
import { useAuth } from '@/lib/stores/auth'
import { usePlants } from '@/lib/hooks/usePlants'
import { useCareLogs, useScheduledCareLogs, useCompleteCareLog } from '@/lib/hooks/useCareLogs'
import { useSensorDevices } from '@/lib/hooks/useSensors'
import { AddPlantModal } from '@/components/plants/AddPlantModal'
import { Eyebrow, H1, H2, SystemPulse } from '@/components/shell'
import { StatCard, CareTaskCard, MiniChart } from '@/components/dashboard'
import { TaskRow } from '@/components/schedule'
import { derivePlantStats } from '@/lib/plantStats'
import type { Plant } from '@/types/plants'
import type { CareLog } from '@/types/care-logs'

const RECENT_HOURS = 48

/**
 * Subscribes to care logs for a single plant and forwards the most recent
 * entry within the last 48h to the parent.
 */
function RecentCareTaskRow({
  plant,
  onClick,
}: {
  plant: Plant
  onClick: () => void
}) {
  const { data } = useCareLogs(plant.id, { sortOrder: 'desc', limit: 5 })

  let recent: CareLog | null = null
  if (data?.careLogs?.length) {
    const cutoff = Date.now() - RECENT_HOURS * 60 * 60 * 1000
    const log = data.careLogs.find((l) => {
      const ts = new Date(l.loggedAt).getTime()
      return !Number.isNaN(ts) && ts >= cutoff
    })
    recent = log ?? null
  }

  if (!recent) return null

  const amountLabel =
    recent.amount && recent.unit
      ? `${recent.amount} ${recent.unit}`
      : recent.amount ?? null

  return (
    <CareTaskCard
      plant={plant}
      logType={recent.logType}
      occurredAt={recent.loggedAt}
      amount={amountLabel}
      onClick={onClick}
    />
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const { data: plantsData } = usePlants({
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    limit: 100,
  })
  const [showAddModal, setShowAddModal] = useState(false)

  // ── Data hooks ──────────────────────────────────────────────────────────
  // All hooks MUST run before the early returns below; calling hooks after a
  // conditional return violates the Rules of Hooks and crashes with React
  // error #310 when `isLoading` flips between renders.

  // F5 — Sensor devices (Expert mode status is derived after the returns).
  const { data: sensorData } = useSensorDevices()

  // F3 — "Pending today": scheduled tasks due today that aren't yet completed.
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)
  const { data: pendingData } = useScheduledCareLogs({
    scheduledFrom: todayStart.toISOString(),
    scheduledTo: todayEnd.toISOString(),
  })
  const { mutate: completeCareLog, isPending: isCompleting } = useCompleteCareLog()

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

  const plants = plantsData?.plants ?? []
  const stats = derivePlantStats(plants)
  const seedlings = plants.filter((p) => p.growthStage === 'seedling').length
  const totalPlants = plants.length

  // F5 — Sensor status for Expert mode (derived from the hook data above).
  const isExpert = user?.stageMode === 'expert'
  const sensorDevices = sensorData?.devices ?? []
  const sensorStatus = !isExpert
    ? undefined
    : sensorDevices.length === 0
      ? 'NO SENSORS'
      : sensorDevices.some((d) => d.lastError)
        ? 'SENSORS DEGRADED'
        : 'SENSORS ONLINE'

  const plantMap: Record<string, string> = {}
  for (const p of plants) plantMap[p.id] = p.name

  const pendingTasks = (pendingData?.careLogs ?? []).filter((l) => !l.completedAt)

  // Limit the "recent care" subscription to the 5 most recently updated
  // plants — bounds the query cost while still surfacing a useful list.
  const candidates = plants.slice(0, 5)

  return (
    <div className="min-h-full">
      {/* Header */}
      <header className="px-5 pt-5 pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-md border border-accent-dark bg-accent-soft text-accent">
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

      <main className="space-y-6 px-5 py-4">
        {/* Welcome */}
        <div>
          <Eyebrow tone="accent" className="mb-1 block">
            Today
          </Eyebrow>
          <H1 className="text-[28px]">
            Welcome back, {user?.name?.split(' ')[0] || 'Grower'}
          </H1>
          <SystemPulse
            className="mt-2"
            count={stats.active}
            label={`Active · ${stats.flowering} Flowering`}
            status={sensorStatus}
          />
        </div>

        {/* Stats grid */}
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">
            Garden statistics
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <button
              onClick={() => navigate('/garden')}
              className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-lg"
            >
              <StatCard
                label="Active Plants"
                value={stats.active}
                tone="accent"
                icon={<Activity className="h-5 w-5" />}
                sub={`${stats.total} TOTAL`}
              />
            </button>
            <StatCard
              label="Total Plants"
              value={totalPlants}
              tone="veg"
              icon={<TreePine className="h-5 w-5" />}
              sub={
                totalPlants > 0
                  ? `${seedlings} SEED · ${stats.flowering} FLR`
                  : 'EMPTY GARDEN'
              }
            />
            <StatCard
              label="Seedlings"
              value={seedlings}
              tone="seedling"
              icon={<Sprout className="h-5 w-5" />}
            />
            <StatCard
              label="Flowering"
              value={stats.flowering}
              tone="flower"
              icon={<Leaf className="h-5 w-5" />}
            />
          </div>
        </section>

        {/* F3 — Pending today */}
        {pendingTasks.length > 0 && (
          <section aria-labelledby="pending-heading">
            <div className="mb-3 flex items-baseline justify-between">
              <H2 id="pending-heading" className="flex items-center gap-2 text-[18px]">
                <CalendarCheck className="h-4 w-4 text-accent" />
                Pending today
              </H2>
              <span className="font-mono text-[11px] text-fg-2">
                {pendingTasks.length} task{pendingTasks.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              {pendingTasks.slice(0, 5).map((log) => (
                <TaskRow
                  key={log.id}
                  careLog={log}
                  plantName={plantMap[log.plantId] ?? 'Plant'}
                  onComplete={(id) => completeCareLog(id)}
                  isCompleting={isCompleting}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recent activity (CareTaskCards) */}
        <section aria-labelledby="recent-heading">
          <div className="mb-3 flex items-baseline justify-between">
            <H2 id="recent-heading" className="text-[18px]">
              Recent Activity
            </H2>
            <button
              onClick={() => navigate('/garden')}
              className="font-mono text-[11px] uppercase tracking-eyebrow text-accent transition-colors hover:text-fg"
            >
              View garden
            </button>
          </div>
          {totalPlants === 0 ? (
            <EmptyDashboardCard onAdd={() => setShowAddModal(true)} />
          ) : (
            <div className="space-y-2">
              {candidates.map((plant) => (
                <RecentCareTaskRow
                  key={plant.id}
                  plant={plant}
                  onClick={() => navigate(`/plants/${plant.id}`)}
                />
              ))}
              <p className="font-mono text-[11px] text-fg-4">
                Showing care logs from the last {RECENT_HOURS}h.
              </p>
            </div>
          )}
        </section>

        {/* Mini chart placeholder */}
        {totalPlants > 0 && (
          <section aria-labelledby="growth-heading">
            <div className="mb-3 flex items-baseline justify-between">
              <H2 id="growth-heading" className="text-[18px]">
                Tent Growth
              </H2>
              <Eyebrow tone="muted">Placeholder · F5 wires real data</Eyebrow>
            </div>
            <MiniChart plants={plants} />
          </section>
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

function EmptyDashboardCard({ onAdd }: { onAdd: () => void }) {
  return (
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
        onClick={onAdd}
        className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-bg shadow-accent-glow transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Your First Plant
      </button>
    </div>
  )
}
