/**
 * GrowLab Auth API Routes
 * 
 * REST API endpoints for authentication.
 * Follows RESTful conventions with /api/auth/* format.
 */

import { createAPIFileRoute } from '@tanstack/start/api'
import { json } from '@tanstack/start'
import { registerSchema } from '@/server/api/auth/schemas'
import { register } from '@/server/api/auth/service'
import { setRefreshTokenCookie } from '@/server/lib/cookies'

/**
 * POST /api/auth/register
 * 
 * Register a new user account.
 * 
 * Request body:
 *   - email: string (required)
 *   - password: string (required, min 8 chars)
 *   - name?: string (optional)
 * 
 * Response:
 *   - 201: { user, accessToken }
 *   - 400: { error: { code, message, fields? } }
 */
export const Route = createAPIFileRoute('/api/auth/register')({
  POST: async ({ request, context }) => {
    try {
      // Parse request body
      const body = await request.json()

      // Validate input
      const validation = registerSchema.safeParse(body)
      if (!validation.success) {
        const fieldErrors: Record<string, string> = {}
        for (const error of validation.error.errors) {
          const field = error.path.join('.')
          fieldErrors[field] = error.message
        }

        return json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid input data',
              fields: fieldErrors,
            },
          },
          { status: 400 }
        )
      }

      // Register user
      const result = await register(validation.data)

      if (!result.success) {
        return json(
          { success: false, error: result.error },
          { status: 400 }
        )
      }

      // Set refresh token in HTTP-only cookie
      setRefreshTokenCookie(context.event, result.data.refreshToken)

      // Return user and access token (not refresh token in body)
      return json(
        {
          success: true,
          data: {
            user: result.data.user,
            accessToken: result.data.accessToken,
          },
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('Register error:', error)
      return json(
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
