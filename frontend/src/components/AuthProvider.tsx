import { createContext, useContext, type ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'

type Auth = ReturnType<typeof useAuth>
const AuthContext = createContext<Auth | null>(null)
export function AuthProvider({children}: {children: ReactNode}) {
  const auth = useAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}
export function useAuthContext() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('AuthProvider is missing')
  return value
}
