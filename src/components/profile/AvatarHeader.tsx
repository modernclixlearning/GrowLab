/**
 * GrowLab Profile — AvatarHeader (F2)
 *
 * Shows avatar (placeholder when null), name, email, and 3 stat tiles
 * (Plants / Harvests / Days Active). Stats are derived from the plants
 * list passed by the parent (Profile route owns the query).
 */

import { User as UserIcon } from 'lucide-react'
import { Eyebrow, H1 } from '@/components/shell'
import type { User } from '@/types/auth'
import type { Plant } from '@/types/plants'

export interface AvatarHeaderProps {
  user: User
  plants: Plant[]
}

const DAY_MS = 1000 * 60 * 60 * 24

export function AvatarHeader({ user, plants }: AvatarHeaderProps) {
  const totalPlants = plants.length
  const harvests = plants.filter((p) => p.growthStage === 'completed').length
  const daysActive = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / DAY_MS,
    ),
  )

  const initials = (user.name ?? user.email)
    .trim()
    .slice(0, 1)
    .toUpperCase()

  return (
    <header className="px-5 pt-6 pb-4">
      <div className="mb-5 flex items-center gap-4">
        <div
          className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border border-line bg-accent-soft text-accent"
          aria-hidden="true"
        >
          {user.avatarUrl ? (
            // Avatars upload lands in F4; for F2 we accept any URL the
            // server happens to have but fall back to the icon when missing.
            <img
              src={user.avatarUrl}
              alt=""
              className="h-full w-full rounded-full object-cover"
            />
          ) : initials ? (
            <span className="font-display text-2xl font-bold">{initials}</span>
          ) : (
            <UserIcon className="h-8 w-8" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Eyebrow tone="muted" className="mb-1 block">Profile</Eyebrow>
          <H1 className="truncate text-[28px]">{user.name ?? 'Grower'}</H1>
          <p className="mt-1 truncate font-mono text-[11px] uppercase tracking-eyebrow text-fg-3">
            {user.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Plants" value={totalPlants} />
        <StatTile label="Harvests" value={harvests} />
        <StatTile label="Days Active" value={daysActive} />
      </div>
    </header>
  )
}

interface StatTileProps {
  label: string
  value: number
}

function StatTile({ label, value }: StatTileProps) {
  return (
    <div className="rounded-lg border border-line bg-card p-3 text-center">
      <p className="font-display text-2xl font-bold leading-none text-fg">
        {value}
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-eyebrow text-fg-3">
        {label}
      </p>
    </div>
  )
}
