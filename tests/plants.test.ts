/**
 * GrowLab Plants Service Tests
 * 
 * Unit tests for plant validation schemas and business logic.
 */

import { describe, it, expect } from 'vitest'
import {
  createPlantSchema,
  updatePlantSchema,
  listPlantsQuerySchema,
} from '@/server/api/plants/schemas'

describe('Plant Validation Schemas', () => {
  describe('createPlantSchema', () => {
    it('should validate a valid plant creation', () => {
      const input = {
        name: 'OG Kush #1',
        strainType: 'indica',
        growthStage: 'seedling',
      }

      const result = createPlantSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should validate with all optional fields', () => {
      const input = {
        name: 'Blue Dream',
        strainType: 'hybrid',
        growthStage: 'vegetative',
        stageStartDate: '2026-01-15T00:00:00.000Z',
        photoUrl: 'https://example.com/photo.jpg',
        notes: 'Looking great!',
      }

      const result = createPlantSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should default growthStage to seedling', () => {
      const input = {
        name: 'White Widow',
        strainType: 'sativa',
      }

      const result = createPlantSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.growthStage).toBe('seedling')
      }
    })

    it('should reject missing name', () => {
      const input = {
        strainType: 'indica',
      }

      const result = createPlantSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject empty name', () => {
      const input = {
        name: '',
        strainType: 'indica',
      }

      const result = createPlantSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject name over 100 chars', () => {
      const input = {
        name: 'A'.repeat(101),
        strainType: 'indica',
      }

      const result = createPlantSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject missing strainType', () => {
      const input = {
        name: 'Test Plant',
      }

      const result = createPlantSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject invalid strainType', () => {
      const input = {
        name: 'Test Plant',
        strainType: 'ruderalis',
      }

      const result = createPlantSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject invalid growthStage', () => {
      const input = {
        name: 'Test Plant',
        strainType: 'indica',
        growthStage: 'sprouting',
      }

      const result = createPlantSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should accept all valid strain types', () => {
      for (const strainType of ['indica', 'sativa', 'hybrid', 'auto']) {
        const result = createPlantSchema.safeParse({
          name: 'Test',
          strainType,
        })
        expect(result.success).toBe(true)
      }
    })

    it('should accept all valid growth stages', () => {
      const stages = ['seedling', 'vegetative', 'flowering', 'harvesting', 'drying', 'curing', 'completed']
      for (const growthStage of stages) {
        const result = createPlantSchema.safeParse({
          name: 'Test',
          strainType: 'indica',
          growthStage,
        })
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid stageStartDate format', () => {
      const input = {
        name: 'Test',
        strainType: 'indica',
        stageStartDate: 'not-a-date',
      }

      const result = createPlantSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject notes over 1000 chars', () => {
      const input = {
        name: 'Test',
        strainType: 'indica',
        notes: 'X'.repeat(1001),
      }

      const result = createPlantSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  describe('updatePlantSchema', () => {
    it('should validate with just name update', () => {
      const result = updatePlantSchema.safeParse({ name: 'New Name' })
      expect(result.success).toBe(true)
    })

    it('should validate with just growthStage update', () => {
      const result = updatePlantSchema.safeParse({ growthStage: 'flowering' })
      expect(result.success).toBe(true)
    })

    it('should validate with healthStatus update', () => {
      const result = updatePlantSchema.safeParse({ healthStatus: 'stressed' })
      expect(result.success).toBe(true)
    })

    it('should accept all valid health statuses', () => {
      for (const healthStatus of ['healthy', 'stressed', 'sick', 'recovering', 'dead']) {
        const result = updatePlantSchema.safeParse({ healthStatus })
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid healthStatus', () => {
      const result = updatePlantSchema.safeParse({ healthStatus: 'great' })
      expect(result.success).toBe(false)
    })

    it('should allow nullable photoUrl', () => {
      const result = updatePlantSchema.safeParse({ photoUrl: null })
      expect(result.success).toBe(true)
    })

    it('should allow nullable notes', () => {
      const result = updatePlantSchema.safeParse({ notes: null })
      expect(result.success).toBe(true)
    })

    it('should validate empty object (no updates)', () => {
      const result = updatePlantSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  describe('listPlantsQuerySchema', () => {
    it('should validate with no params (defaults)', () => {
      const result = listPlantsQuerySchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sortBy).toBe('createdAt')
        expect(result.data.sortOrder).toBe('desc')
        expect(result.data.limit).toBe(50)
        expect(result.data.offset).toBe(0)
      }
    })

    it('should validate with stage filter', () => {
      const result = listPlantsQuerySchema.safeParse({ stage: 'flowering' })
      expect(result.success).toBe(true)
    })

    it('should validate with search param', () => {
      const result = listPlantsQuerySchema.safeParse({ search: 'Kush' })
      expect(result.success).toBe(true)
    })

    it('should validate with sort options', () => {
      const result = listPlantsQuerySchema.safeParse({
        sortBy: 'name',
        sortOrder: 'asc',
      })
      expect(result.success).toBe(true)
    })

    it('should coerce string limit to number', () => {
      const result = listPlantsQuerySchema.safeParse({ limit: '25' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(25)
      }
    })

    it('should reject limit over 100', () => {
      const result = listPlantsQuerySchema.safeParse({ limit: 101 })
      expect(result.success).toBe(false)
    })

    it('should reject negative offset', () => {
      const result = listPlantsQuerySchema.safeParse({ offset: -1 })
      expect(result.success).toBe(false)
    })
  })
})

describe('Growth Stage Transitions', () => {
  // Import the constants to test valid transitions
  it('should define sequential growth stages', async () => {
    const { GROWTH_STAGES } = await import('@/server/db/schema/plants')
    
    expect(GROWTH_STAGES).toEqual([
      'seedling',
      'vegetative',
      'flowering',
      'harvesting',
      'drying',
      'curing',
      'completed',
    ])
  })

  it('should define valid health statuses', async () => {
    const { HEALTH_STATUSES } = await import('@/server/db/schema/plants')
    
    expect(HEALTH_STATUSES).toEqual([
      'healthy',
      'stressed',
      'sick',
      'recovering',
      'dead',
    ])
  })

  it('should define valid strain types', async () => {
    const { STRAIN_TYPES } = await import('@/server/db/schema/plants')
    
    expect(STRAIN_TYPES).toEqual([
      'indica',
      'sativa',
      'hybrid',
      'auto',
    ])
  })
})
