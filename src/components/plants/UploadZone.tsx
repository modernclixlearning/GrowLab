/**
 * GrowLab UploadZone Component (F4)
 *
 * Drag-and-drop photo uploader with an optional AI generation mode.
 * Used in AddPlantModal Step 1 (store file for deferred upload) and on
 * PlantDetail (immediate upload to an existing plantId).
 *
 * Props
 * ─────
 * mode: 'defer'    — no plantId yet; stores File in onFileSelected and
 *                    renders a local preview only (AddPlantModal flow).
 *       'immediate' — has a plantId; calls useUploadPhoto on drop/select.
 */

import { useRef, useState, useCallback, useEffect } from 'react'
import { Upload, Sparkles, ImageIcon, X } from 'lucide-react'
import { useUploadPhoto, useGenerateAiImage } from '@/lib/hooks/usePlantPhotos'
import type { GrowthStage } from '@/types/plants'

// ─── Props ────────────────────────────────────────────────────────────────────

interface DeferProps {
  mode:             'defer'
  onFileSelected:   (file: File | null) => void
  initialPreview?:  string | null
}

interface ImmediateProps {
  mode:    'immediate'
  plantId: string
  stage:   GrowthStage
}

type UploadZoneProps = DeferProps | ImmediateProps

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED = 'image/jpeg,image/png,image/webp,image/gif'
const MAX_MB    = 10

// ─── Component ────────────────────────────────────────────────────────────────

export function UploadZone(props: UploadZoneProps) {
  const inputRef     = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [preview,  setPreview]  = useState<string | null>(
    props.mode === 'defer' ? (props.initialPreview ?? null) : null,
  )
  const [aiMode,   setAiMode]   = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [error,    setError]    = useState<string | null>(null)

  // Revoke any outstanding object URL on unmount to avoid memory leaks.
  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
  }, [])

  // Mutation hooks (used only in immediate mode)
  const uploadPhoto    = useUploadPhoto()
  const generateAiImg  = useGenerateAiImage()

  const isLoading = uploadPhoto.isPending || generateAiImg.isPending

  // ── File validation ─────────────────────────────────────────────────────────

  const handleFile = useCallback(
    (file: File) => {
      setError(null)
      if (!file.type.startsWith('image/')) {
        setError('Only image files are accepted.')
        return
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        setError(`File must be under ${MAX_MB} MB.`)
        return
      }

      const objectUrl = URL.createObjectURL(file)
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = objectUrl
      setPreview(objectUrl)

      if (props.mode === 'defer') {
        props.onFileSelected(file)
      } else {
        uploadPhoto.mutate(
          { plantId: props.plantId, stage: props.stage, file },
          {
            onError: () => {
              setPreview(null)
            },
          },
        )
      }
    },
    [props, uploadPhoto],
  )

  // ── Drag handlers ───────────────────────────────────────────────────────────

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const onDragLeave = useCallback(() => setDragging(false), [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  // ── AI generate ─────────────────────────────────────────────────────────────

  const handleAiGenerate = () => {
    if (props.mode !== 'immediate') return
    setError(null)
    const vars =
      aiPrompt.trim()
        ? { plantId: props.plantId, stage: props.stage, prompt: aiPrompt.trim() }
        : { plantId: props.plantId, stage: props.stage, stagePreset: true as const }

    generateAiImg.mutate(vars, {
      onSuccess: (result) => {
        setPreview(result.photo.url)
        setAiMode(false)
      },
    })
  }

  // ── Clear ───────────────────────────────────────────────────────────────────

  const handleClear = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setPreview(null)
    setError(null)
    if (props.mode === 'defer') props.onFileSelected(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Drop target */}
      <div
        className={[
          'relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-5 py-8 text-center transition-colors',
          dragging
            ? 'border-accent bg-accent/10'
            : 'border-line-2 bg-bg-1 hover:border-line hover:bg-bg-2',
          isLoading && 'pointer-events-none opacity-60',
        ].join(' ')}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isLoading && !aiMode && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload photo"
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !isLoading && !aiMode) inputRef.current?.click()
        }}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Plant photo preview"
              className="max-h-44 w-full rounded-md object-cover"
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleClear() }}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-bg/80 text-fg-2 hover:bg-bg hover:text-fg"
              aria-label="Remove photo"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : isLoading ? (
          <>
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-line border-t-accent" />
            <p className="text-sm text-fg-3">
              {uploadPhoto.isPending ? 'Uploading…' : 'Generating AI image…'}
            </p>
          </>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
              <ImageIcon className="h-7 w-7" />
            </div>
            <div>
              <p className="font-display text-base font-bold text-fg">
                Drop photo here
              </p>
              <p className="mt-1 text-sm text-fg-3">or click to browse · max {MAX_MB} MB</p>
            </div>
            {dragging && (
              <Upload className="absolute h-8 w-8 text-accent animate-bounce" />
            )}
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      {/* Validation error */}
      {error && <p className="text-xs text-status-warn">{error}</p>}

      {/* AI mode — only available in immediate mode */}
      {props.mode === 'immediate' && (
        <>
          <button
            type="button"
            onClick={() => setAiMode((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline focus:outline-none"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {aiMode ? 'Cancel AI generation' : 'Generate with AI instead'}
          </button>

          {aiMode && (
            <div className="space-y-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe the image (leave blank for stage preset)"
                maxLength={500}
                className="w-full rounded-md border border-line bg-bg-1 px-4 h-11 text-[14px] text-fg placeholder:text-fg-4 outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
              />
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 h-10 text-sm font-bold text-bg shadow-accent-glow transition-transform hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" />
                {isLoading ? 'Generating…' : 'Generate'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
