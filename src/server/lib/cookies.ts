/**
 * GrowLab Cookie Utilities
 * 
 * HTTP-only cookie management for refresh tokens.
 */

import type { HTTPEvent } from 'vinxi/http'
import { getCookie, setCookie, deleteCookie } from 'vinxi/http'

/** Cookie name for refresh token */
const REFRESH_TOKEN_COOKIE = 'growlab_refresh_token'

/** Cookie options for secure HTTP-only cookies */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
}

/**
 * Set refresh token in HTTP-only cookie
 * 
 * @param event - HTTP event context
 * @param token - Refresh token to store
 */
export function setRefreshTokenCookie(event: HTTPEvent, token: string): void {
  setCookie(event, REFRESH_TOKEN_COOKIE, token, COOKIE_OPTIONS)
}

/**
 * Get refresh token from cookie
 * 
 * @param event - HTTP event context
 * @returns Refresh token or undefined if not present
 */
export function getRefreshTokenCookie(event: HTTPEvent): string | undefined {
  return getCookie(event, REFRESH_TOKEN_COOKIE)
}

/**
 * Clear refresh token cookie
 * 
 * @param event - HTTP event context
 */
export function clearRefreshTokenCookie(event: HTTPEvent): void {
  deleteCookie(event, REFRESH_TOKEN_COOKIE, { path: '/' })
}
