/**
 * GrowLab PhotoTimeline Component (F4)
 *
 * Displays a plant's photo history grouped by growth stage.
 * Each stage section shows a horizontally-scrollable strip of thumbnails.
 * Clicking a thumbnail opens a full-screen lightbox dialog.
 * AI-generated photos carry a "✦ AI" badge.
 */

import { useState } from 'react'
import { Sparkles, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { usePlantPhotos } from '@/lib/hooks/usePlantPhotos'
import { Eyebrow } from '@/components/shell'
import type { PlantPhoto } from '@/types/plant-photos'
import type { GrowthStage } from '@/types/plants'
import { GROWTH_STAGE_CONFIG } from '@/types/plants'

// ─── Stage order for display ──────────────────────────────────────────────────

const STAGE_ORDER: GrowthStage[] = [
  'seedling', 'vegetative', 'flowering', 'harvesting', 'drying', 'curing', 'completed',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByStage(photos: PlantPhoto[]): Map<GrowthStage, PlantPhoto[]> {
  const map = new Map<GrowthStage, PlantPhoto[]>()
  for (const photo of photos) {
    const stage = photo.stage as GrowthStage
    if (!map.has(stage)) map.set(stage, [])
    map.get(stage)!.push(photo)
  }
  return map
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

interface LightboxProps {
  photos:  PlantPhoto[]
  current: number
  onClose: () => void
  onNav:   (idx: number) => void
}

function Lightbox({ photos, current, onClose, onNav }: LightboxProps) {
  const photo = photos[current]
  if (!photo) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/90 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo lightbox"
    >
      <div
        className="relative mx-4 w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-3 -top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card text-fg-2 hover:text-fg"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Image */}
        <img
          src={photo.url}
          alt={`Plant photo — ${photo.stage}`}
          className="max-h-[70vh] w-full rounded-xl object-contain"
        />

        {/* Meta bar */}
        <div className="mt-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            {photo.sourceType === 'ai' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                <Sparkles className="h-3 w-3" />
                AI
              </span>
            )}
            <span className="text-xs text-fg-3">{formatDate(photo.createdAt)}</span>
          </div>
          <span className="text-xs text-fg-3">{current + 1} / {photos.length}</span>
        </div>

        {/* Navigation */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => onNav(current - 1 < 0 ? photos.length - 1 : current - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card/80 text-fg backdrop-blur hover:bg-card"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => onNav(current + 1 >= photos.length ? 0 : current + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card/80 text-fg backdrop-blur hover:bg-card"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Thumbnail ────────────────────────────────────────────────────────────────

interface ThumbnailProps {
  photo:   PlantPhoto
  onClick: () => void
}

function Thumbnail({ photo, onClick }: ThumbnailProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-line bg-bg-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      aria-label={`View photo from ${photo.stage} stage`}
    >
      <img
        src={photo.url}
        alt={`${photo.stage} photo`}
        className="h-full w-full object-cover transition-transform hover:scale-105"
        loading="lazy"
      />
      {photo.sourceType === 'ai' && (
        <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent/90">
          <Sparkles className="h-3 w-3 text-bg" aria-label="AI generated" />
        </span>
      )}
    </button>
  )
}

// ─── PhotoTimeline ────────────────────────────────────────────────────────────

interface PhotoTimelineProps {
  plantId: string
}

export function PhotoTimeline({ plantId }: PhotoTimelineProps) {
  const { data, isLoading } = usePlantPhotos(plantId)
  const [lightboxPhotos, setLightboxPhotos] = useState<PlantPhoto[] | null>(null)
  const [lightboxIdx,    setLightboxIdx]    = useState(0)

  const openLightbox = (photos: PlantPhoto[], idx: number) => {
    setLightboxPhotos(photos)
    setLightboxIdx(idx)
  }

  const closeLightbox = () => setLightboxPhotos(null)

  if (isLoading) {
    return (
      <div className="rounded-lg border border-line bg-card p-4 animate-pulse">
        <div className="h-4 w-32 rounded bg-bg-2 mb-4" />
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 w-24 rounded-lg bg-bg-2" />
          ))}
        </div>
      </div>
    )
  }

  const photos  = data?.photos ?? []
  const grouped = groupByStage(photos)

  if (photos.length === 0) {
    return null // Hide section when no photos yet
  }

  return (
    <>
      <div className="rounded-lg border border-line bg-card p-4">
        <Eyebrow tone="muted" className="mb-4 block">Photo Timeline</Eyebrow>

        <div className="space-y-5">
          {STAGE_ORDER.filter((stage) => grouped.has(stage)).map((stage) => {
            const stagePhotos = grouped.get(stage)!
            const stageLabel  = GROWTH_STAGE_CONFIG[stage]?.label ?? stage

            return (
              <div key={stage}>
                <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-eyebrow text-fg-3">
                  {stageLabel} · {stagePhotos.length}
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {stagePhotos.map((photo, idx) => (
                    <Thumbnail
                      key={photo.id}
                      photo={photo}
                      onClick={() => openLightbox(stagePhotos, idx)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {lightboxPhotos && (
        <Lightbox
          photos={lightboxPhotos}
          current={lightboxIdx}
          onClose={closeLightbox}
          onNav={setLightboxIdx}
        />
      )}
    </>
  )
}
