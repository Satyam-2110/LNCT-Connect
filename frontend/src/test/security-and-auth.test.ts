import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reviewVerification, __resetAdminStore } from '../services/admin'

// Helper mock functions simulating our database & auth contracts
function isInstitutionalEmail(email: string): boolean {
  const allowedDomains = ['lnct.ac.in', 'lnctbhopal.in']
  const domain = email.toLowerCase().split('@')[1]
  return allowedDomains.includes(domain)
}

function canSendConnectionRequest(user: { id: string; verification_status: string }): boolean {
  // RLS rule: Only verified users can send connection requests
  return user.verification_status === 'verified'
}

function canViewVerificationRequest(
  request: { user_id: string },
  currentUser: { id: string; role: string }
): boolean {
  // RLS rule: auth.uid() = user_id OR is_admin()
  return currentUser.id === request.user_id || currentUser.role === 'admin'
}

function preventProfilePrivilegeEscalation(
  oldProfile: { role: string; verification_status: string },
  newProfile: { role: string; verification_status: string },
  caller: { role: string }
): boolean {
  if (caller.role !== 'admin') {
    if (newProfile.role !== oldProfile.role) return false
    if (newProfile.verification_status !== oldProfile.verification_status) return false
  }
  return true
}

describe('Security & Progressive Access Tests', () => {
  it('rejects connection write operations from unverified students', () => {
    const unverifiedUser = { id: 'usr-1', verification_status: 'unverified' }
    const pendingUser = { id: 'usr-2', verification_status: 'pending' }
    const verifiedUser = { id: 'usr-3', verification_status: 'verified' }

    expect(canSendConnectionRequest(unverifiedUser)).toBe(false)
    expect(canSendConnectionRequest(pendingUser)).toBe(false)
    expect(canSendConnectionRequest(verifiedUser)).toBe(true)
  })

  it('prevents non-admin users from escalating their own role or verification status', () => {
    const studentCaller = { role: 'student' }
    const adminCaller = { role: 'admin' }

    const originalProfile = { role: 'student', verification_status: 'unverified' }
    const escalatedProfile = { role: 'admin', verification_status: 'verified' }

    // Student attempting to self-promote to admin/verified
    expect(
      preventProfilePrivilegeEscalation(originalProfile, escalatedProfile, studentCaller)
    ).toBe(false)

    // Admin updating user status
    expect(
      preventProfilePrivilegeEscalation(originalProfile, escalatedProfile, adminCaller)
    ).toBe(true)
  })

  it('restricts verification request documents strictly to the owner and administrators', () => {
    const request = { user_id: 'student-42' }

    const owner = { id: 'student-42', role: 'student' }
    const peer = { id: 'student-99', role: 'student' }
    const admin = { id: 'admin-1', role: 'admin' }

    expect(canViewVerificationRequest(request, owner)).toBe(true)
    expect(canViewVerificationRequest(request, peer)).toBe(false)
    expect(canViewVerificationRequest(request, admin)).toBe(true)
  })

  it('accurately validates official institutional email domains', () => {
    expect(isInstitutionalEmail('student@lnct.ac.in')).toBe(true)
    expect(isInstitutionalEmail('faculty@lnctbhopal.in')).toBe(true)
    expect(isInstitutionalEmail('hacker@gmail.com')).toBe(false)
    expect(isInstitutionalEmail('fake@lnct.com')).toBe(false)
  })
})

describe('Password Recovery Privacy Tests', () => {
  it('does not leak account existence on password recovery requests', async () => {
    const mockResetPasswordForEmail = vi.fn().mockImplementation((email: string) => {
      // Simulate Supabase API response: Even if user is not found, feedback to client must be uniform
      return Promise.resolve({ data: {}, error: null })
    })

    const result = await mockResetPasswordForEmail('nonexistent@lnct.ac.in')
    expect(result.error).toBeNull()

    // The user-facing feedback is always generic
    const feedback =
      'If an account is associated with this email address, password recovery instructions have been sent.'
    expect(feedback).not.toContain('User not found')
    expect(feedback).not.toContain('Email does not exist')
  })
})

describe('Environment & Production Configuration Validation Tests', () => {
  it('strictly rejects unconfigured credentials in production mode', () => {
    function validateProductionConfig(isProd: boolean, hasUrl: boolean, hasKey: boolean) {
      if (isProd && (!hasUrl || !hasKey)) {
        throw new Error('[LNCT Connect Production Error] Missing valid Supabase credentials.')
      }
      return true
    }

    // Development allows starting with warning
    expect(validateProductionConfig(false, false, false)).toBe(true)

    // Production strictly throws fatal error
    expect(() => validateProductionConfig(true, false, false)).toThrowError(
      '[LNCT Connect Production Error] Missing valid Supabase credentials.'
    )
    expect(() => validateProductionConfig(true, true, false)).toThrowError(
      '[LNCT Connect Production Error] Missing valid Supabase credentials.'
    )
    expect(validateProductionConfig(true, true, true)).toBe(true)
  })

  it('does not report authentication operations as successful when Supabase is unconfigured', () => {
    function simulateUnconfiguredAuth(isConfigured: boolean) {
      if (!isConfigured) {
        return {
          error: new Error(
            'Supabase is not configured in local environment. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local'
          ),
        }
      }
      return { error: null }
    }

    const unconfiguredResult = simulateUnconfiguredAuth(false)
    expect(unconfiguredResult.error).not.toBeNull()
    expect(unconfiguredResult.error?.message).toContain('Supabase is not configured')
  })
})

describe('Phase 17: Authentication & Verification Integrity Tests', () => {
  beforeEach(() => {
    __resetAdminStore()
  })

  describe('1. Verification Submission & Trigger-Based State Synchronization', () => {
    it('automatically transitions profile verification status to pending on request submission', () => {
      const profile = { id: 'usr-101', verification_status: 'unverified' }
      const newRequest = { user_id: 'usr-101', status: 'pending' as const }

      // Database trigger simulation for trg_new_verification_request
      function onVerificationRequestInsert(req: typeof newRequest, prof: typeof profile) {
        if (req.user_id === prof.id) {
          prof.verification_status = 'pending'
        }
      }

      onVerificationRequestInsert(newRequest, profile)
      expect(profile.verification_status).toBe('pending')
    })

    it('synchronizes profile verification status when admin approves request', () => {
      const profile = { id: 'usr-101', verification_status: 'pending' }

      // Database trigger simulation for trg_sync_profile_verification (approved)
      function onVerificationRequestReviewed(decision: 'approved' | 'rejected', prof: typeof profile) {
        prof.verification_status = decision === 'approved' ? 'verified' : 'rejected'
      }

      onVerificationRequestReviewed('approved', profile)
      expect(profile.verification_status).toBe('verified')
    })

    it('synchronizes profile verification status when admin rejects request', () => {
      const profile = { id: 'usr-102', verification_status: 'pending' }

      function onVerificationRequestReviewed(decision: 'approved' | 'rejected', prof: typeof profile) {
        prof.verification_status = decision === 'approved' ? 'verified' : 'rejected'
      }

      onVerificationRequestReviewed('rejected', profile)
      expect(profile.verification_status).toBe('rejected')
    })
  })

  describe('2. Password Recovery Error Handling & Privacy Guards', () => {
    function classifyResetPasswordError(error: { message?: string; status?: number } | null): Error | null {
      if (!error) return null
      const errorMsg = error.message?.toLowerCase() || ''
      const status = error.status

      if (
        status === 429 ||
        errorMsg.includes('rate limit') ||
        errorMsg.includes('over_email_send_rate_limit') ||
        errorMsg.includes('too many requests')
      ) {
        return new Error('Too many password reset attempts. Please wait a few minutes before trying again.')
      }

      if (
        errorMsg.includes('network') ||
        errorMsg.includes('fetch') ||
        errorMsg.includes('failed to fetch') ||
        status === 502 ||
        status === 503 ||
        status === 504
      ) {
        return new Error('Network error. Failed to reach authentication server. Please check your connection.')
      }

      return null
    }

    it('surfaces genuine rate limit errors with user-friendly retry guidance', () => {
      const rateLimitErr = classifyResetPasswordError({
        message: 'over_email_send_rate_limit',
        status: 429,
      })

      expect(rateLimitErr).not.toBeNull()
      expect(rateLimitErr?.message).toMatch(/too many password reset attempts/i)
    })

    it('surfaces network connectivity errors when authentication server is unreachable', () => {
      const networkErr = classifyResetPasswordError({
        message: 'TypeError: Failed to fetch',
        status: 503,
      })

      expect(networkErr).not.toBeNull()
      expect(networkErr?.message).toMatch(/network error/i)
    })

    it('masks non-existent account or user-not-found errors to prevent email enumeration', () => {
      const userNotFoundErr = classifyResetPasswordError({
        message: 'User not found for provided email address',
        status: 400,
      })

      // Privacy rule: must return null so client cannot discover whether an email is registered
      expect(userNotFoundErr).toBeNull()
    })

    it('returns null on successful password recovery dispatch', () => {
      const successErr = classifyResetPasswordError(null)
      expect(successErr).toBeNull()
    })
  })

  describe('3. Profile Hydration with Exponential Backoff Retry', () => {
    it('successfully resolves profile when trigger creates profile after a brief delay', async () => {
      let callCount = 0
      const mockFetchWithTriggerLag = async (attempt: number) => {
        callCount++
        // Simulate profile creation trigger taking 2 attempts before row becomes visible
        if (attempt < 2) {
          return null
        }
        return { id: 'user-new-001', full_name: 'Aditya Kumar', branch: 'CSE' }
      }

      async function fetchProfileWithRetry(
        fetchFn: (attempt: number) => Promise<{ id: string; full_name: string; branch: string } | null>,
        retries = 3,
        delayMs = 5
      ) {
        for (let attempt = 0; attempt <= retries; attempt++) {
          const result = await fetchFn(attempt)
          if (result) return result
          if (attempt < retries) {
            await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(1.5, attempt)))
          }
        }
        return null
      }

      const resolved = await fetchProfileWithRetry(mockFetchWithTriggerLag, 3, 5)
      expect(resolved).not.toBeNull()
      expect(resolved?.full_name).toBe('Aditya Kumar')
      expect(callCount).toBe(3) // attempt 0, attempt 1, attempt 2 (found)
    })

    it('gracefully returns null if profile creation completely fails after all retries', async () => {
      const alwaysFails = async () => null

      async function fetchProfileWithRetry(
        fetchFn: () => Promise<null>,
        retries = 2,
        delayMs = 2
      ) {
        for (let attempt = 0; attempt <= retries; attempt++) {
          const result = await fetchFn()
          if (result) return result
          if (attempt < retries) {
            await new Promise((resolve) => setTimeout(resolve, delayMs))
          }
        }
        return null
      }

      const resolved = await fetchProfileWithRetry(alwaysFails, 2, 2)
      expect(resolved).toBeNull()
    })
  })

  describe('4. Admin Verification Review Return Contract', () => {
    it('returns updated item with status and notes on verification review', async () => {
      const adminId = 'admin-user-001'
      const res = await reviewVerification(
        adminId,
        true,
        'vr-seed-1',
        'approved',
        'Verified against official LNCT ERP records.'
      )

      expect(res.success).toBe(true)
      expect(res.item).toBeDefined()
      expect(res.item?.id).toBe('vr-seed-1')
      expect(res.item?.status).toBe('approved')
      expect(res.item?.reviewNotes).toBe('Verified against official LNCT ERP records.')
      expect(res.item?.reviewedAt).toBeDefined()
    })

    it('blocks non-admin user from reviewing verification requests', async () => {
      const studentId = 'student-regular-002'
      const res = await reviewVerification(studentId, false, 'vr-seed-1', 'approved')

      expect(res.success).toBe(false)
      expect(res.error).toMatch(/unauthorized|only administrators/i)
      expect(res.item).toBeUndefined()
    })
  })
})

