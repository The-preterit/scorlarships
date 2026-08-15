import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  loading: boolean
  signIn: (code: string) => boolean
  signOut: () => void
}

const SECRET_CODE = import.meta.env.VITE_SECRET_CODE || '123456'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    const authStatus = localStorage.getItem('scholarships_auth')
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const signIn = (code: string): boolean => {
    if (code === SECRET_CODE) {
      setIsAuthenticated(true)
      localStorage.setItem('scholarships_auth', 'authenticated')
      return true
    }
    return false
  }

  const signOut = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('scholarships_auth')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
