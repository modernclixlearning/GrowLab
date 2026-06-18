/**
 * GrowLab AI Image Schemas (F4)
 *
 * Exactly one of `stagePreset` (boolean true) or `prompt` (custom string)
 * must be present per request.
 */

import { z } from 'zod'
import { GROWTH_STAGES } from '@/server/db/schema'
import { STYLE_KEYS } from '@/server/ai/stage-presets'

export const generateImageSchema = z
  .object({
    plantId:     z.string().min(1),
    stage:       z.enum(GROWTH_STAGES),
    /** Use the built-in stage preset prompt. */
    stagePreset: z.boolean().optional(),
    /** Custom freeform prompt (max 500 chars). */
    prompt:      z.string().min(1).max(500).optional(),
    /**
     * Visual style template — orthogonal to the preset/prompt XOR (REG-4).
     * Optional; omitted ⇒ 'photorealistic' is applied at compose time (REG-1).
     */
    style:       z.enum(STYLE_KEYS).optional(),
  })
  .superRefine((v, ctx) => {
    const hasPreset = v.stagePreset === true
    const hasPrompt = typeof v.prompt === 'string'
    if (!hasPreset && !hasPrompt) {
      ctx.addIssue({
        code: 'custom',
        path: ['prompt'],
        message: 'Provide either stagePreset: true or a custom prompt',
      })
    }
    if (hasPreset && hasPrompt) {
      ctx.addIssue({
        code: 'custom',
        path: ['prompt'],
        message: 'stagePreset and prompt are mutually exclusive',
      })
    }
  })

export type GenerateImageInput = z.infer<typeof generateImageSchema>
