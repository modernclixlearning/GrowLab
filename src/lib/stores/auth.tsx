/**
 * GrowLab Auth Store
 * 
 * React context-based auth state management.
 * Handles user session, access token, and auth operations.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import type { User, RegisterRequest, LoginRequest } from '@/types/auth'
import * as authApi from '@/lib/api/auth'

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  login: (data: LoginRequest) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterRequest) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshSession: () => Promise<boolean>
  /**
   * Replace the cached user object after a `PATCH /me` so consumers see
   * the new stageMode/prefs immediately. Used by `useUpdateMe`.
   */
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Auth Provider component
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: true,
    isAuthenticated: false,
  })

  // Monotonic counter bumped by every explicit auth mutation (login /
  // register / logout). The mount-time `refreshSession()` captures the value
  // at start and only applies its result if no newer mutation has landed —
  // otherwise a slow refresh resolving after a successful login could clobber
  // the authenticated state and log the user back out.
  const mutationSeq = useRef(0)

  /**
   * Refresh the session on mount
   */
  useEffect(() => {
    refreshSession()
  }, [])

  /**
   * Refresh session using refresh token cookie
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    // Snapshot the mutation counter; if it changes while we await the network,
    // a newer login/register/logout has taken over and our result is stale.
    const seq = mutationSeq.current
    const isStale = () => mutationSeq.current !== seq

    try {
      const result = await authApi.refreshToken()

      if (result.success) {
        const meResult = await authApi.getMe(result.data.accessToken)

        if (meResult.success) {
          if (isStale()) return true
          setState({
            user: meResult.data.user,
            accessToken: result.data.accessToken,
            isLoading: false,
            isAuthenticated: true,
          })
          return true
        }
      }

      if (isStale()) return false
      setState({
        user: null,
        accessToken: null,
        isLoading: false,
        isAuthenticated: false,
      })
      return false
    } catch {
      if (isStale()) return false
      setState({
        user: null,
        accessToken: null,
        isLoading: false,
        isAuthenticated: false,
      })
      return false
    }
  }, [])

  /**
   * Login with credentials
   */
  const login = useCallback(
    async (data: LoginRequest): Promise<{ success: boolean; error?: string }> => {
      // Supersede any in-flight refreshSession so its result can't clobber
      // the state this login is about to set.
      mutationSeq.current += 1
      setState((prev) => ({ ...prev, isLoading: true }))

      try {
        const result = await authApi.login(data)

        if (result.success) {
          setState({
            user: result.data.user,
            accessToken: result.data.accessToken,
            isLoading: false,
            isAuthenticated: true,
          })
          return { success: true }
        }

        setState((prev) => ({ ...prev, isLoading: false }))
        return { success: false, error: result.error.message }
      } catch {
        setState((prev) => ({ ...prev, isLoading: false }))
        return { success: false, error: 'An unexpected error occurred' }
      }
    },
    []
  )

  /**
   * Register new account
   */
  const register = useCallback(
    async (data: RegisterRequest): Promise<{ success: boolean; error?: string }> => {
      // Supersede any in-flight refreshSession (see login).
      mutationSeq.current += 1
      setState((prev) => ({ ...prev, isLoading: true }))

      try {
        const result = await authApi.register(data)

        if (result.success) {
          setState({
            user: result.data.user,
            accessToken: result.data.accessToken,
            isLoading: false,
            isAuthenticated: true,
          })
          return { success: true }
        }

        setState((prev) => ({ ...prev, isLoading: false }))
        return { success: false, error: result.error.message }
      } catch {
        setState((prev) => ({ ...prev, isLoading: false }))
        return { success: false, error: 'An unexpected error occurred' }
      }
    },
    []
  )

  /**
   * Replace the cached user (used after PATCH /me).
   */
  const setUser = useCallback((user: User) => {
    setState((prev) => ({ ...prev, user }))
  }, [])

  /**
   * Logout and clear session
   */
  const logout = useCallback(async (): Promise<void> => {
    // Supersede any in-flight refreshSession so it can't re-authenticate.
    mutationSeq.current += 1
    await authApi.logout()
    setState({
      user: null,
      accessToken: null,
      isLoading: false,
      isAuthenticated: false,
    })
  }, [])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        refreshSession,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Hook to get current user (throws if not authenticated)
 */
export function useUser(): User {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated || !user) {
    throw new Error('User is not authenticated')
  }
  return user
}
