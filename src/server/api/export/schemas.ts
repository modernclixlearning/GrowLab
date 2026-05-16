import { z } from 'zod'

const isoDate = z.string().datetime({ message: 'Must be a valid ISO 8601 date' })

export const exportQuerySchema = z.object({
  sensorFrom: isoDate.optional(),
  sensorTo: isoDate.optional(),
  deviceId: z.string().optional(),
})

export type ExportQuery = z.infer<typeof exportQuerySchema>
