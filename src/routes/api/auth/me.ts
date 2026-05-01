/**
 * GrowLab Auth API - Me Endpoint
 */

import { createAPIFileRoute } from '@tanstack/start/api'
import { getCurrentUser } from '@/server/api/auth/service'
import { verifyAccessToken } from '@/server/lib/jwt'

/**
 * GET /api/auth/me
 * 
 * Get current authenticated user.
 * 
 * Request:
 *   - Headers: { Authorization: 'Bearer <accessToken>' }
 * 
 * Response:
 *   - 200: { user }
 *   - 401: { error: { code, message } }
 */
export const Route = createAPIFileRoute('/api/auth/me')({
  GET: async ({ request }) => {
    try {
      // Get authorization header
      const authHeader = request.headers.get('Authorization')

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return Response.json(
          {
            success: false,
            error: {
              code: 'MISSING_TOKEN',
              message: 'Authorization token required',
            },
          },
          { status: 401 }
        )
      }

      // Extract token
      const token = authHeader.slice(7)

      // Verify access token
      const payload = await verifyAccessToken(token)

      if (!payload) {
        return Response.json(
          {
            success: false,
            error: {
              code: 'INVALID_TOKEN',
              message: 'Invalid or expired access token',
            },
          },
          { status: 401 }
        )
      }

      // Get user data
      const result = await getCurrentUser(payload.userId)

      if (!result.success) {
        return Response.json(
          { success: false, error: result.error },
          { status: 404 }
        )
      }

      return Response.json({
        success: true,
        data: {
          user: result.data.user,
        },
      })
    } catch (error) {
      console.error('Get me error:', error)
      return Response.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
          },
        },
        { status: 500 }
      )
    }
  },
})
