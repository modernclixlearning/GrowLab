/**
 * GrowLab Register Page (F1 redesign)
 *
 * Visually paired with `/login`: dark + neon, eyebrow uppercase labels,
 * 56px-tall fields with `accent-glow` focus, Sonner success toast on
 * account creation.
 */

import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Leaf, Mail, Lock, User, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/stores/auth'
import { Eyebrow, H1 } from '@/components/shell'

const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    email: z.string().min(1, 'Email is required').email('Invalid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

const inputBase =
  'w-full rounded-md border bg-bg-1 pl-11 pr-3 h-12 text-[15px] text-fg placeholder:text-fg-4 outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-1 focus-visible:ring-offset-bg'
const inputBorderOk = 'border-line'
const inputBorderErr = 'border-status-warn focus:border-status-warn'

const labelBase = 'mb-2 block font-mono text-[11px] font-semibold uppercase tracking-eyebrow text-fg-2'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerUser, isLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setError(null)
    const result = await registerUser({
      email: data.email,
      password: data.password,
      name: data.name,
    })

    if (result.success) {
      toast.success(`Welcome, ${data.name.split(' ')[0]}`)
      navigate('/dashboard')
    } else {
      const message = result.error || 'Registration failed'
      setError(message)
      toast.error(message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-5 py-12 text-fg">
      <div className="w-full max-w-md">
        {/* Logo + heading */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-accent shadow-accent-glow ring-1 ring-accent-dark">
            <Leaf className="h-8 w-8" />
          </div>
          <Eyebrow tone="accent" className="mb-3 block">
            GrowLab · Cultivation OS
          </Eyebrow>
          <H1 className="text-[28px]">Create your account</H1>
          <p className="mt-2 text-sm text-fg-3">Start tracking your plants today</p>
        </div>

        {/* Form */}
        <div className="rounded-xl border border-line bg-card p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-md border border-status-warn/40 bg-status-warn/10 p-3 text-status-warn"
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="name" className={labelBase}>
                Full name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-fg-3" />
                <input
                  {...register('name')}
                  type="text"
                  id="name"
                  autoComplete="name"
                  className={`${inputBase} ${errors.name ? inputBorderErr : inputBorderOk}`}
                  placeholder="Jane Grower"
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-sm text-status-warn">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={labelBase}>
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-fg-3" />
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  autoComplete="email"
                  className={`${inputBase} ${errors.email ? inputBorderErr : inputBorderOk}`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-status-warn">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className={labelBase}>
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-fg-3" />
                <input
                  {...register('password')}
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  className={`${inputBase} ${errors.password ? inputBorderErr : inputBorderOk}`}
                  placeholder="At least 8 characters"
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-status-warn">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label htmlFor="confirmPassword" className={labelBase}>
                Confirm password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-fg-3" />
                <input
                  {...register('confirmPassword')}
                  type="password"
                  id="confirmPassword"
                  autoComplete="new-password"
                  className={`${inputBase} ${errors.confirmPassword ? inputBorderErr : inputBorderOk}`}
                  placeholder="Repeat your password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-sm text-status-warn">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center rounded-full bg-accent px-5 h-12 text-[15px] font-bold text-bg shadow-accent-glow transition-transform hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-60 disabled:hover:scale-100"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-fg-3">Already have an account? </span>
            <Link
              to="/login"
              className="font-medium text-accent transition-colors hover:text-fg"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
