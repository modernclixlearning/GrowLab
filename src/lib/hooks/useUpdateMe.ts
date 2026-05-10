/**
 * GrowLab useUpdateMe (F2)
 *
 * React Query mutation for `PATCH /api/auth/me`. On success, calls the
 * auth store's `setUser` (we add it on F2) so the UI reflects the new
 * stageMode / prefs without forcing a refetch round-trip. The hook
 * itself does NOT call toast — callers own user-facing feedback so the
 * message can be specific to the action (e.g., "Stage mode updated").
 */

import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/lib/stores/auth'
import * as authApi from '@/lib/api/auth'
import { ApiResponseError } from '@/lib/api/errors'
import type { UpdateMeRequest, User } from '@/types/auth'

export function useUpdateMe() {
  const { accessToken, setUser } = useAuth()

  return useMutation({
    mutationFn: async (data: UpdateMeRequest): Promise<User> => {
      if (!accessToken) throw new Error('Not authenticated')
      const result = await authApi.updateMe(accessToken, data)
      if (!result.success) throw new ApiResponseError(result.error)
      return result.data.user
    },
    onSuccess: (user) => {
      setUser(user)
    },
  })
}
