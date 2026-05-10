/**
 * GrowLab Strain Templates API Client (F2, read-only)
 */

import type { ApiResponse } from '@/types/auth'
import type { StrainTemplatesListResponse } from '@/types/strain-templates'

const API_BASE = '/api/strain-templates'

export async function listStrainTemplates(
  accessToken: string,
): Promise<ApiResponse<StrainTemplatesListResponse>> {
  const response = await fetch(API_BASE, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'include',
  })
  return response.json()
}
