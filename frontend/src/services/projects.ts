import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { projects as seedProjects } from '../data/projects'
import { matchesQuery } from '../lib/utils'
import type { Project } from '../types'

export interface ProjectApplication {
  id: string
  projectId: string
  applicantId: string
  applicant: {
    id: string
    name: string
    initials: string
    avatar: string
    branch: string
    year: string
  }
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

// In-memory mock store for local development when Supabase credentials are pending
interface MockProjectRecord {
  id: string
  creatorId: string
  creator: {
    name: string
    initials: string
    avatar: string
  }
  name: string
  description: string
  category: string
  tech: string[]
  lookingFor: string[]
  status: 'Ideation' | 'Building' | 'Launched'
  progress: number
  accent: string
  members: number
  createdAt: string
}

interface MockApplicationRecord {
  id: string
  projectId: string
  applicantId: string
  applicant: {
    id: string
    name: string
    initials: string
    avatar: string
    branch: string
    year: string
  }
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

const mockProjectsStore: MockProjectRecord[] = []
const mockApplicationsStore: MockApplicationRecord[] = []
const mockMembersStore: Set<string> = new Set() // "projectId:userId"

export interface ProjectFilters {
  query?: string
  tech?: string
  status?: string
  limit?: number
  offset?: number
}

/**
 * Fetches all campus projects, combining live database projects with seed data.
 */
export async function fetchProjects(filters: ProjectFilters = {}): Promise<Project[]> {
  const { limit, offset = 0 } = filters
  let dbProjects: Project[] = []

  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('projects')
        .select(`
          id,
          creator_id,
          name,
          description,
          category,
          tech,
          looking_for,
          status,
          progress,
          accent,
          created_at,
          profiles!creator_id (
            id,
            full_name,
            avatar_url
          ),
          project_members (
            user_id
          )
        `)
        .order('created_at', { ascending: false })

      if (limit !== undefined) {
        query = query.range(offset, offset + limit - 1)
      }

      const { data, error } = await query


      if (!error && data) {
        dbProjects = data.map((row: any) => {
          const profile = row.profiles || {}
          const nameParts = (profile.full_name || 'Builder').trim().split(' ')
          const initials =
            nameParts.length > 1
              ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
              : nameParts[0].slice(0, 2).toUpperCase()

          return {
            id: row.id,
            name: row.name,
            description: row.description,
            category: row.category,
            tech: row.tech || [],
            creator: {
              name: profile.full_name || 'Builder',
              initials,
              avatar: profile.avatar_url || 'warm',
            },
            members: Math.max(1, (row.project_members || []).length),
            lookingFor: row.looking_for || [],
            status: row.status,
            progress: row.progress || 0,
            accent: row.accent || 'from-amber-500/25 to-orange-500/5',
          }
        })
      }
    } catch (err) {
      console.error('[LNCT Connect] Error fetching projects from database:', err)
    }
  } else {
    // Offline local store mapping
    dbProjects = mockProjectsStore.map((mp) => ({
      id: mp.id,
      name: mp.name,
      description: mp.description,
      category: mp.category,
      tech: mp.tech,
      creator: mp.creator,
      members: mp.members,
      lookingFor: mp.lookingFor,
      status: mp.status,
      progress: mp.progress,
      accent: mp.accent,
    }))
  }

  // Combine live database entries with seed projects (avoiding duplicate IDs)
  const existingIds = new Set(dbProjects.map((p) => p.id))
  const combined = [...dbProjects, ...seedProjects.filter((sp) => !existingIds.has(sp.id))]

  // Apply filters
  const { query = '', tech = 'All technology', status = 'All status' } = filters

  const filtered = combined.filter((project) => {
    const matchesSearch =
      query.trim() === '' ||
      matchesQuery(
        [project.name, project.description, project.category, project.tech, project.lookingFor],
        query
      )
    const matchesTech = tech === 'All technology' || project.tech.includes(tech)
    const matchesStatus = status === 'All status' || project.status === status

    return matchesSearch && matchesTech && matchesStatus
  })

  if (limit !== undefined) {
    return filtered.slice(offset, offset + limit)
  }

  return filtered
}


/**
 * Creates and publishes a new project to the campus network.
 * Strictly verifies progressive access prerequisites.
 */
export async function createProject(
  creatorId: string,
  creatorProfile: {
    name: string
    initials: string
    avatar?: string
  },
  projectData: {
    name: string
    description: string
    category?: string
    tech: string[]
    lookingFor: string[]
    status: 'Ideation' | 'Building' | 'Launched'
    progress?: number
  },
  isVerified: boolean
): Promise<{ error: Error | null; project?: Project }> {
  const trimmedName = projectData.name.trim()
  const trimmedDesc = projectData.description.trim()

  if (!trimmedName || !trimmedDesc) {
    return { error: new Error('Project name and description are required.') }
  }

  // Progressive access check
  if (!isVerified) {
    return {
      error: new Error('Student verification required. Please verify your student ID before publishing projects.'),
    }
  }

  const category = projectData.category || 'Campus Tech'
  const progress = projectData.progress ?? 20
  const accent = 'from-amber-500/25 to-orange-500/5'

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          creator_id: creatorId,
          name: trimmedName,
          description: trimmedDesc,
          category,
          tech: projectData.tech,
          looking_for: projectData.lookingFor,
          status: projectData.status,
          progress,
          accent,
        })
        .select()
        .single()

      if (error) return { error }

      // Register creator as owner in project_members
      await supabase.from('project_members').insert({
        project_id: data.id,
        user_id: creatorId,
        role: 'owner',
      })

      const newProj: Project = {
        id: data.id,
        name: trimmedName,
        description: trimmedDesc,
        category,
        tech: projectData.tech,
        creator: {
          name: creatorProfile.name,
          initials: creatorProfile.initials,
          avatar: creatorProfile.avatar || 'warm',
        },
        members: 1,
        lookingFor: projectData.lookingFor,
        status: projectData.status,
        progress,
        accent,
      }

      return { error: null, project: newProj }
    } catch (err: any) {
      return { error: err }
    }
  }

  // Local offline fallback
  const mockId = `mock-proj-${Date.now()}`
  const mockRecord: MockProjectRecord = {
    id: mockId,
    creatorId,
    creator: {
      name: creatorProfile.name,
      initials: creatorProfile.initials,
      avatar: creatorProfile.avatar || 'warm',
    },
    name: trimmedName,
    description: trimmedDesc,
    category,
    tech: projectData.tech,
    lookingFor: projectData.lookingFor,
    status: projectData.status,
    progress,
    accent,
    members: 1,
    createdAt: new Date().toISOString(),
  }

  mockProjectsStore.unshift(mockRecord)
  mockMembersStore.add(`${mockId}:${creatorId}`)

  const createdProject: Project = {
    id: mockId,
    name: trimmedName,
    description: trimmedDesc,
    category,
    tech: projectData.tech,
    creator: mockRecord.creator,
    members: 1,
    lookingFor: projectData.lookingFor,
    status: projectData.status,
    progress,
    accent,
  }

  return { error: null, project: createdProject }
}

/**
 * Checks the status of a user's join application for a project.
 */
export async function getUserApplicationStatus(
  projectId: string,
  userId: string | null | undefined
): Promise<'none' | 'pending' | 'accepted' | 'rejected'> {
  if (!userId) return 'none'

  if (isSupabaseConfigured) {
    try {
      // Check if already a member
      const { data: member } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .maybeSingle()

      if (member) return 'accepted'

      // Check application status
      const { data: app } = await supabase
        .from('project_applications')
        .select('status')
        .eq('project_id', projectId)
        .eq('applicant_id', userId)
        .maybeSingle()

      if (app) return app.status as any
    } catch (err) {
      console.error('[LNCT Connect] Error checking project application status:', err)
    }
  } else {
    if (mockMembersStore.has(`${projectId}:${userId}`)) return 'accepted'
    const found = mockApplicationsStore.find(
      (a) => a.projectId === projectId && a.applicantId === userId
    )
    if (found) return found.status
  }

  return 'none'
}

/**
 * Submits an application to join a project team.
 * Strictly verifies progressive access and prevents self-applications.
 */
export async function applyToProject(
  projectId: string,
  applicantId: string,
  applicantProfile: {
    name: string
    initials: string
    avatar?: string
    branch?: string
    year?: string
  },
  message: string = '',
  isVerified: boolean
): Promise<{ error: Error | null; success?: boolean }> {
  // Progressive access check
  if (!isVerified) {
    return {
      error: new Error('Student verification required. Please verify your student ID before joining teams.'),
    }
  }

  if (isSupabaseConfigured) {
    try {
      // Ensure not applying to own project
      const { data: project } = await supabase
        .from('projects')
        .select('creator_id')
        .eq('id', projectId)
        .maybeSingle()

      if (project && project.creator_id === applicantId) {
        return { error: new Error('You cannot apply to join your own project.') }
      }

      const { error } = await supabase.from('project_applications').insert({
        project_id: projectId,
        applicant_id: applicantId,
        message: message.trim(),
        status: 'pending',
      })

      if (error) return { error }
      return { error: null, success: true }
    } catch (err: any) {
      return { error: err }
    }
  }

  // Local offline fallback
  const existingProject = mockProjectsStore.find((p) => p.id === projectId)
  if (existingProject && existingProject.creatorId === applicantId) {
    return { error: new Error('You cannot apply to join your own project.') }
  }

  mockApplicationsStore.push({
    id: `mock-app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    projectId,
    applicantId,
    applicant: {
      id: applicantId,
      name: applicantProfile.name,
      initials: applicantProfile.initials,
      avatar: applicantProfile.avatar || 'warm',
      branch: applicantProfile.branch || 'Engineering',
      year: applicantProfile.year || 'Student',
    },
    message: message.trim(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  })

  return { error: null, success: true }
}

/**
 * Retrieves all pending applications for a project (only accessible by creator).
 */
export async function fetchProjectApplications(
  projectId: string
): Promise<ProjectApplication[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('project_applications')
        .select(`
          id,
          project_id,
          applicant_id,
          message,
          status,
          created_at,
          profiles!applicant_id (
            id,
            full_name,
            avatar_url,
            branch,
            batch
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[LNCT Connect] Error fetching project applications:', error.message)
        return []
      }

      if (data) {
        return data.map((row: any) => {
          const profile = row.profiles || {}
          const nameParts = (profile.full_name || 'Applicant').trim().split(' ')
          const initials =
            nameParts.length > 1
              ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
              : nameParts[0].slice(0, 2).toUpperCase()

          return {
            id: row.id,
            projectId: row.project_id,
            applicantId: row.applicant_id,
            applicant: {
              id: row.applicant_id,
              name: profile.full_name || 'Applicant',
              initials,
              avatar: profile.avatar_url || 'warm',
              branch: profile.branch || 'Engineering',
              year: profile.batch || 'Student',
            },
            message: row.message || '',
            status: row.status,
            createdAt: row.created_at,
          }
        })
      }
      return []
    } catch (err) {
      console.error('[LNCT Connect] Unexpected error fetching project applications:', err)
      return []
    }
  }

  // Local offline fallback
  return mockApplicationsStore.filter((a) => a.projectId === projectId)
}

/**
 * Responds to a team join application (Accept or Decline).
 */
export async function respondToApplication(
  applicationId: string,
  accept: boolean,
  projectId: string,
  applicantId: string
): Promise<{ error: Error | null }> {
  if (isSupabaseConfigured) {
    try {
      const newStatus = accept ? 'accepted' : 'rejected'
      const { error } = await supabase
        .from('project_applications')
        .update({ status: newStatus })
        .eq('id', applicationId)

      if (error) return { error }

      if (accept) {
        // Add to project members
        await supabase.from('project_members').insert({
          project_id: projectId,
          user_id: applicantId,
          role: 'member',
        })
      }

      return { error: null }
    } catch (err: any) {
      return { error: err }
    }
  }

  // Local offline fallback
  const app = mockApplicationsStore.find((a) => a.id === applicationId)
  if (app) {
    app.status = accept ? 'accepted' : 'rejected'
    if (accept) {
      mockMembersStore.add(`${projectId}:${applicantId}`)
      const proj = mockProjectsStore.find((p) => p.id === projectId)
      if (proj) proj.members += 1
    }
  }

  return { error: null }
}

/**
 * Deletes a project.
 */
export async function deleteProject(
  projectId: string,
  creatorId: string
): Promise<{ error: Error | null }> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('creator_id', creatorId)

      return { error }
    } catch (err: any) {
      return { error: err }
    }
  }

  const idx = mockProjectsStore.findIndex((p) => p.id === projectId && p.creatorId === creatorId)
  if (idx !== -1) {
    mockProjectsStore.splice(idx, 1)
  }
  return { error: null }
}

/**
 * Reset in-memory project stores (used for test isolation).
 */
export function __resetProjectsStore(): void {
  mockProjectsStore.length = 0
  mockApplicationsStore.length = 0
  mockMembersStore.clear()
}
