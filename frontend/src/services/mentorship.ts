import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { mentors as seedMentors } from '../data/mentors'
import { matchesQuery } from '../lib/utils'
import type { Mentor } from '../types'

export interface MentorshipRequest {
  id: string
  mentorId: string
  studentId: string
  student: {
    id: string
    name: string
    initials: string
    avatar: string
    branch: string
    year: string
  }
  topic: string
  goalsNote: string
  preferredTime: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  mentorNotes?: string | null
  createdAt: string
  updatedAt: string
}

export interface MentorshipFilters {
  query?: string
  topic?: string
  limit?: number
  offset?: number
}

interface MockMentorProfile {
  id: string
  name: string
  initials: string
  avatar: string
  branch: string
  year: string
  graduationYear?: string
  bio: string
  skills: string[]
  interests: string[]
  connections: number
  location: string
  role?: string
  company?: string
  isAlumni?: boolean
  experience: string
  topics: string[]
  availability: string
  isActive: boolean
}

interface MockMentorshipRequestRecord {
  id: string
  mentorId: string
  studentId: string
  student: {
    id: string
    name: string
    initials: string
    avatar: string
    branch: string
    year: string
  }
  topic: string
  goalsNote: string
  preferredTime: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  mentorNotes?: string | null
  createdAt: string
  updatedAt: string
}

const mockMentorProfilesStore: MockMentorProfile[] = []
const mockMentorshipRequestsStore: MockMentorshipRequestRecord[] = []

/**
 * Resets the in-memory mock store for test isolation.
 */
export function __resetMentorshipStore() {
  mockMentorProfilesStore.length = 0
  mockMentorshipRequestsStore.length = 0
}

/**
 * Fetches all available mentors, combining database mentor profiles with curated seed mentors.
 */
export async function fetchMentors(filters: MentorshipFilters = {}): Promise<Mentor[]> {
  const { limit, offset = 0 } = filters
  let dbMentors: Mentor[] = []

  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('mentor_profiles')
        .select(`
          id,
          experience,
          topics,
          availability,
          is_active,
          profiles!id (
            id,
            full_name,
            avatar_url,
            branch,
            batch,
            graduation_year,
            bio,
            location,
            company,
            is_alumni,
            role
          )
        `)
        .eq('is_active', true)

      if (limit !== undefined) {
        query = query.range(offset, offset + limit - 1)
      }

      const { data, error } = await query

      if (!error && data) {
        dbMentors = data
          .filter((row) => row.profiles)
          .map((row) => {
            const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
            const name = prof?.full_name || 'Anonymous Mentor'
            const initials = (name as string)
              .split(' ')
              .map((p: string) => p[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)

            return {
              id: row.id,
              name,
              initials,
              avatar: prof?.avatar_url || 'from-indigo-500 to-purple-600',
              branch: prof?.branch || 'Engineering',
              year: prof?.batch || 'Senior',
              graduationYear: prof?.graduation_year || '2024',
              bio: prof?.bio || 'Passionate about mentoring and technology.',
              skills: [],
              interests: ['Mentorship'],
              connections: 50,
              location: prof?.location || 'Bhopal, India',
              role: prof?.role || 'Mentor',
              company: prof?.company || 'LNCT Campus',
              isAlumni: prof?.is_alumni ?? true,
              experience: row.experience,
              topics: row.topics || [],
              availability: row.availability || '2 slots this month',
            }
          })
      }
    } catch {
      // Graceful fallback to mock and seed data
    }
  }

  // Include in-memory registered mentors
  const mockMentors: Mentor[] = mockMentorProfilesStore
    .filter((m) => m.isActive)
    .map((m) => ({
      id: m.id,
      name: m.name,
      initials: m.initials,
      avatar: m.avatar,
      branch: m.branch,
      year: m.year,
      graduationYear: m.graduationYear,
      bio: m.bio,
      skills: m.skills,
      interests: m.interests,
      connections: m.connections,
      location: m.location,
      role: m.role,
      company: m.company,
      isAlumni: m.isAlumni,
      experience: m.experience,
      topics: m.topics,
      availability: m.availability,
    }))

  // Deduplicate by ID: live DB > in-memory mock > seed mentors
  const seenIds = new Set<string>()
  const combined: Mentor[] = []

  for (const mentor of [...dbMentors, ...mockMentors, ...seedMentors]) {
    if (!seenIds.has(mentor.id)) {
      seenIds.add(mentor.id)
      combined.push(mentor)
    }
  }

  const filtered = combined.filter((mentor) => {
    if (filters.topic && !mentor.topics.some((t) => t.toLowerCase().includes(filters.topic!.toLowerCase()))) {
      return false
    }

    if (filters.query) {
      return matchesQuery(
        [
          mentor.name,
          mentor.company,
          mentor.role,
          mentor.branch,
          mentor.skills,
          mentor.topics,
          mentor.bio,
        ],
        filters.query
      )
    }

    return true
  })

  if (limit !== undefined) {
    return filtered.slice(offset, offset + limit)
  }

  return filtered
}


/**
 * Registers or updates a mentor profile.
 * Progressive access: verified students/alumni only.
 */
export async function registerMentorProfile(
  userId: string,
  data: {
    name?: string
    avatar?: string
    experience: string
    topics: string[]
    availability?: string
    role?: string
    company?: string
    bio?: string
    branch?: string
  },
  isVerified: boolean
): Promise<{ success: boolean; error?: string; mentor?: Mentor }> {
  if (!isVerified) {
    return {
      success: false,
      error: 'Institutional ID verification is required to register as a campus mentor.',
    }
  }

  if (!data.experience || data.experience.trim().length === 0) {
    return { success: false, error: 'Experience description is required.' }
  }

  if (!data.topics || data.topics.length === 0) {
    return { success: false, error: 'At least one advisory topic is required.' }
  }

  const availability = data.availability || '2 slots this month'

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('mentor_profiles').upsert({
        id: userId,
        experience: data.experience.trim(),
        topics: data.topics,
        availability,
        is_active: true,
      })

      if (error) {
        return { success: false, error: error.message }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Database registration failed.'
      return { success: false, error: message }
    }
  }

  // Store in in-memory store
  const name = data.name || 'LNCT Member'
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const mentorProfile: MockMentorProfile = {
    id: userId,
    name,
    initials,
    avatar: data.avatar || 'from-indigo-500 to-purple-600',
    branch: data.branch || 'Computer Science',
    year: 'Alumni',
    graduationYear: '2023',
    bio: data.bio || 'Alumni mentor on LNCT Connect.',
    skills: data.topics,
    interests: ['Mentorship'],
    connections: 120,
    location: 'Bhopal, India',
    role: data.role || 'Software Engineer',
    company: data.company || 'Tech Industry',
    isAlumni: true,
    experience: data.experience.trim(),
    topics: data.topics,
    availability,
    isActive: true,
  }

  const existingIdx = mockMentorProfilesStore.findIndex((m) => m.id === userId)
  if (existingIdx >= 0) {
    mockMentorProfilesStore[existingIdx] = mentorProfile
  } else {
    mockMentorProfilesStore.unshift(mentorProfile)
  }

  return { success: true, mentor: mentorProfile }
}

/**
 * Requests a mentorship session with a mentor.
 * Progressive access: verified students only.
 * Self-mentorship prevention: cannot book session with yourself.
 */
export async function requestMentorshipSession(
  mentorId: string,
  studentId: string,
  studentProfile: {
    name: string
    initials: string
    avatar: string
    branch: string
    year: string
  },
  data: {
    topic: string
    goalsNote: string
    preferredTime?: string
  },
  isVerified: boolean
): Promise<{ success: boolean; error?: string; request?: MentorshipRequest }> {
  // Progressive access check
  if (!isVerified) {
    return {
      success: false,
      error: 'Institutional ID verification is required to book a mentorship session.',
    }
  }

  // Self-mentorship guard
  if (mentorId === studentId) {
    return {
      success: false,
      error: 'You cannot request mentorship from yourself.',
    }
  }

  if (!data.topic || data.topic.trim().length === 0) {
    return { success: false, error: 'Please select or provide an advisory topic.' }
  }

  if (!data.goalsNote || data.goalsNote.trim().length < 5) {
    return { success: false, error: 'Please describe what you are building and what advice you are looking for (at least 5 characters).' }
  }

  const preferredTime = data.preferredTime || 'Flexible / Weekend'

  if (isSupabaseConfigured) {
    try {
      const { data: inserted, error } = await supabase
        .from('mentorship_requests')
        .insert({
          mentor_id: mentorId,
          student_id: studentId,
          topic: data.topic.trim(),
          goals_note: data.goalsNote.trim(),
          preferred_time: preferredTime,
          status: 'pending',
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      if (inserted) {
        const req: MentorshipRequest = {
          id: inserted.id,
          mentorId: inserted.mentor_id,
          studentId: inserted.student_id,
          student: {
            id: studentId,
            name: studentProfile.name,
            initials: studentProfile.initials,
            avatar: studentProfile.avatar,
            branch: studentProfile.branch,
            year: studentProfile.year,
          },
          topic: inserted.topic,
          goalsNote: inserted.goals_note,
          preferredTime: inserted.preferred_time || preferredTime,
          status: inserted.status as MentorshipRequest['status'],
          mentorNotes: inserted.mentor_notes,
          createdAt: inserted.created_at,
          updatedAt: inserted.updated_at,
        }
        return { success: true, request: req }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Database request failed.'
      return { success: false, error: message }
    }
  }

  // Fallback / Mock record
  const newReq: MockMentorshipRequestRecord = {
    id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    mentorId,
    studentId,
    student: {
      id: studentId,
      name: studentProfile.name,
      initials: studentProfile.initials,
      avatar: studentProfile.avatar,
      branch: studentProfile.branch,
      year: studentProfile.year,
    },
    topic: data.topic.trim(),
    goalsNote: data.goalsNote.trim(),
    preferredTime,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  mockMentorshipRequestsStore.unshift(newReq)
  return { success: true, request: newReq }
}

/**
 * Fetches mentorship requests either received as a mentor or sent as a student.
 */
export async function fetchMentorshipRequests(
  userId: string,
  role: 'mentor' | 'student'
): Promise<MentorshipRequest[]> {
  if (isSupabaseConfigured) {
    try {
      const filterColumn = role === 'mentor' ? 'mentor_id' : 'student_id'
      const { data, error } = await supabase
        .from('mentorship_requests')
        .select(`
          id,
          mentor_id,
          student_id,
          topic,
          goals_note,
          preferred_time,
          status,
          mentor_notes,
          created_at,
          updated_at,
          student:profiles!student_id (
            id,
            full_name,
            avatar_url,
            branch,
            batch
          )
        `)
        .eq(filterColumn, userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[LNCT Connect] Error fetching mentorship requests:', error.message)
        return []
      }

      if (data) {
        return data.map((row) => {
          const prof = Array.isArray(row.student) ? row.student[0] : row.student
          const name = prof?.full_name || 'Student'
          const initials = (name as string)
            .split(' ')
            .map((p: string) => p[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)

          return {
            id: row.id,
            mentorId: row.mentor_id,
            studentId: row.student_id,
            student: {
              id: row.student_id,
              name,
              initials,
              avatar: prof?.avatar_url || 'from-orange-400 to-amber-600',
              branch: prof?.branch || 'Engineering',
              year: prof?.batch || 'Student',
            },
            topic: row.topic,
            goalsNote: row.goals_note,
            preferredTime: row.preferred_time || 'Flexible',
            status: row.status as MentorshipRequest['status'],
            mentorNotes: row.mentor_notes,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }
        })
      }
      return []
    } catch (err) {
      console.error('[LNCT Connect] Unexpected error fetching mentorship requests:', err)
      return []
    }
  }

  // Return mock results
  const matches = mockMentorshipRequestsStore.filter((r) =>
    role === 'mentor' ? r.mentorId === userId : r.studentId === userId
  )

  return matches.map((r) => ({ ...r }))
}

/**
 * Mentors respond to incoming session requests by accepting or rejecting them.
 */
export async function respondToMentorshipRequest(
  requestId: string,
  mentorId: string,
  status: 'accepted' | 'rejected',
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('mentorship_requests')
        .update({
          status,
          mentor_notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('mentor_id', mentorId)

      if (error) {
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Update failed.'
      return { success: false, error: message }
    }
  }

  const req = mockMentorshipRequestsStore.find((r) => r.id === requestId)
  if (!req) {
    return { success: false, error: 'Mentorship request not found.' }
  }

  if (req.mentorId !== mentorId) {
    return { success: false, error: 'Unauthorized: only the targeted mentor can respond to this request.' }
  }

  req.status = status
  req.mentorNotes = notes || null
  req.updatedAt = new Date().toISOString()

  return { success: true }
}
