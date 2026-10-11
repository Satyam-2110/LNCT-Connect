import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { opportunities as seedOpportunities } from '../data/opportunities'
import { matchesQuery } from '../lib/utils'
import type { Opportunity } from '../types'

// Local in-memory stores for offline development & unit testing
const mockSavedOpportunities: Set<string> = new Set() // "userId:opportunityId"
let mockOpportunitiesStore: Opportunity[] = [...seedOpportunities]

export function __resetOpportunitiesStore() {
  mockSavedOpportunities.clear()
  mockOpportunitiesStore = [...seedOpportunities]
}

export interface OpportunityFilters {
  query?: string
  category?: string
  savedOnly?: boolean
  currentUserId?: string | null
}

export interface CreateOpportunityData {
  title: string
  organization: string
  logo?: string
  type: Opportunity['type']
  location: string
  deadline: string
  skills?: string[]
  description: string
  featured?: boolean
  postedBy?: string
}

export interface UpdateOpportunityData {
  title?: string
  organization?: string
  logo?: string
  type?: Opportunity['type']
  location?: string
  deadline?: string
  skills?: string[]
  description?: string
  featured?: boolean
}

/**
 * Fetches campus opportunities combining live database records with seed listings.
 * On live database error, returns empty list rather than masking with mock fallbacks.
 */
export async function fetchOpportunities(
  filters: OpportunityFilters = {}
): Promise<{ opportunities: Opportunity[]; savedIds: string[] }> {
  const { query = '', category = 'All', savedOnly = false, currentUserId } = filters
  let dbOpportunities: Opportunity[] = []
  let savedIds: string[] = []

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[LNCT Connect] Error fetching opportunities from database:', error.message)
        return { opportunities: [], savedIds: [] }
      }

      if (data) {
        dbOpportunities = data.map((row) => ({
          id: row.id,
          title: row.title,
          organization: row.organization,
          logo: row.logo || row.organization.slice(0, 1).toUpperCase(),
          type: row.type,
          location: row.location,
          deadline: row.deadline,
          skills: row.skills || [],
          description: row.description,
          featured: row.featured || false,
        }))
      }

      if (currentUserId) {
        const { data: bmarks } = await supabase
          .from('opportunity_bookmarks')
          .select('opportunity_id')
          .eq('user_id', currentUserId)

        if (bmarks) {
          savedIds = bmarks.map((b) => b.opportunity_id)
        }
      }
    } catch (err) {
      console.error('[LNCT Connect] Unexpected error querying opportunities:', err)
      return { opportunities: [], savedIds: [] }
    }
  } else {
    // Offline local store
    if (currentUserId) {
      for (const item of mockSavedOpportunities) {
        const [uId, oId] = item.split(':')
        if (uId === currentUserId) savedIds.push(oId)
      }
    }
  }

  // Combine live database opportunities with seed listings or local store
  const combined = isSupabaseConfigured
    ? [
        ...dbOpportunities,
        ...seedOpportunities.filter((so) => !dbOpportunities.some((d) => d.id === so.id)),
      ]
    : mockOpportunitiesStore


  // Apply filters
  const filtered = combined.filter((opp) => {
    const matchesSearch =
      query.trim() === '' ||
      matchesQuery([opp.title, opp.organization, opp.skills, opp.description], query)
    const matchesCategory = category === 'All' || opp.type === category
    const matchesSaved = !savedOnly || savedIds.includes(opp.id)

    return matchesSearch && matchesCategory && matchesSaved
  })

  return { opportunities: filtered, savedIds }
}

/**
 * Creates a new campus opportunity listing.
 * Strict authorization guard: Only administrators or authorized faculty/staff can post.
 */
export async function createOpportunity(
  data: CreateOpportunityData,
  isAdmin: boolean = false
): Promise<{ success: boolean; error?: string; opportunity?: Opportunity }> {
  if (!isAdmin) {
    return {
      success: false,
      error: 'Unauthorized: Administrator privileges are required to publish campus opportunities.',
    }
  }

  const title = data.title.trim()
  const organization = data.organization.trim()
  const location = data.location.trim()
  const deadline = data.deadline.trim()
  const description = data.description.trim()

  if (!title || !organization || !location || !deadline || !description) {
    return {
      success: false,
      error: 'All required opportunity fields must be filled.',
    }
  }

  const logo = data.logo?.trim() || organization.slice(0, 1).toUpperCase()
  const skills = data.skills || []
  const featured = data.featured || false

  if (isSupabaseConfigured) {
    try {
      const { data: inserted, error } = await supabase
        .from('opportunities')
        .insert({
          title,
          organization,
          logo,
          type: data.type,
          location,
          deadline,
          skills,
          description,
          featured,
          posted_by: data.postedBy || null,
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      if (inserted) {
        const opp: Opportunity = {
          id: inserted.id,
          title: inserted.title,
          organization: inserted.organization,
          logo: inserted.logo || logo,
          type: inserted.type,
          location: inserted.location,
          deadline: inserted.deadline,
          skills: inserted.skills || [],
          description: inserted.description,
          featured: inserted.featured || false,
        }
        return { success: true, opportunity: opp }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Database insertion failed.'
      return { success: false, error: message }
    }
  }

  const newOpp: Opportunity = {
    id: `opp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    organization,
    logo,
    type: data.type,
    location,
    deadline,
    skills,
    description,
    featured,
  }

  mockOpportunitiesStore.unshift(newOpp)
  return { success: true, opportunity: newOpp }
}

/**
 * Updates an existing campus opportunity.
 * Strict authorization guard: Only administrators can modify opportunity listings.
 */
export async function updateOpportunity(
  opportunityId: string,
  data: UpdateOpportunityData,
  isAdmin: boolean = false
): Promise<{ success: boolean; error?: string; opportunity?: Opportunity }> {
  if (!isAdmin) {
    return {
      success: false,
      error: 'Unauthorized: Administrator privileges are required to modify campus opportunities.',
    }
  }

  if (isSupabaseConfigured) {
    try {
      const payload: {
        title?: string
        organization?: string
        logo?: string | null
        type?: Opportunity['type']
        location?: string
        deadline?: string
        skills?: string[]
        description?: string
        featured?: boolean
      } = {}

      if (data.title !== undefined) payload.title = data.title.trim()
      if (data.organization !== undefined) payload.organization = data.organization.trim()
      if (data.logo !== undefined) payload.logo = data.logo.trim()
      if (data.type !== undefined) payload.type = data.type
      if (data.location !== undefined) payload.location = data.location.trim()
      if (data.deadline !== undefined) payload.deadline = data.deadline.trim()
      if (data.skills !== undefined) payload.skills = data.skills
      if (data.description !== undefined) payload.description = data.description.trim()
      if (data.featured !== undefined) payload.featured = data.featured

      const { data: updated, error } = await supabase
        .from('opportunities')
        .update(payload)
        .eq('id', opportunityId)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      if (updated) {
        const opp: Opportunity = {
          id: updated.id,
          title: updated.title,
          organization: updated.organization,
          logo: updated.logo || updated.organization.slice(0, 1).toUpperCase(),
          type: updated.type,
          location: updated.location,
          deadline: updated.deadline,
          skills: updated.skills || [],
          description: updated.description,
          featured: updated.featured || false,
        }
        return { success: true, opportunity: opp }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Database update failed.'
      return { success: false, error: message }
    }
  }

  const oppIndex = mockOpportunitiesStore.findIndex((o) => o.id === opportunityId)
  if (oppIndex === -1) {
    return { success: false, error: 'Opportunity not found.' }
  }

  const existing = mockOpportunitiesStore[oppIndex]
  const updatedOpp: Opportunity = {
    ...existing,
    title: data.title !== undefined ? data.title.trim() : existing.title,
    organization: data.organization !== undefined ? data.organization.trim() : existing.organization,
    logo: data.logo !== undefined ? data.logo.trim() : existing.logo,
    type: data.type !== undefined ? data.type : existing.type,
    location: data.location !== undefined ? data.location.trim() : existing.location,
    deadline: data.deadline !== undefined ? data.deadline.trim() : existing.deadline,
    skills: data.skills !== undefined ? data.skills : existing.skills,
    description: data.description !== undefined ? data.description.trim() : existing.description,
    featured: data.featured !== undefined ? data.featured : existing.featured,
  }

  mockOpportunitiesStore[oppIndex] = updatedOpp
  return { success: true, opportunity: updatedOpp }
}

/**
 * Deletes an opportunity from the campus board.
 * Strict authorization guard: Only administrators can delete opportunity listings.
 */
export async function deleteOpportunity(
  opportunityId: string,
  isAdmin: boolean = false
): Promise<{ success: boolean; error?: string }> {
  if (!isAdmin) {
    return {
      success: false,
      error: 'Unauthorized: Administrator privileges are required to delete campus opportunities.',
    }
  }

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', opportunityId)

      if (error) {
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Database deletion failed.'
      return { success: false, error: message }
    }
  }

  const initialLen = mockOpportunitiesStore.length
  mockOpportunitiesStore = mockOpportunitiesStore.filter((o) => o.id !== opportunityId)
  if (mockOpportunitiesStore.length === initialLen) {
    return { success: false, error: 'Opportunity not found.' }
  }

  return { success: true }
}

/**
 * Toggles a saved bookmark on an opportunity.
 */
export async function toggleOpportunityBookmark(
  opportunityId: string,
  userId: string
): Promise<{ error: Error | null; saved?: boolean }> {
  if (isSupabaseConfigured) {
    try {
      const { data: existing, error: checkErr } = await supabase
        .from('opportunity_bookmarks')
        .select('id')
        .eq('opportunity_id', opportunityId)
        .eq('user_id', userId)
        .maybeSingle()

      if (checkErr) return { error: checkErr }

      if (existing) {
        const { error } = await supabase
          .from('opportunity_bookmarks')
          .delete()
          .eq('id', existing.id)

        if (error) return { error }
        return { error: null, saved: false }
      } else {
        const { error } = await supabase
          .from('opportunity_bookmarks')
          .insert({
            opportunity_id: opportunityId,
            user_id: userId,
          })

        if (error) return { error }
        return { error: null, saved: true }
      }
    } catch (err: any) {
      return { error: err }
    }
  }

  // Local offline fallback
  const key = `${userId}:${opportunityId}`
  if (mockSavedOpportunities.has(key)) {
    mockSavedOpportunities.delete(key)
    return { error: null, saved: false }
  } else {
    mockSavedOpportunities.add(key)
    return { error: null, saved: true }
  }
}
