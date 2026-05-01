/**
 * GrowLab Auth API - Login Endpoint
 */

import { createAPIFileRoute } from '@tanstack/start/api'
import { loginSchema } from '@/server/api/auth/schemas'
import { login } from '@/server/api/auth/service'
import { setRefreshTokenCookie } from '@/server/lib/cookies'

/**
 * POST /api/auth/login
 * 
 * Authenticate user and return tokens.
 * 
 * Request body:
 *   - email: string (required)
 *   - password: string (required)
 * 
 * Response:
 *   - 200: { user, accessToken }
 *   - 401: { error: { code, message } }
 */
export const Route = createAPIFileRoute('/api/auth/login')({
  POST: async ({ request, context }) => {
    try {
      // Parse request body
      const body = await request.json()

      // Validate input
      const validation = loginSchema.safeParse(body)
      if (!validation.success) {
        const fieldErrors: Record<string, string> = {}
        for (const error of validation.error.errors) {
          const field = error.path.join('.')
          fieldErrors[field] = error.message
        }

        return Response.json(
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

      // Login user
      const result = await login(validation.data)

      if (!result.success) {
        return Response.json(
          { success: false, error: result.error },
          { status: 401 }
        )
      }

      // Set refresh token in HTTP-only cookie
      setRefreshTokenCookie(context.event, result.data.refreshToken)

      // Return user and access token
      return Response.json({
        success: true,
        data: {
          user: result.data.user,
          accessToken: result.data.accessToken,
        },
      })
    } catch (error) {
      console.error('Login error:', error)
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
