/**
 * GrowLab Auth Middleware
 * 
 * Server-side authentication middleware for protected API routes.
 * Extracts and verifies JWT access token from Authorization header.
 */

import { verifyAccessToken } from './jwt'

/**
 * Authenticated user info extracted from JWT
 */
export interface AuthUser {
  userId: string
  email: string
  subscriptionTier: string
}

/**
 * Result of authentication check
 */
export type AuthResult =
  | { authenticated: true; user: AuthUser }
  | { authenticated: false; response: Response }

/**
 * Authenticate a request by verifying the JWT access token.
 * 
 * Usage in API route handlers:
 * ```ts
 * const auth = await authenticate(request)
 * if (!auth.authenticated) return auth.response
 * const { userId } = auth.user
 * ```
 * 
 * @param request - The incoming HTTP request
 * @returns AuthResult with user data or error response
 */
export async function authenticate(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      response: Response.json(
        {
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: 'Authorization token required',
          },
        },
        { status: 401 }
      ),
    }
  }

  const token = authHeader.slice(7)
  const payload = await verifyAccessToken(token)

  if (!payload) {
    return {
      authenticated: false,
      response: Response.json(
        {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired access token',
          },
        },
        { status: 401 }
      ),
    }
  }

  return {
    authenticated: true,
    user: {
      userId: payload.userId,
      email: payload.email,
      subscriptionTier: payload.subscriptionTier,
    },
  }
}
