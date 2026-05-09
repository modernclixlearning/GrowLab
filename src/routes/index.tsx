import { Leaf } from 'lucide-react'
import { Eyebrow, H1 } from '@/components/shell'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-8 text-fg">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-soft text-accent shadow-accent-glow">
            <Leaf className="h-10 w-10" />
          </div>
        </div>
        <Eyebrow tone="accent" className="mb-3 block">
          Cannabis Cultivation OS
        </Eyebrow>
        <H1 className="mb-4">Welcome to GrowLab</H1>
        <p className="mb-8 text-base text-fg-3">
          Track your plants from seed to harvest with a system built for serious growers.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-accent px-5 py-3 text-sm font-semibold text-bg shadow-accent-glow transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Sign In
          </a>
          <a
            href="/register"
            className="inline-flex items-center justify-center rounded-md border border-line bg-card px-5 py-3 text-sm font-semibold text-fg transition-colors hover:bg-card-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Create Account
          </a>
        </div>
      </div>
    </div>
  )
}
