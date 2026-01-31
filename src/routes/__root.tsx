import { createRootRoute, Outlet } from '@tanstack/react-router'
import { AuthProvider } from '@/lib/stores/auth'
import '@/styles/globals.css'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Outlet />
      </div>
    </AuthProvider>
  )
}
