/**
 * GrowLab Home (landing) — F1 redesign.
 *
 * Public-facing entry. Dark + neon, large display heading, eyebrow strip
 * stating the product positioning, two CTAs (Sign in / Create account).
 */

import { Leaf, ArrowRight } from 'lucide-react'
import { Eyebrow, H1 } from '@/components/shell'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-8 text-fg">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-soft text-accent shadow-accent-glow ring-1 ring-accent-dark">
            <Leaf className="h-10 w-10" />
          </div>
        </div>
        <Eyebrow tone="accent" className="mb-4 block">
          GrowLab · Cultivation OS
        </Eyebrow>
        <H1 className="mb-4 text-[34px] leading-tight">
          A grow-tent dashboard for serious cultivators.
        </H1>
        <p className="mb-8 text-base text-fg-2">
          Track plants from seed to harvest. Schedules, sensors, photo timelines,
          environmental targets — built for the way you actually grow.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 h-12 text-[15px] font-bold text-bg shadow-accent-glow transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Sign In
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="/register"
            className="inline-flex items-center justify-center rounded-full border border-line-2 bg-card px-6 h-12 text-[15px] font-semibold text-fg transition-colors hover:bg-card-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Create Account
          </a>
        </div>
        <p className="mt-8 font-mono text-[11px] uppercase tracking-eyebrow text-fg-4">
          Dark by default · Mobile-first · Open source
        </p>
      </div>
    </div>
  )
}
