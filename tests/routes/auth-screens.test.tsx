/**
 * GrowLab — Login / Register auth screens (F6e RTL rewrite)
 *
 * Phase F6e: upgraded from F1 module smoke to @testing-library/react
 * render tests that assert form fields and submit buttons are present.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}))

vi.mock('@/lib/stores/auth', () => ({
  useAuth: () => ({
    login: vi.fn().mockResolvedValue({ success: true }),
    register: vi.fn().mockResolvedValue({ success: true }),
    isLoading: false,
  }),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import LoginPage from '@/routes/login'
import RegisterPage from '@/routes/register'

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders the Sign in submit button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })
})

describe('RegisterPage', () => {
  it('renders all registration form fields', () => {
    render(<RegisterPage />)
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    // get the first password field (there are two)
    const passwordFields = screen.getAllByLabelText(/password/i)
    expect(passwordFields.length).toBeGreaterThanOrEqual(2)
  })

  it('renders the Create account submit button', () => {
    render(<RegisterPage />)
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })
})
