import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { students as seedStudents, currentUser } from '../data/students'
import type { Student } from '../types'
import { matchesQuery } from '../lib/utils'

export interface ProfileFilters {
  query?: string
  branch?: string
  year?: string
  skill?: string
  alumni?: boolean
  limit?: number
  offset?: number
}

// In-memory store for offline profile edits
const mockProfileEdits: Map<
  string,
  {
    fullName?: string
    branch?: string
    batch?: string
    graduationYear?: string
    bio?: string
    location?: string
    company?: string
    githubUrl?: string
    linkedinUrl?: string
    portfolioUrl?: string
  }
> = new Map()

export function getMockProfileEdits(userId: string) {
  return mockProfileEdits.get(userId)
}

export function __clearMockProfileEdits() {
  mockProfileEdits.clear()
}

/**
 * Transforms a Supabase `profiles` row + joined skills into the frontend `Student` contract.
 */
export function mapDatabaseProfileToStudent(row: any, userSkills: string[] = []): Student {
  const nameParts = (row.full_name || 'Student').trim().split(' ')
  const initials =
    nameParts.length > 1
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : nameParts[0].slice(0, 2).toUpperCase()

  return {
    id: row.id,
    name: row.full_name || 'Student',
    initials,
    avatar: row.avatar_url || 'warm',
    branch: row.branch || 'Engineering',
    year: row.batch || 'Student',
    graduationYear: row.graduation_year || undefined,
    bio: row.bio || 'LNCT Campus Network Member',
    skills: userSkills.length > 0 ? userSkills : ['Engineering', 'Networking'],
    interests: ['Collaboration', 'Campus Projects'],
    connections: 0,
    location: row.location || 'Bhopal, MP',
    company: row.company || (row.is_alumni ? 'LNCT Alumni' : undefined),
    role: row.role || 'student',
    isAlumni: row.is_alumni || false,
    online: true,
  }
}

/**
 * Fetches directory profiles, prioritizing live PostgreSQL database entries
 * and augmenting with curated seed profiles for early campus density.
 */
export async function fetchProfiles(filters: ProfileFilters = {}): Promise<Student[]> {
  const { limit, offset = 0 } = filters
  let dbStudents: Student[] = []

  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          profile_skills (
            skills (
              name
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (limit !== undefined) {
        query = query.range(offset, offset + limit - 1)
      }

      const { data, error } = await query

      if (!error && data) {
        dbStudents = data.map((row: any) => {
          const skills = (row.profile_skills || [])
            .map((ps: any) => ps.skills?.name)
            .filter(Boolean)
          return mapDatabaseProfileToStudent(row, skills)
        })
      }
    } catch (err) {
      console.error('[LNCT Connect] Error querying live profiles:', err)
    }
  }

  // Combine live database entries with seed profiles (avoiding ID collisions)
  const existingIds = new Set(dbStudents.map((s) => s.id))
  const appliedSeed = seedStudents.map((s) => {
    const edits = mockProfileEdits.get(s.id)
    if (!edits) return s
    return {
      ...s,
      name: edits.fullName ?? s.name,
      branch: edits.branch ?? s.branch,
      year: edits.batch ?? s.year,
      graduationYear: edits.graduationYear ?? s.graduationYear,
      bio: edits.bio ?? s.bio,
      location: edits.location ?? s.location,
      company: edits.company ?? s.company,
    }
  })

  const combined = [...dbStudents, ...appliedSeed.filter((s) => !existingIds.has(s.id))]

  // Apply directory filters
  const { query = '', branch = 'All branches', year = 'Any year', skill = 'All skills', alumni = false } = filters

  const filtered = combined.filter((student) => {
    const matchesSearch = query.trim() === '' || matchesQuery([student.name, student.branch, student.bio, student.skills], query)
    const matchesBranch = branch === 'All branches' || student.branch.toLowerCase().includes(branch.toLowerCase())
    const matchesYear = year === 'Any year' || student.year.toLowerCase().includes(year.toLowerCase())
    const matchesSkill = skill === 'All skills' || student.skills.some((s: string) => s.toLowerCase() === skill.toLowerCase())
    const matchesAlumni = !alumni || student.isAlumni

    return matchesSearch && matchesBranch && matchesYear && matchesSkill && matchesAlumni
  })

  if (limit !== undefined) {
    return filtered.slice(offset, offset + limit)
  }

  return filtered
}


/**
 * Retrieves a single student profile by ID from the database or seed store.
 */
export async function fetchProfileById(id: string): Promise<Student | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          profile_skills (
            skills (
              name
            )
          )
        `)
        .eq('id', id)
        .maybeSingle()

      if (!error && data) {
        const skills = (data.profile_skills || [])
          .map((ps: any) => ps.skills?.name)
          .filter(Boolean)
        return mapDatabaseProfileToStudent(data, skills)
      }
    } catch (err) {
      console.error('[LNCT Connect] Error querying profile by ID:', err)
    }
  }

  // Check seed profiles or current user or newly updated profile
  const found = seedStudents.find((s) => s.id === id) || (id === currentUser.id ? currentUser : null)
  const edits = mockProfileEdits.get(id)
  if (!found && !edits) return null

  const base: Student = found || {
    id,
    name: 'Student',
    initials: 'ST',
    avatar: 'warm',
    branch: 'Engineering',
    year: 'Student',
    bio: 'LNCT Campus Network Member',
    skills: ['Engineering'],
    interests: [],
    connections: 0,
    location: 'Bhopal, MP',
    role: 'student',
    isAlumni: false,
    online: true,
  }

  if (!edits) return base
  return {
    ...base,
    name: edits.fullName ?? base.name,
    branch: edits.branch ?? base.branch,
    year: edits.batch ?? base.year,
    graduationYear: edits.graduationYear ?? base.graduationYear,
    bio: edits.bio ?? base.bio,
    location: edits.location ?? base.location,
    company: edits.company ?? base.company,
  }

}

/**
 * Updates an authenticated user's own profile.
 * Non-admin members are strictly prohibited from modifying role or verification status.
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    fullName?: string
    branch?: string
    batch?: string
    graduationYear?: string
    bio?: string
    location?: string
    company?: string
    githubUrl?: string
    linkedinUrl?: string
    portfolioUrl?: string
    role?: string
    verificationStatus?: string
  },
  isAdmin: boolean = false
): Promise<{ error: Error | null; success?: boolean }> {
  // Privilege escalation guard: prohibit non-admin users from altering role or verification status
  if ((updates.role !== undefined || updates.verificationStatus !== undefined) && !isAdmin) {
    return {
      error: new Error(
        'Unauthorized: Non-admin users are prohibited from modifying platform role or verification status.'
      ),
      success: false,
    }
  }

  if (!isSupabaseConfigured) {
    const prev = mockProfileEdits.get(userId) || {}
    mockProfileEdits.set(userId, {
      ...prev,
      fullName: updates.fullName !== undefined ? updates.fullName.trim() : prev.fullName,
      branch: updates.branch !== undefined ? updates.branch.trim() : prev.branch,
      batch: updates.batch !== undefined ? updates.batch.trim() : prev.batch,
      graduationYear: updates.graduationYear !== undefined ? updates.graduationYear.trim() : prev.graduationYear,
      bio: updates.bio !== undefined ? updates.bio.trim() : prev.bio,
      location: updates.location !== undefined ? updates.location.trim() : prev.location,
      company: updates.company !== undefined ? updates.company.trim() : prev.company,
      githubUrl: updates.githubUrl !== undefined ? updates.githubUrl.trim() : prev.githubUrl,
      linkedinUrl: updates.linkedinUrl !== undefined ? updates.linkedinUrl.trim() : prev.linkedinUrl,
      portfolioUrl: updates.portfolioUrl !== undefined ? updates.portfolioUrl.trim() : prev.portfolioUrl,
    })
    return { error: null, success: true }
  }

  try {
    const payload: any = {}
    if (updates.fullName !== undefined) payload.full_name = updates.fullName.trim()
    if (updates.branch !== undefined) payload.branch = updates.branch.trim()
    if (updates.batch !== undefined) payload.batch = updates.batch.trim()
    if (updates.graduationYear !== undefined) payload.graduation_year = updates.graduationYear.trim()
    if (updates.bio !== undefined) payload.bio = updates.bio.trim()
    if (updates.location !== undefined) payload.location = updates.location.trim()
    if (updates.company !== undefined) payload.company = updates.company.trim()
    if (updates.githubUrl !== undefined) payload.github_url = updates.githubUrl.trim()
    if (updates.linkedinUrl !== undefined) payload.linkedin_url = updates.linkedinUrl.trim()
    if (updates.portfolioUrl !== undefined) payload.portfolio_url = updates.portfolioUrl.trim()
    if (isAdmin && updates.role !== undefined) payload.role = updates.role
    if (isAdmin && updates.verificationStatus !== undefined) payload.verification_status = updates.verificationStatus

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)

    return { error, success: !error }
  } catch (err: any) {
    return { error: err, success: false }
  }
}
