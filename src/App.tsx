import { Routes, Route } from 'react-router-dom'
import { AppShell, type AppShellProps } from '@/components/shell'
import HomePage from './routes/index'
import LoginPage from './routes/login'
import RegisterPage from './routes/register'
import DashboardPage from './routes/dashboard'
import GardenPage from './routes/garden'
import PlantDetailPage from './routes/plants/$plantId'
import ProfilePage from './routes/profile'
import SchedulePage from './routes/schedule'

/**
 * Wraps an authenticated route in the AppShell chrome (BottomNav + FAB).
 * Auth screens (login / register) and the public landing skip the shell
 * to remain full-bleed.
 */
function Shelled({
  children,
  ...props
}: { children: React.ReactNode } & Omit<AppShellProps, 'children'>) {
  return <AppShell {...props}>{children}</AppShell>
}

export default function App() {
  return (
    <Routes>
      {/* Full-bleed (no BottomNav) */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Authenticated routes wrapped in AppShell */}
      <Route
        path="/dashboard"
        element={
          <Shelled>
            <DashboardPage />
          </Shelled>
        }
      />
      <Route
        path="/garden"
        element={
          <Shelled>
            <GardenPage />
          </Shelled>
        }
      />
      <Route
        path="/plants/:plantId"
        element={
          <Shelled>
            <PlantDetailPage />
          </Shelled>
        }
      />
      <Route
        path="/profile"
        element={
          <Shelled>
            <ProfilePage />
          </Shelled>
        }
      />
      <Route
        path="/schedule"
        element={
          <Shelled>
            <SchedulePage />
          </Shelled>
        }
      />
    </Routes>
  )
}
