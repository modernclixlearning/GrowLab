import { createContext, useContext, useCallback, useRef, type ReactNode } from 'react'

interface FabActionCtx {
  trigger:  () => void
  register: (fn: (() => void) | null) => void
}

// `null` sentinel so `useFabAction` can fail loudly when a consumer is
// rendered outside the provider (same pattern as `useAuth`), instead of
// silently no-op'ing and hiding FAB wiring bugs.
const FabActionContext = createContext<FabActionCtx | null>(null)

export function FabActionProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<(() => void) | null>(null)
  const trigger  = useCallback(() => { handlerRef.current?.() }, [])
  const register = useCallback((fn: (() => void) | null) => { handlerRef.current = fn }, [])
  return (
    <FabActionContext.Provider value={{ trigger, register }}>
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
