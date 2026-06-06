/**
 * GrowLab Plant Detail Page
 *
 * F1 redesign (Master Plan §3 F1):
 *   - Full-width hero image from `photoUrl` (`heroPhotoUrl` lands in F2).
 *   - Stage-tinted eyebrow + pulse dot, mono "ID · PLANTED date" line.
 *   - Stat tiles (age, in-stage week, careTag).
 *   - Quick action grid + redesigned <CareLogList>.
 *   - NO humidity/light/temp/photo timeline (F4/F5 territory).
 *
 * Toasts: Sonner is fired by `<CareLogList>` after each mutation; the
 * stage-advance + delete mutations now also surface success/error
 * feedback (CLAUDE.md UI Feedback Standard).
 */

import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Leaf,
  ArrowLeft,
  Trash2,
  Pencil,
  ChevronRight,
  Calendar,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/lib/stores/auth'
import { usePlant, useUpdatePlant, useDeletePlant } from '@/lib/hooks/usePlants'
import { useCareLogs } from '@/lib/hooks/useCareLogs'
import { useGrowthMeasurements } from '@/lib/hooks/useGrowth'
import { useStrainTemplates } from '@/lib/hooks/useStrainTemplates'
import { CareLogList } from '@/components/care-logs/CareLogList'
import { PlantPDFButton } from '@/components/export/PlantPDFButton'
import { UploadZone } from '@/components/plants/UploadZone'
import { EditPlantModal } from '@/components/plants/EditPlantModal'
import { NotificationBadge } from '@/components/notifications/NotificationBadge'
import { useNotificationDrawer } from '@/lib/stores/notification-drawer'
import { LightCyclePill } from '@/components/plants/LightCyclePill'
import { PhotoTimeline } from '@/components/plants/PhotoTimeline'
import { HumidityWidget } from '@/components/plants/HumidityWidget'
import { TempWidget } from '@/components/plants/TempWidget'
import { GrowthBars } from '@/components/plants/GrowthBars'
import { Eyebrow, H1, H2, H3 } from '@/components/shell'
import { deriveCareTag, CARE_TAG_TONE_CLASS } from '@/lib/careTag'
import { getApiErrorToastMessage } from '@/lib/api/errors'
import type { GrowthStage, HealthStatus, StrainType, FloweringType } from '@/types/plants'
import {
  GROWTH_STAGE_CONFIG,
  HEALTH_STATUS_CONFIG,
  STRAIN_TYPE_CONFIG,
  FLOWERING_TYPE_CONFIG,
} from '@/types/plants'

/** Days since a date string. */
function daysSince(dateStr: string): number {
  const date = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Stage → next stage (used by the "advance stage" CTA). */
const NEXT_STAGE: Record<string, GrowthStage | null> = {
  seedling: 'vegetative',
  vegetative: 'flowering',
  flowering: 'harvesting',
  harvesting: 'drying',
  drying: 'curing',
  curing: 'completed',
  completed: null,
}

/** Tailwind classes per stage for the eyebrow + pulse-dot accent. */
const STAGE_ACCENT: Record<GrowthStage, { text: string; bg: string; ring: string }> = {
  seedling: { text: 'text-stage-seedling', bg: 'bg-stage-seedling', ring: 'ring-stage-seedling/40' },
  vegetative: { text: 'text-stage-veg', bg: 'bg-stage-veg', ring: 'ring-stage-veg/40' },
  flowering: { text: 'text-stage-flower', bg: 'bg-stage-flower', ring: 'ring-stage-flower/40' },
  harvesting: { text: 'text-status-alert', bg: 'bg-status-alert', ring: 'ring-status-alert/40' },
  drying: { text: 'text-status-alert', bg: 'bg-status-alert', ring: 'ring-status-alert/40' },
  curing: { text: 'text-status-thirsty', bg: 'bg-status-thirsty', ring: 'ring-status-thirsty/40' },
  completed: { text: 'text-fg-3', bg: 'bg-fg-3', ring: 'ring-fg-4/40' },
}

export default function PlantDetailPage() {
  const navigate = useNavigate()
  const { plantId } = useParams<{ plantId: string }>()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const stageMode = user?.stageMode ?? 'expert'
  const { data: plant, isLoading, error } = usePlant(plantId ?? '')
  const { data: strainTemplatesData } = useStrainTemplates()
  // Narrow the careTag query to the single most recent water log — that's
  // all `deriveCareTag` actually needs. The full timeline is fetched
  // separately by `<CareLogList>` (different query key, different params),
  // and trimming this payload avoids shipping ~20 unrelated logs per
  // page render just to derive a "watered Xh ago" pill.
  const { data: careLogsData } = useCareLogs(plantId ?? '', {
    logType: 'water',
    sortOrder: 'desc',
    limit: 1,
  })
  // PDF queries — broader fetch (all log types, higher limit) for the report.
  const { data: pdfCareLogsData } = useCareLogs(plantId ?? '', { sortOrder: 'desc', limit: 100 })
  const { data: growthData } = useGrowthMeasurements(plantId ?? '')
  const updatePlant = useUpdatePlant()
  const deletePlant = useDeletePlant()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const { open: openNotifications } = useNotificationDrawer()

  // Redirect to login without calling navigate() during render — using the
  // <Navigate> element keeps the render pure.
  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="text-center">
          <Leaf className="mx-auto h-12 w-12 animate-pulse text-accent" />
          <p className="mt-4 text-fg-3">Loading plant...</p>
        </div>
      </div>
    )
  }

  if (error || !plant) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-lg border border-line bg-card max-w-md p-6 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-status-warn" />
          <H2 className="mb-2">Plant Not Found</H2>
          <p className="mb-6 text-sm text-fg-3">
            This plant doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={() => navigate('/garden')}
            className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-bg shadow-accent-glow transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Back to Garden
          </button>
        </div>
      </div>
    )
  }

  const stage = plant.growthStage as GrowthStage
  const stageConfig = GROWTH_STAGE_CONFIG[stage]
  const healthConfig = HEALTH_STATUS_CONFIG[plant.healthStatus as HealthStatus]
  const strainConfig = STRAIN_TYPE_CONFIG[plant.strainType as StrainType]
  const floweringConfig = FLOWERING_TYPE_CONFIG[plant.floweringType as FloweringType]
  const daysInStage = daysSince(plant.stageStartDate)
  const totalAge = daysSince(plant.createdAt)
  // F2: weekOfStage now comes from the server, derived against the
  // strain template's stageDurations (or override). Fallback to the
  // same client formula keeps the UI working even if the API hasn't
  // been redeployed yet.
  const weekOfStage =
    plant.weekOfStage ?? Math.max(1, Math.floor(daysInStage / 7) + 1)
  const totalWeeks = plant.totalWeeks ?? null
  const nextStage = NEXT_STAGE[plant.growthStage]
  const stageAccent = STAGE_ACCENT[stage] ?? STAGE_ACCENT.completed
  const careTag = careLogsData ? deriveCareTag(careLogsData.careLogs) : null
  const idShort = plant.id.slice(0, 4).toUpperCase()

  // F2: prefer named strain (template > free-form > strainType label).
  const strainTemplate = plant.strainTemplateId
    ? strainTemplatesData?.strainTemplates.find(
        (t) => t.id === plant.strainTemplateId,
      ) ?? null
    : null
  const displayStrain =
    strainTemplate?.name ??
    plant.strainName ??
    strainConfig?.label ??
    plant.strainType

  const handleAdvanceStage = async () => {
    if (!nextStage) return
    try {
      await updatePlant.mutateAsync({
        plantId: plant.id,
        data: { growthStage: nextStage },
      })
      toast.success(`Advanced to ${GROWTH_STAGE_CONFIG[nextStage].label}`)
    } catch (err) {
      toast.error(getApiErrorToastMessage(err, 'Failed to advance stage'))
    }
  }

  const handleDelete = async () => {
    try {
      await deletePlant.mutateAsync(plant.id)
      toast.success(`${plant.name} deleted`)
      navigate('/garden')
    } catch (err) {
      toast.error(getApiErrorToastMessage(err, 'Failed to delete plant'))
    }
  }

  return (
    <div className="min-h-full">
      {/* Hero — full-width photo with overlay back button + identity */}
      <header
        className="relative isolate h-[320px] overflow-hidden bg-bg-2"
        style={
          plant.photoUrl
            ? {
                backgroundImage: `url(${plant.photoUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-bg/40 via-bg/10 to-bg" />

        {/* Top action row */}
        <div className="relative z-10 flex items-center justify-between p-4">
          <button
            onClick={() => navigate('/garden')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-bg/60 text-fg backdrop-blur transition-colors hover:bg-bg/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            aria-label="Back to garden"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <NotificationBadge onClick={openNotifications} />
            <PlantPDFButton
              plant={plant}
              careLogs={pdfCareLogsData?.careLogs ?? []}
              growthMeasurements={growthData?.measurements ?? []}
            />
            <button
              onClick={() => setShowEditModal(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-bg/60 text-fg-2 backdrop-blur transition-colors hover:bg-accent/20 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              aria-label="Edit plant"
            >
              <Pencil className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-bg/60 text-fg-2 backdrop-blur transition-colors hover:bg-status-warn/30 hover:text-status-warn focus:outline-none focus-visible:ring-2 focus-visible:ring-status-warn focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              aria-label="Delete plant"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Identity row pinned at bottom */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-5">
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 flex-shrink-0 rounded-full animate-gl-pulse-dot shadow-accent-glow ${stageAccent.bg}`}
              aria-hidden="true"
            />
            <Eyebrow className={stageAccent.text}>
              {(strainConfig?.label ?? plant.strainType).toUpperCase()}
              {floweringConfig?.shortLabel === 'Auto' && ' · AUTO'}
            </Eyebrow>
          </div>
          <H1 className="text-[34px] leading-tight">{plant.name}</H1>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-eyebrow text-fg-3">
            ID · GL-{idShort} · PLANTED {formatDate(plant.createdAt)}
          </p>
        </div>

        {/* Placeholder when no photo */}
        {!plant.photoUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Leaf className="h-20 w-20 text-fg-4" aria-hidden="true" />
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-2xl space-y-5 px-5 py-5">
        {/* Stat row */}
        <div className="grid grid-cols-3 gap-3">
          <StatTile
            icon={<Calendar className="h-5 w-5" />}
            value={`Day ${totalAge}`}
            label="Age"
          />
          <StatTile
            icon={<Clock className="h-5 w-5" />}
            value={
              totalWeeks
                ? `Week ${weekOfStage}/${totalWeeks}`
                : `Week ${weekOfStage}`
            }
            label={stageConfig?.label ?? stage}
            tone={stageAccent.text}
          />
          <StatTile
            icon={<Leaf className="h-5 w-5" />}
            value={healthConfig?.label ?? plant.healthStatus}
            label="Health"
            tone={healthConfig?.color ?? 'text-fg-3'}
          />
        </div>

        {/* F2 — Light cycle pill (Expert-only, hidden when null). */}
        {plant.lightSchedule && stageMode === 'expert' && (
          <div>
            <LightCyclePill
              lightSchedule={plant.lightSchedule}
              stageMode={stageMode}
            />
          </div>
        )}

        {/* CareTag (derived from care logs) */}
        {careTag && (
          <div className="rounded-lg border border-line bg-card p-4">
            <Eyebrow tone="muted" className="mb-2 block">Care Status</Eyebrow>
            <p
              className={[
                'font-mono text-sm font-semibold uppercase tracking-eyebrow',
                CARE_TAG_TONE_CLASS[careTag.tone],
              ].join(' ')}
            >
              {careTag.label}
              {typeof careTag.hoursSinceWater === 'number' && (
                <span className="ml-2 font-normal text-fg-3">
                  · {Math.round(careTag.hoursSinceWater)}h since last water
                </span>
              )}
            </p>
          </div>
        )}

        {/* Advance Stage */}
        {nextStage && (
          <div className="rounded-lg border border-line bg-card p-4">
            <Eyebrow tone="accent" className="mb-2 block">Growth Stage</Eyebrow>
            <button
              onClick={handleAdvanceStage}
              disabled={updatePlant.isPending}
              className="flex w-full items-center justify-between rounded-md border border-accent/40 bg-accent-soft px-4 py-3 text-left transition-colors hover:bg-accent-soft/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-60"
            >
              <div>
                <p className="font-semibold text-accent">
                  {updatePlant.isPending
                    ? 'Advancing...'
                    : `Advance to ${GROWTH_STAGE_CONFIG[nextStage].label}`}
                </p>
                <p className="mt-0.5 text-sm text-fg-2">
                  {GROWTH_STAGE_CONFIG[nextStage].description}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-accent" />
            </button>
          </div>
        )}

        {/* Details */}
        <div className="rounded-lg border border-line bg-card p-4">
          <Eyebrow tone="muted" className="mb-3 block">Details</Eyebrow>
          <dl className="space-y-3">
            <DetailRow term="Strain" value={displayStrain} />
            <DetailRow term="Genetics" value={strainConfig?.label ?? plant.strainType} />
            <DetailRow term="Flowering" value={floweringConfig?.label ?? plant.floweringType} />
            <DetailRow term="Stage Start" value={formatDate(plant.stageStartDate)} />
            <DetailRow term="Days in Stage" value={`${daysInStage}d`} />
            <DetailRow term="Last Updated" value={formatDate(plant.updatedAt)} />
          </dl>
        </div>

        {/* Notes */}
        {plant.notes && (
          <div className="rounded-lg border border-line bg-card p-4">
            <Eyebrow tone="muted" className="mb-2 block">Notes</Eyebrow>
            <p className="whitespace-pre-wrap text-sm text-fg-2">{plant.notes}</p>
          </div>
        )}

        {/* Add Photo — immediate upload to this existing plant */}
        <section>
          <H2 className="mb-3 text-[18px]">Add Photo</H2>
          <UploadZone mode="immediate" plantId={plant.id} stage={stage} />
        </section>

        {/* Photo Timeline (F4) */}
        <PhotoTimeline plantId={plant.id} />

        {/* F5 — Environmental data (Expert only) */}
        {stageMode === 'expert' && (
          <section aria-labelledby="env-heading">
            <H2 id="env-heading" className="mb-3 text-[18px]">Environmentals</H2>
            <div className="grid grid-cols-2 gap-3">
              <HumidityWidget plantId={plant.id} />
              <TempWidget
                plantId={plant.id}
                unit={(user?.unitsPreference as { temp?: 'C' | 'F' } | undefined)?.temp ?? 'C'}
              />
            </div>
            <div className="mt-3">
              <GrowthBars plantId={plant.id} />
            </div>
          </section>
        )}

        {/* Care Logging */}
        <CareLogList plantId={plant.id} />
      </main>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-bg/80"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative w-full max-w-sm rounded-xl border border-line bg-card p-6 shadow-xl animate-gl-modal-in">
            <H3 className="mb-2">Delete Plant</H3>
            <p className="mb-6 text-sm text-fg-2">
              Are you sure you want to delete <strong className="text-fg">{plant.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="inline-flex flex-1 items-center justify-center rounded-md border border-line bg-card-2 px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deletePlant.isPending}
                className="inline-flex flex-1 items-center justify-center rounded-md bg-status-warn px-4 py-2.5 text-sm font-semibold text-fg transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-status-warn focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-60"
              >
                {deletePlant.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Plant Modal */}
      <EditPlantModal
        plant={plant}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
    </div>
  )
}

interface StatTileProps {
  icon: React.ReactNode
  value: string
  label: string
  tone?: string
}

function StatTile({ icon, value, label, tone = 'text-fg' }: StatTileProps) {
  return (
    <div className="rounded-lg border border-line bg-card p-3 text-center">
      <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center text-fg-3">
        {icon}
      </div>
      <p className={`font-display text-base font-bold ${tone}`}>{value}</p>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-eyebrow text-fg-3">
        {label}
      </p>
    </div>
  )
}

interface DetailRowProps {
  term: string
  value: string
}

function DetailRow({ term, value }: DetailRowProps) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-sm text-fg-3">{term}</dt>
      <dd className="text-sm font-medium text-fg text-right">{value}</dd>
    </div>
  )
}
