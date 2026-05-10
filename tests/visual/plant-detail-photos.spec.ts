/**
 * Visual regression — Plant Detail + PhotoTimeline (F4).
 *
 * Golden: vegetative plant (Blue Dream) with 3 photos across 2 stages
 * so the PhotoTimeline section renders with thumbnails and a stage label.
 */

import { expect, test } from '@playwright/test'
import {
  gardenSeedPlants,
  mockGrowlabApi,
  plantDetailCareLogs,
  waitForFonts,
} from './fixtures'
import type { MockPlantPhoto } from './fixtures'

const PLANT_ID = 'plant-blue-dream'

function plantPhotos(): MockPlantPhoto[] {
  return [
    {
      id:         'photo-1',
      plantId:    PLANT_ID,
      stage:      'seedling',
      url:        'https://placehold.co/400x400/1a1a2e/4ade80?text=Seedling+1',
      sourceType: 'upload',
      aiPrompt:   null,
      aiProvider: null,
      width:      400,
      height:     400,
      createdAt:  '2026-04-01T10:00:00.000Z',
    },
    {
      id:         'photo-2',
      plantId:    PLANT_ID,
      stage:      'seedling',
      url:        'https://placehold.co/400x400/1a1a2e/4ade80?text=Seedling+2',
      sourceType: 'upload',
      aiPrompt:   null,
      aiProvider: null,
      width:      400,
      height:     400,
      createdAt:  '2026-04-05T10:00:00.000Z',
    },
    {
      id:         'photo-3',
      plantId:    PLANT_ID,
      stage:      'vegetative',
      url:        'https://placehold.co/400x400/1a1a2e/22d3ee?text=Veg+AI',
      sourceType: 'ai',
      aiPrompt:   'Cannabis plant in vegetative stage',
      aiProvider: 'openai',
      width:      1024,
      height:     1024,
      createdAt:  '2026-04-20T10:00:00.000Z',
    },
  ]
}

test.describe('Plant Detail + PhotoTimeline (F4)', () => {
  test('matches golden — Blue Dream with 3 photos in timeline', async ({ page }) => {
    const plants = gardenSeedPlants()
    const target = plants.find((p) => p.id === PLANT_ID)!

    await mockGrowlabApi(page, {
      plants,
      careLogsByPlant: {
        [PLANT_ID]: plantDetailCareLogs(PLANT_ID),
      },
      plantPhotos: {
        [PLANT_ID]: plantPhotos(),
      },
    })

    await page.goto(`/plants/${PLANT_ID}`)
    await waitForFonts(page)

    await expect(page.getByRole('heading', { name: target.name })).toBeVisible()
    await expect(page.getByText(/photo timeline/i)).toBeVisible()

    await expect(page).toHaveScreenshot('plant-detail-photos.png', { fullPage: true })
  })
})
