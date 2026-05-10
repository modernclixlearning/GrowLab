/**
 * GrowLab Profile — PrefsList (F2)
 *
 * Renders the Profile preferences as a stack of rows. Each row is a
 * card with eyebrow + label + leading icon + control area on the right.
 *
 * F2 ships:
 *   - Stage Mode toggle (functional, wired to PATCH /me).
 *   - Tent Profiles (counter + Add CTA; full CRUD lives in <TentList>
 *     which the parent renders alongside this list).
 *   - Notifications / Sensor Devices / Export Data — disabled
 *     placeholders with phase tags so the user can see what's coming.
 *   - About row with version + repo link.
 */

import {
  Bell,
  Cpu,
  Download,
  Github,
  Layers,
  Sparkles,
  Sun,
  Tent as TentIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Eyebrow } from '@/components/shell'
import { ToggleStageMode } from './ToggleStageMode'
import type { StageMode } from '@/types/auth'

export interface PrefsListProps {
  stageMode: StageMode
  tentCount: number
  onAddTent: () => void
  onManageTents: () => void
}

const APP_VERSION = 'v0.2.0 · F2'
const REPO_URL = 'https://github.com/modernclixlearning/growlab'

export function PrefsList({
  stageMode,
  tentCount,
  onAddTent,
  onManageTents,
}: PrefsListProps) {
  return (
    <section className="px-5 pb-6">
      <Eyebrow tone="muted" className="mb-3 block">Preferences</Eyebrow>

      <ul className="space-y-3" aria-label="User preferences">
        {/* Stage Mode — functional */}
        <PrefRow
          icon={<Layers className="h-5 w-5" />}
          iconTone="accent"
          title="Stage Mode"
          description={
            stageMode === 'basic'
              ? 'Showing 4 simplified buckets'
              : 'Showing the full 7-stage cycle'
          }
          control={<ToggleStageMode current={stageMode} />}
        />

        {/* Tent Profiles — F2 functional, minimal CRUD */}
        <PrefRow
          icon={<TentIcon className="h-5 w-5" />}
          iconTone="accent"
          title="Tent Profiles"
          description={
            tentCount === 0
              ? '0 tents configured'
              : `${tentCount} tent${tentCount === 1 ? '' : 's'} configured`
          }
          control={
            <div className="flex gap-2">
              {tentCount > 0 && (
                <button
                  type="button"
                  onClick={onManageTents}
                  className="rounded-full border border-line bg-card-2 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-eyebrow text-fg-2 transition-colors hover:bg-card hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                >
                  Manage
                </button>
              )}
              <button
                type="button"
                onClick={onAddTent}
                className="rounded-full bg-accent-soft px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-eyebrow text-accent transition-colors hover:bg-accent/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                Add Tent
              </button>
            </div>
          }
        />

        {/* Coming-soon placeholders — visible but disabled, so the user
            sees the roadmap and we mitigate R-1 (no surprise feature gaps). */}
        <PrefRow
          icon={<Bell className="h-5 w-5" />}
          iconTone="muted"
          title="Notifications"
          description="Push, email, in-app"
          control={<ComingSoonBadge phase="F6" />}
          disabled
        />
        <PrefRow
          icon={<Cpu className="h-5 w-5" />}
          iconTone="muted"
          title="Sensor Devices"
          description="Govee, Inkbird, SwitchBot"
          control={<ComingSoonBadge phase="F5" />}
          disabled
        />
        <PrefRow
          icon={<Download className="h-5 w-5" />}
          iconTone="muted"
          title="Export Data"
          description="CSV + JSON archive"
          control={<ComingSoonBadge phase="F6" />}
          disabled
        />

        {/* Always-visible reference / about */}
        <PrefRow
          icon={<Sparkles className="h-5 w-5" />}
          iconTone="muted"
          title="About"
          description={APP_VERSION}
          control={
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card-2 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-eyebrow text-fg-2 transition-colors hover:bg-card hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              <Github className="h-3.5 w-3.5" />
              Repo
            </a>
          }
        />

        {/* Decorative bottom marker mirroring the prototype tone — keeps
            the list from looking truncated under the BottomNav padding. */}
        <li className="flex items-center justify-center pt-2 text-fg-4">
          <Sun className="h-4 w-4 opacity-50" aria-hidden="true" />
        </li>
      </ul>
    </section>
  )
}

interface PrefRowProps {
  icon: ReactNode
  iconTone: 'accent' | 'muted'
  title: string
  description: string
  control: ReactNode
  disabled?: boolean
}

function PrefRow({
  icon,
  iconTone,
  title,
  description,
  control,
  disabled,
}: PrefRowProps) {
  return (
    <li
      className={[
        'flex items-center gap-4 rounded-lg border border-line bg-card p-4',
        disabled ? 'opacity-65' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className={[
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md',
          iconTone === 'accent'
            ? 'bg-accent-soft text-accent'
            : 'bg-card-2 text-fg-3',
        ].join(' ')}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-semibold text-fg">{title}</p>
        <p className="mt-0.5 text-xs text-fg-3">{description}</p>
      </div>
      <div className="flex-shrink-0">{control}</div>
    </li>
  )
}

function ComingSoonBadge({ phase }: { phase: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-bg-1 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-eyebrow text-fg-3">
      Coming in {phase}
    </span>
  )
}
