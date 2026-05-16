/**
 * GrowLab — Add Plant full flow (F6e Playwright E2E)
 *
 * Tests the complete 3-step "Add Plant" flow: Photo → Strain & Name →
 * Growth Stage → submit. Uses the mock API fixtures to avoid requiring
 * a live backend.
 *
 * NOTE: this spec requires the Vite dev server to be running
 * (`pnpm dev:web`). The backend API is mocked via `mockGrowlabApi`.
 */

import { expect, test } from '@playwright/test'
import { gardenSeedPlants, mockGrowlabApi, waitForFonts } from './fixtures'

test.describe('Add Plant — 3-step modal flow', () => {
  test('completes steps 1→2→3 and submits a new plant', async ({ page }) => {
    await mockGrowlabApi(page, { plants: gardenSeedPlants() })
    await page.goto('/garden')
    await waitForFonts(page)

    // ── Open the modal ───────────────────────────────────────────────────
    await page.getByRole('button', { name: 'Add plant', exact: true }).click()
    await expect(page.getByText('Plant Photo')).toBeVisible()
    await expect(page.getByText('Step 1 of 3')).toBeVisible()

    // ── Step 1: Photo (optional) — skip straight to Step 2 ───────────────
    await page.getByRole('button', { name: /continue/i }).click()
    await expect(page.getByText('Strain & Name')).toBeVisible()
    await expect(page.getByText('Step 2 of 3')).toBeVisible()

    // ── Step 2: fill name + select strain type ────────────────────────────
    await page.getByLabel(/plant name/i).fill('E2E Test Plant')
    await page.getByRole('button', { name: 'Indica', exact: true }).click()
    await page.getByRole('button', { name: /continue/i }).click()
    await expect(page.getByText('Growth Stage')).toBeVisible()
    await expect(page.getByText('Step 3 of 3')).toBeVisible()

    // ── Step 3: select a stage ────────────────────────────────────────────
    await page.getByRole('button', { name: /seedling/i }).first().click()

    // Take a screenshot before submitting
    await expect(page).toHaveScreenshot('add-plant-step3.png')

    // ── Submit ────────────────────────────────────────────────────────────
    await page.getByRole('button', { name: /add to garden/i }).click()
  })
})
