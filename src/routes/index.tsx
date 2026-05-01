import { Leaf } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-primary-100 p-4">
            <Leaf className="h-16 w-16 text-primary-700" />
          </div>
        </div>
        <h1 className="mb-4 text-4xl font-bold text-gray-900">
          Welcome to GrowLab
        </h1>
        <p className="mb-8 text-lg text-gray-600">
          Cannabis Growing App - Track your plants from seed to harvest
        </p>
        <div className="flex gap-4 justify-center">
          <a href="/login" className="btn-primary">
            Sign In
          </a>
          <a href="/register" className="btn-secondary">
            Create Account
          </a>
        </div>
      </div>
    </div>
  )
}
