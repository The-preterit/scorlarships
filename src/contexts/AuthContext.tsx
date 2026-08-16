import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

interface Profile {
  id: string
  full_name: string | null
  updated_at: string
}

interface AuthContextType {
  isAuthenticated: boolean
  loading: boolean
  profile: Profile | null
  signIn: (code: string) => Promise<boolean>
  signOut: () => void
  refreshProfile: () => Promise<void>
}

const SECRET_CODE = import.meta.env.VITE_SECRET_CODE || '123456'
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    // Check if user is already authenticated
    const authStatus = localStorage.getItem('scholarships_auth')
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true)
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', DEFAULT_USER_ID)
        .single()

      if (error) {
        console.log('Profile fetch error:', error)
        // Profile doesn't exist (PGRST116 = not found, or 406 = not acceptable), create it
        // Profile not found - create it (PGRST116 = not found)
        if (error.code === 'PGRST116' || (error as any).status === 406) {
          console.log('Profile not found, creating new one...')
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({ id: DEFAULT_USER_ID, full_name: 'Utilisateur' })
            .select()
            .single()

          if (createError) {
            console.error('Error creating profile:', createError)
          } else if (newProfile) {
            console.log('Created new profile:', newProfile)
            setProfile(newProfile)
          }
        }
      } else if (data) {
        console.log('Fetched profile from Supabase:', data)
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (code: string): Promise<boolean> => {
    if (code === SECRET_CODE) {
      setIsAuthenticated(true)
      localStorage.setItem('scholarships_auth', 'authenticated')
      await fetchProfile()
      return true
    }
    return false
  }

  const signOut = () => {
    setIsAuthenticated(false)
    setProfile(null)
    localStorage.removeItem('scholarships_auth')
  }

  const refreshProfile = async () => {
    await fetchProfile()
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, profile, signIn, signOut, refreshProfile }}>
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
