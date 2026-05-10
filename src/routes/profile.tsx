/**
 * GrowLab Profile Page (F2)
 *
 * Route: `/profile`. Master Plan §F2 / issue 001 / issue 006:
 *   - AvatarHeader with stats (Plants / Harvests / Days Active).
 *   - PrefsList (StageMode toggle is functional; sensors / push /
 *     export are visible-but-disabled until F5/F6).
 *   - TentList + TentModal for create/edit/delete.
 *   - Logout button — mitigates analysis R-1 (Logout was in Garden header
 *     in F1; now lives in Profile so the regression is closed).
 */

import { Navigate, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Leaf, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/stores/auth'
import { usePlants } from '@/lib/hooks/usePlants'
import { useTents } from '@/lib/hooks/useTents'
import { AvatarHeader } from '@/components/profile/AvatarHeader'
import { PrefsList } from '@/components/profile/PrefsList'
import { TentList } from '@/components/profile/TentList'
import { TentModal } from '@/components/profile/TentModal'
import { H2 } from '@/components/shell'
import type { Tent } from '@/types/tents'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const { data: plantsData } = usePlants({ limit: 100 })
  const { data: tentsData } = useTents()

  const [tentModalOpen, setTentModalOpen] = useState(false)
  const [tentBeingEdited, setTentBeingEdited] = useState<Tent | null>(null)

  // Side-effect-free redirect: <Navigate> avoids the "cannot update during
  // render" warning that calling navigate() in render produces.
  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="text-center">
          <Leaf className="mx-auto h-12 w-12 animate-pulse text-accent" />
          <p className="mt-4 text-fg-3">Loading…</p>
        </div>
      </div>
    )
  }

  const plants = plantsData?.plants ?? []
  const tents = tentsData?.tents ?? []

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const openCreateTent = () => {
    setTentBeingEdited(null)
    setTentModalOpen(true)
  }

  const openEditTent = (tent: Tent) => {
    setTentBeingEdited(tent)
    setTentModalOpen(true)
  }

  return (
    <div className="min-h-full">
      <AvatarHeader user={user} plants={plants} />

      <PrefsList
        stageMode={user.stageMode}
        tentCount={tents.length}
        onAddTent={openCreateTent}
        onManageTents={() => {
          // No-op for F2 — TentList below already exposes per-tent
          // edit/delete. The button is wired so future grouping work can
          // open a dedicated screen without changing the API.
        }}
      />

      <TentList tents={tents} onEdit={openEditTent} />

      <section className="px-5 pb-10">
        <H2 className="sr-only">Account</H2>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-line bg-card px-4 py-3 text-sm font-semibold text-status-warn transition-colors hover:bg-status-warn/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-status-warn focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </section>

      <TentModal
        tent={tentBeingEdited}
        isOpen={tentModalOpen}
        onClose={() => setTentModalOpen(false)}
      />
    </div>
  )
}
