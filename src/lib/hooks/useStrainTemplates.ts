/**
 * GrowLab Strain Templates Hook (F2, read-only)
 */

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/stores/auth'
import * as strainTemplatesApi from '@/lib/api/strain-templates'
import { ApiResponseError } from '@/lib/api/errors'

export const strainTemplateKeys = {
  all: ['strain-templates'] as const,
  list: () => [...strainTemplateKeys.all, 'list'] as const,
}

export function useStrainTemplates() {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: strainTemplateKeys.list(),
    queryFn: async () => {
      if (!accessToken) throw new Error('Not authenticated')
      const result = await strainTemplatesApi.listStrainTemplates(accessToken)
      if (!result.success) throw new ApiResponseError(result.error)
      return result.data
    },
    enabled: !!accessToken,
    // Catalogue rarely changes; let it cache for the whole session.
    staleTime: 1000 * 60 * 60,
  })
}
