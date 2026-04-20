import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { generateCodeChallenge, generateCodeVerifier } from "@/lib/pkce"
import {
  login as apiLogin,
  exchangeToken as apiExchangeToken,
  refreshToken as apiRefreshToken,
} from "@/api/generated/auth/auth"
import type { LoginResponse, TokenResponse } from "@/api/types"
import { setTokenGetter } from "@/api/instance"

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

let moduleAccessToken: string | null = null

export function getAccessToken(): string | null {
  return moduleAccessToken
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const updateToken = useCallback((token: string | null) => {
    moduleAccessToken = token
    setAccessToken(token)
  }, [])

  // Wire token getter into axios instance
  useEffect(() => {
    setTokenGetter(() => moduleAccessToken)
  }, [])

  // Silent refresh on mount
  useEffect(() => {
    let cancelled = false
    apiRefreshToken()
      .then((res) => {
        if (!cancelled) {
          const { accessToken: token } = res as unknown as TokenResponse
          updateToken(token)
        }
      })
      .catch(() => {
        // No valid refresh cookie — user needs to log in
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [updateToken])

  const login = useCallback(
    async (username: string, password: string) => {
      const codeVerifier = generateCodeVerifier()
      const codeChallenge = await generateCodeChallenge(codeVerifier)

      const loginRes = (await apiLogin({
        username,
        password,
        codeChallenge,
      })) as unknown as LoginResponse

      const tokenRes = (await apiExchangeToken({
        code: loginRes.authCode,
        codeVerifier,
      })) as unknown as TokenResponse

      updateToken(tokenRes.accessToken)
    },
    [updateToken]
  )

  const logout = useCallback(() => {
    updateToken(null)
  }, [updateToken])

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: accessToken !== null,
      isLoading,
      login,
      logout,
    }),
    [accessToken, isLoading, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return ctx
}
