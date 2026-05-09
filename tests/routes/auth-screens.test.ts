/**
 * GrowLab — Login / Register / Home auth screens smoke (F1).
 *
 * FIXME(f1): no jsdom/RTL available and adding deps is forbidden by F1
 * hard rules. We perform import-time smoke tests — the modules must
 * resolve and export a React function component. Render-time visual
 * coverage of these screens lives in the Playwright goldens
 * (`tests/visual/login.spec.ts`, `register.spec.ts`, `home.spec.ts`).
 */

import { describe, it, expect } from 'vitest'
import LoginPage from '@/routes/login'
import RegisterPage from '@/routes/register'
import HomePage from '@/routes/index'

describe('Auth screens — module smoke', () => {
  it('login page exports a function component', () => {
    expect(typeof LoginPage).toBe('function')
    expect(LoginPage.length).toBeLessThanOrEqual(1)
  })

  it('register page exports a function component', () => {
    expect(typeof RegisterPage).toBe('function')
    expect(RegisterPage.length).toBeLessThanOrEqual(1)
  })

  it('home page exports a function component', () => {
    expect(typeof HomePage).toBe('function')
    expect(HomePage.length).toBeLessThanOrEqual(1)
  })
})
