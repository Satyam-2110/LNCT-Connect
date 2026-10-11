import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured, isMockAuthEnabled } from '../lib/supabase'
import type { Tables } from '../types/database'
import { getMockProfileEdits } from '../services/profiles'

export type Profile = Tables<'profiles'>

export interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  isVerified: boolean
  isConfigured: boolean
  isMockEnabled: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>
  signUpWithEmail: (
    email: string,
    password: string,
    metadata: { fullName: string; branch: string; batch: string }
  ) => Promise<{ error: Error | null; needsEmailConfirmation?: boolean }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  submitVerification: (enrollmentNumber: string, idCardUrl?: string) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
  mockSignIn: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Default simulated profile for local offline development when Supabase credentials are not set
const MOCK_PROFILE: Profile = {
  id: 'mock-student-id-001',
  full_name: 'Aanya Mehta',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  branch: 'Computer Science',
  batch: '3rd Year (2022-2026)',
  graduation_year: '2026',
  bio: 'Full-stack builder passionate about campus collaboration, AI systems, and React.',
  location: 'LNCT Bhopal Campus',
  company: 'LNCT Student',
  is_alumni: false,
  role: 'student',
  verification_status: 'verified',
  github_url: 'https://github.com',
  linkedin_url: 'https://linkedin.com',
  portfolio_url: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('[LNCT Connect] Error fetching user profile:', error.message)
        return null
      }

      if (data) {
        setProfile(data)
        return data
      }
      return null
    } catch (err) {
      console.error('[LNCT Connect] Unexpected error loading profile:', err)
      return null
    }
  }

  const fetchProfileWithRetry = async (
    userId: string,
    retries = 3,
    delayMs = 350
  ): Promise<Profile | null> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const result = await fetchProfile(userId)
      if (result) return result
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(1.5, attempt)))
      }
    }
    return null
  }

  const refreshProfile = async () => {
    if (user?.id) {
      if (isSupabaseConfigured) {
        await fetchProfile(user.id)
      } else {
        const edits = getMockProfileEdits(user.id)
        if (edits) {
          setProfile((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              full_name: edits.fullName ?? prev.full_name,
              branch: edits.branch ?? prev.branch,
              batch: edits.batch ?? prev.batch,
              graduation_year: edits.graduationYear ?? prev.graduation_year,
              bio: edits.bio ?? prev.bio,
              location: edits.location ?? prev.location,
              company: edits.company ?? prev.company,
              github_url: edits.githubUrl ?? prev.github_url,
              linkedin_url: edits.linkedinUrl ?? prev.linkedin_url,
              portfolio_url: edits.portfolioUrl ?? prev.portfolio_url,
              updated_at: new Date().toISOString(),
            }
          })
        }
      }
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // In dev fallback mode, check if user had explicitly activated a mock session in sessionStorage
      if (isMockAuthEnabled) {
        const savedMock = sessionStorage.getItem('lnct_mock_session')
        if (savedMock === 'active') {
          setUser({ id: MOCK_PROFILE.id, email: 'aanya.mehta@lnct.ac.in' } as User)
          setProfile(MOCK_PROFILE)
        }
      }
      setLoading(false)
      return
    }

    let isMounted = true

    // 1. Get initial session and ensure profile is resolved before releasing loading lock
    const initAuth = async () => {
      try {
        const {
          data: { session: initSession },
        } = await supabase.auth.getSession()

        if (!isMounted) return
        setSession(initSession)
        setUser(initSession?.user ?? null)

        if (initSession?.user) {
          await fetchProfile(initSession.user.id)
        }
      } catch (err) {
        console.error('[LNCT Connect] Initial session retrieval error:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    // 2. Subscribe to auth state updates
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return
      setSession(newSession)
      setUser(newSession?.user ?? null)
      if (newSession?.user) {
        await fetchProfile(newSession.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signInWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      // Strict rule: Never report operations as successful when not connected to database
      return {
        error: new Error(
          'Supabase is not configured in local environment. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local to authenticate.' +
          (isMockAuthEnabled ? ' Or use the Quick Demo Sign-In button.' : '')
        ),
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        return { error }
      }

      setSession(data.session)
      setUser(data.user)
      if (data.user) {
        await fetchProfile(data.user.id)
      }
      return { error: null }
    } catch (err: any) {
      return { error: err }
    }
  }

  const signUpWithEmail = async (
    email: string,
    password: string,
    metadata: { fullName: string; branch: string; batch: string }
  ) => {
    if (!isSupabaseConfigured) {
      // Strict rule: Never report operations as successful when not connected to database
      return {
        error: new Error(
          'Supabase is not configured in local environment. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local to create accounts.'
        ),
      }
    }

    try {
      const trimmedEmail = email.trim()
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: metadata.fullName,
            name: metadata.fullName,
            branch: metadata.branch,
            batch: metadata.batch,
          },
        },
      })

      if (error) {
        return { error }
      }

      setSession(data.session)
      setUser(data.user)
      if (data.user) {
        // Poll for profile creation with retry to accommodate asynchronous trigger execution
        await fetchProfileWithRetry(data.user.id)
      }

      const needsEmailConfirmation = !data.session && Boolean(data.user)
      return { error: null, needsEmailConfirmation }
    } catch (err: any) {
      return { error: err }
    }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      sessionStorage.removeItem('lnct_mock_session')
      setUser(null)
      setProfile(null)
      setSession(null)
      return
    }

    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('[LNCT Connect] Sign out error:', err)
    } finally {
      setUser(null)
      setProfile(null)
      setSession(null)
    }
  }

  const resetPassword = async (email: string) => {
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) {
      return { error: new Error('Please enter a valid email address.') }
    }

    if (!isSupabaseConfigured) {
      if (!isMockAuthEnabled) {
        return {
          error: new Error('Supabase is not configured. Cannot dispatch password recovery email.'),
        }
      }
      // In dev mock mode, simulate clean dispatch without error
      return { error: null }
    }

    try {
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${siteUrl}/login?reset=true`,
      })

      if (error) {
        const errorMsg = error.message?.toLowerCase() || ''
        const status = error.status

        // Surface genuine rate limits to prevent email abuse
        if (
          status === 429 ||
          errorMsg.includes('rate limit') ||
          errorMsg.includes('over_email_send_rate_limit') ||
          errorMsg.includes('too many requests')
        ) {
          return {
            error: new Error('Too many password reset attempts. Please wait a few minutes before trying again.'),
          }
        }

        // Surface network and server errors
        if (
          errorMsg.includes('network') ||
          errorMsg.includes('fetch') ||
          errorMsg.includes('failed to fetch') ||
          status === 502 ||
          status === 503 ||
          status === 504
        ) {
          return {
            error: new Error('Network error. Failed to reach authentication server. Please check your connection.'),
          }
        }

        // Privacy safeguard: Non-existent email addresses, user not found, or generic auth errors
        // are normalized to prevent user enumeration
        return { error: null }
      }

      return { error: null }
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() || ''
      if (msg.includes('fetch') || msg.includes('network')) {
        return {
          error: new Error('Network error. Failed to reach authentication server. Please check your connection.'),
        }
      }
      // Privacy safeguard: Always return null error to avoid revealing account existence
      return { error: null }
    }
  }

  const submitVerification = async (enrollmentNumber: string, idCardUrl: string = '') => {
    if (!user?.id) {
      return { error: new Error('User must be logged in to submit verification.') }
    }

    if (!isSupabaseConfigured) {
      if (isMockAuthEnabled && profile) {
        setProfile({ ...profile, verification_status: 'pending' })
        return { error: null }
      }
      return {
        error: new Error(
          'Supabase is not configured. Cannot record verification request to database.'
        ),
      }
    }

    try {
      // Insert audit request; database trigger trg_new_verification_request
      // automatically transitions profiles.verification_status to 'pending'
      const { error: insertError } = await supabase.from('verification_requests').insert({
        user_id: user.id,
        enrollment_number: enrollmentNumber.trim(),
        id_card_url: idCardUrl,
        status: 'pending',
      })

      if (insertError) {
        return { error: insertError }
      }

      await refreshProfile()
      return { error: null }
    } catch (err: any) {
      return { error: err }
    }
  }

  const mockSignIn = () => {
    if (!isMockAuthEnabled) {
      console.warn('[LNCT Connect] Mock auth is disabled. Set VITE_ENABLE_MOCK_AUTH=true in .env.local to enable.')
      return
    }
    sessionStorage.setItem('lnct_mock_session', 'active')
    setUser({ id: MOCK_PROFILE.id, email: 'aanya.mehta@lnct.ac.in' } as User)
    setProfile(MOCK_PROFILE)
    setLoading(false)
  }

  const isVerified = profile?.verification_status === 'verified'

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isVerified,
        isConfigured: isSupabaseConfigured,
        isMockEnabled: isMockAuthEnabled,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        resetPassword,
        submitVerification,
        refreshProfile,
        mockSignIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
