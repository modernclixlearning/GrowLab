import { createContext, useContext, useCallback, useRef, useState, type ReactNode } from 'react'

interface FabActionCtx {
  trigger:   () => void
  register:  (fn: (() => void) | null) => void
  hasAction: boolean
}

// `null` sentinel so `useFabAction` can fail loudly when a consumer is
// rendered outside the provider (same pattern as `useAuth`), instead of
// silently no-op'ing and hiding FAB wiring bugs.
const FabActionContext = createContext<FabActionCtx | null>(null)

export function FabActionProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<(() => void) | null>(null)
  const [hasAction, setHasAction] = useState(false)
  const trigger  = useCallback(() => { handlerRef.current?.() }, [])
  const register = useCallback((fn: (() => void) | null) => {
    handlerRef.current = fn
    setHasAction(fn !== null)
  }, [])
  return (
    <FabActionContext.Provider value={{ trigger, register, hasAction }}>
      {children}
    </FabActionContext.Provider>
  )
}

export function useFabAction() {
  const ctx = useContext(FabActionContext)
  if (ctx === null) {
    throw new Error('useFabAction must be used within a FabActionProvider')
  }
  return ctx
}
