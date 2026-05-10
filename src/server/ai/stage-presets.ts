/**
 * GrowLab AI Stage Presets (F4)
 *
 * Maps each GrowthStage to a deterministic image generation prompt.
 * Used when the caller sets `stagePreset: true` instead of supplying
 * a custom prompt. Kept separate so the map can be updated without
 * touching the service layer.
 */

export const STAGE_PRESETS: Record<string, string> = {
  seedling:
    'Close-up photograph of a cannabis seedling with two cotyledon leaves, bright green, soft studio lighting, white background',
  vegetative:
    'Cannabis plant in vegetative stage, lush green fan leaves, healthy vigorous growth, top-down view, bright grow lights',
  flowering:
    'Macro photograph of cannabis flower in late flowering stage, dense trichomes, orange pistils, studio lighting',
  harvesting:
    'Cannabis plant at harvest time, amber pistils, cloudy trichomes, ready for cutting, dramatic lighting',
  drying:
    'Freshly harvested cannabis branches hanging upside-down to dry in a dark room, dimly lit',
  curing:
    'Glass mason jars filled with cured cannabis buds, green and purple hues, studio still-life',
  completed:
    'Final trimmed cannabis buds arranged in a tray, macro detail of trichomes and colours',
}
