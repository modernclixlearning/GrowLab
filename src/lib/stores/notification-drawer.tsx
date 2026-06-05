import { createContext, useContext, useState, type ReactNode } from 'react'

interface NotifDrawerCtx {
  isOpen:  boolean
  open:    () => void
  close:   () => void
}

// `null` sentinel so `useNotificationDrawer` can fail loudly when a consumer
// is rendered outside the provider (same pattern as `useAuth`), instead of
// silently no-op'ing and hiding wiring bugs.
const NotifDrawerContext = createContext<NotifDrawerCtx | null>(null)

export function NotificationDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <NotifDrawerContext.Provider
      value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}
    >
      {children}
    </NotifDrawerContext.Provider>
  )
}

export function useNotificationDrawer() {
  const ctx = useContext(NotifDrawerContext)
  if (ctx === null) {
    throw new Error(
      'useNotificationDrawer must be used within a NotificationDrawerProvider',
    )
  }
  return ctx
}
