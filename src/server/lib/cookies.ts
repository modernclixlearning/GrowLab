/**
 * GrowLab Cookie Utilities
 *
 * HTTP-only cookie management for refresh tokens using Hono.
 */

import type { Context } from 'hono'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'

/** Cookie name for refresh token */
const REFRESH_TOKEN_COOKIE = 'growlab_refresh_token'

/** Cookie options for secure HTTP-only cookies */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
}

export function setRefreshTokenCookie(c: Context, token: string): void {
  setCookie(c, REFRESH_TOKEN_COOKIE, token, COOKIE_OPTIONS)
}

export function getRefreshTokenCookie(c: Context): string | undefined {
  return getCookie(c, REFRESH_TOKEN_COOKIE)
}

export function clearRefreshTokenCookie(c: Context): void {
  deleteCookie(c, REFRESH_TOKEN_COOKIE, { path: '/' })
}
