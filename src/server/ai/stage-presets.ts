/**
 * GrowLab AI Stage Presets + Style Templates (F4 / #26)
 *
 * Two orthogonal dimensions feed the final DALL-E 3 prompt:
 *
 *   1. STAGE_PRESETS — describe ONLY the subject and composition of the
 *      plant at a given growth stage. They are deliberately *medium-neutral*
 *      (no "photograph", "studio lighting", "macro", …). The visual medium
 *      is supplied separately by the style modifier.
 *
 *   2. STYLE_MODIFIERS — describe ONLY the medium / visual register
 *      (photorealistic, illustration, psychedelic, minimal). A free-form
 *      user prompt is also combined with the chosen style modifier.
 *
 * `buildPrompt` is the single, pure composition point (no I/O) so the
 * REG-1 default and the stage/style combination logic can be unit-tested
 * in isolation. See master-plan-issue-26 §2.1, §2.2, §2.6.
 */

// ─── Style templates (the visual medium) ──────────────────────────────────────

export const STYLE_KEYS = [
  'photorealistic',
  'illustration',
  'psychedelic',
  'minimal',
] as const

export type StyleKey = (typeof STYLE_KEYS)[number]

/**
 * Each modifier describes the MEDIUM/register only — never the subject.
 * Materialized as prompt text because DALL-E 3 has no native style params
 * (single OpenAI adapter — see analysis C-D5/S-3).
 */
export const STYLE_MODIFIERS: Record<StyleKey, string> = {
  photorealistic:
    'photorealistic macro photography, natural soft lighting, shallow depth of field, sharp focus, high detail',
  illustration:
    'detailed botanical illustration, watercolour and fine ink linework, soft natural tones',
  psychedelic:
    'psychedelic digital art, vibrant saturated colours, surreal swirling patterns, trippy dreamlike aesthetic',
  minimal:
    'minimalist line art, clean single-weight outlines, flat shapes, generous negative space, limited palette',
}

// ─── Stage presets (the subject / composition, medium-neutral) ────────────────

/**
 * Subject + composition only. NO medium terms — the medium comes from
 * STYLE_MODIFIERS via buildPrompt. Used when the caller sets
 * `stagePreset: true` instead of a custom prompt.
 */
export const STAGE_PRESETS: Record<string, string> = {
  seedling:
    'A cannabis seedling with two cotyledon leaves and the first pair of serrated true leaves, bright green, centered composition, plain background',
  vegetative:
    'A cannabis plant in the vegetative stage with lush green fan leaves and vigorous bushy growth, seen from above',
  flowering:
    'A cannabis plant in late flowering with dense resinous buds, orange pistils and frosted trichomes, close-up composition',
  harvesting:
    'A mature cannabis plant at harvest time with swollen buds, amber pistils and cloudy trichomes, ready for cutting',
  drying:
    'Freshly harvested cannabis branches hanging upside-down to dry, arranged in a row in a dark drying room',
  curing:
    'Glass mason jars filled with cured cannabis buds in green and purple hues, still-life arrangement',
  completed:
    'Final trimmed cannabis buds arranged in a tray, detailed close-up of the trichomes and colours',
}

// ─── Prompt composition (single pure point) ───────────────────────────────────

export interface BuildPromptArgs {
  /** Growth stage — only used to resolve the preset when stagePreset is true. */
  stage?: string
  /** Use the built-in stage preset as the prompt subject. */
  stagePreset?: boolean
  /** Custom free-form prompt subject (mutually exclusive with stagePreset). */
  prompt?: string
  /** Visual style. Omitted ⇒ 'photorealistic' (REG-1, retro-compat). */
  style?: StyleKey
}

/**
 * Compose the final image prompt = (stage preset | free prompt) + style modifier.
 *
 * REG-1: when `style` is omitted the medium defaults to 'photorealistic',
 * preserving the (functional) photographic output of the legacy presets.
 *
 * The style modifier is appended here, AFTER the schema has validated the
 * free-form prompt length (REG-5), so it never consumes the user's 500-char
 * budget. Pure — no db/fetch/R2 — so it is unit-testable in isolation.
 */
export function buildPrompt(args: BuildPromptArgs): string {
  const base = args.stagePreset
    ? (STAGE_PRESETS[args.stage ?? ''] ?? `Cannabis plant in ${args.stage ?? 'unknown'} stage`)
    : (args.prompt ?? '')

  const style = args.style ?? 'photorealistic'
  const modifier = STYLE_MODIFIERS[style]

  const subject = base.trim()
  return subject ? `${subject}, ${modifier}` : modifier
}
