import { createContext, useContext, useCallback, useRef, type ReactNode } from 'react'

interface FabActionCtx {
  trigger:  () => void
  register: (fn: (() => void) | null) => void
}

const FabActionContext = createContext<FabActionCtx>({
  trigger:  () => {},
  register: () => {},
})

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
  return useContext(FabActionContext)
}
