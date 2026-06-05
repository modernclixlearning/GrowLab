import { createContext, useContext, useState, type ReactNode } from 'react'

interface NotifDrawerCtx {
  isOpen:  boolean
  open:    () => void
  close:   () => void
}

const NotifDrawerContext = createContext<NotifDrawerCtx>({
  isOpen: false,
  open:   () => {},
  close:  () => {},
})

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
  return useContext(NotifDrawerContext)
}
