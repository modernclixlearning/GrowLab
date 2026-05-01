import { Hono } from 'hono'
import { loginSchema, registerSchema } from '../api/auth/schemas'
import { login, register, logout, refresh, getCurrentUser } from '../api/auth/service'
import { setRefreshTokenCookie, getRefreshTokenCookie, clearRefreshTokenCookie } from '../lib/cookies'
import { verifyAccessToken } from '../lib/jwt'

export const authRoutes = new Hono()

/** POST /api/auth/login */
authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      for (const error of validation.error.errors) {
        fieldErrors[error.path.join('.')] = error.message
      }
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', fields: fieldErrors } }, 400)
    }

    const result = await login(validation.data)
    if (!result.success) return c.json({ success: false, error: result.error }, 401)

    setRefreshTokenCookie(c, result.data.refreshToken)
    return c.json({ success: true, data: { user: result.data.user, accessToken: result.data.accessToken } })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
  }
})

/** POST /api/auth/register */
authRoutes.post('/register', async (c) => {
  try {
    const body = await c.req.json()
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      for (const error of validation.error.errors) {
        fieldErrors[error.path.join('.')] = error.message
      }
      return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', fields: fieldErrors } }, 400)
    }

    const result = await register(validation.data)
    if (!result.success) return c.json({ success: false, error: result.error }, 400)

    setRefreshTokenCookie(c, result.data.refreshToken)
    return c.json({ success: true, data: { user: result.data.user, accessToken: result.data.accessToken } }, 201)
  } catch (error) {
    console.error('Register error:', error)
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
  }
})

/** POST /api/auth/logout */
authRoutes.post('/logout', async (c) => {
  try {
    const refreshToken = getRefreshTokenCookie(c)
    if (refreshToken) await logout(refreshToken)
    clearRefreshTokenCookie(c)
    return c.json({ success: true, data: { message: 'Logged out successfully' } })
  } catch (error) {
    console.error('Logout error:', error)
    clearRefreshTokenCookie(c)
    return c.json({ success: true, data: { message: 'Logged out successfully' } })
  }
})

/** POST /api/auth/refresh */
authRoutes.post('/refresh', async (c) => {
  try {
    const refreshToken = getRefreshTokenCookie(c)
    if (!refreshToken) return c.json({ success: false, error: { code: 'MISSING_TOKEN', message: 'Refresh token not found' } }, 401)

    const result = await refresh(refreshToken)
    if (!result.success) return c.json({ success: false, error: result.error }, 401)

    return c.json({ success: true, data: { accessToken: result.data.accessToken } })
  } catch (error) {
    console.error('Refresh error:', error)
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
  }
})

/** GET /api/auth/me */
authRoutes.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ success: false, error: { code: 'MISSING_TOKEN', message: 'Authorization token required' } }, 401)
    }

    const token = authHeader.slice(7)
    const payload = await verifyAccessToken(token)
    if (!payload) return c.json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired access token' } }, 401)

    const result = await getCurrentUser(payload.userId)
    if (!result.success) return c.json({ success: false, error: result.error }, 404)

    return c.json({ success: true, data: { user: result.data.user } })
  } catch (error) {
    console.error('Me error:', error)
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500)
  }
})
