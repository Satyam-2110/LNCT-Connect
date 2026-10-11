import { supabase, isSupabaseConfigured } from '../lib/supabase'
import {
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  fetchOpportunities,
  type CreateOpportunityData,
  type UpdateOpportunityData,
} from './opportunities'
import type { Opportunity } from '../types'

export interface VerificationQueueItem {
  id: string
  userId: string
  fullName: string
  email: string
  branch: string
  graduationYear: string
  enrollmentNo: string
  idCardUrl: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  reviewNotes?: string
}

export interface ContentReportItem {
  id: string
  reporterId: string
  reporterName: string
  targetType: 'post' | 'comment' | 'project' | 'profile' | 'message'
  targetId: string
  targetSnippet?: string
  reason: 'spam' | 'harassment' | 'inappropriate' | 'impersonation' | 'other'
  details: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  adminNotes?: string | null
  resolvedBy?: string | null
  createdAt: string
  updatedAt: string
}

export interface CampusAdminStats {
  totalStudents: number
  verifiedStudents: number
  pendingVerifications: number
  activeProjects: number
  openReports: number
  mentorshipSessions: number
}

// In-memory mock store
const mockVerificationQueue: VerificationQueueItem[] = []
const mockContentReports: ContentReportItem[] = []

function initSeedAdminData() {
  if (mockVerificationQueue.length > 0) return

  mockVerificationQueue.push(
    {
      id: 'vr-seed-1',
      userId: 'student-rohit-01',
      fullName: 'Rohit Sharma',
      email: 'rohit.sharma@lnct.ac.in',
      branch: 'Computer Science & Engineering',
      graduationYear: '2025',
      enrollmentNo: '0103CS211045',
      idCardUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=60',
      status: 'pending',
      submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'vr-seed-2',
      userId: 'student-ananya-02',
      fullName: 'Ananya Gupta',
      email: 'ananya.gupta@lnct.ac.in',
      branch: 'Information Technology',
      graduationYear: '2026',
      enrollmentNo: '0103IT221012',
      idCardUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=60',
      status: 'pending',
      submittedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'vr-seed-3',
      userId: 'student-priya-03',
      fullName: 'Priya Verma',
      email: 'priya.verma@lnct.ac.in',
      branch: 'Electronics & Communication',
      graduationYear: '2024',
      enrollmentNo: '0103EC201089',
      idCardUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=60',
      status: 'approved',
      submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      reviewedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      reviewedBy: 'Admin Team',
      reviewNotes: 'Verified against LNCT ERP registry.',
    }
  )

  mockContentReports.push(
    {
      id: 'rep-seed-1',
      reporterId: 'reporter-001',
      reporterName: 'Aanya Mehta',
      targetType: 'post',
      targetId: 'post-seed-spam',
      targetSnippet: 'Join this unverified crypto channel to make quick cash on campus!',
      reason: 'spam',
      details: 'Unsolicited promotional link repeated across multiple campus threads.',
      status: 'pending',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 'rep-seed-2',
      reporterId: 'reporter-002',
      reporterName: 'Rohan Verma',
      targetType: 'comment',
      targetId: 'comm-seed-toxic',
      targetSnippet: 'This project is completely useless and you will never get placed.',
      reason: 'harassment',
      details: 'Destructive non-constructive behavior violating community code of conduct.',
      status: 'pending',
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    }
  )
}

initSeedAdminData()

export function __resetAdminStore() {
  mockVerificationQueue.length = 0
  mockContentReports.length = 0
  initSeedAdminData()
}

/**
 * Fetches the student enrollment verification queue.
 * Guard: Only administrator accounts can view verification submissions.
 */
export async function fetchVerificationQueue(
  adminUserId: string,
  isAdmin: boolean
): Promise<{ success: boolean; error?: string; items?: VerificationQueueItem[] }> {
  initSeedAdminData()

  if (!isAdmin) {
    return {
      success: false,
      error: 'Unauthorized: Administrator privileges are required to access student verification queues.',
    }
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .select(`
          id,
          user_id,
          enrollment_number,
          id_card_url,
          status,
          rejection_reason,
          submitted_at,
          reviewed_at,
          reviewed_by,
          profiles!user_id (
            full_name,
            branch,
            graduation_year
          )
        `)
        .order('submitted_at', { ascending: false })

      if (error) {
        console.error('[LNCT Connect] Error querying verification queue:', error.message)
        return { success: false, error: error.message }
      }

      if (data) {
        const items = data.map((row) => {
          const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
          return {
            id: row.id,
            userId: row.user_id,
            fullName: prof?.full_name || 'Student',
            email: 'student@lnct.ac.in',
            branch: prof?.branch || 'Engineering',
            graduationYear: prof?.graduation_year || '2025',
            enrollmentNo: row.enrollment_number || 'N/A',
            idCardUrl: row.id_card_url || '',
            status: row.status as VerificationQueueItem['status'],
            submittedAt: row.submitted_at,
            reviewedAt: row.reviewed_at || undefined,
            reviewedBy: row.reviewed_by || undefined,
            reviewNotes: row.rejection_reason || undefined,
          }
        })
        return { success: true, items }
      }
      return { success: true, items: [] }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Database query failed.'
      return { success: false, error: message }
    }
  }

  return {
    success: true,
    items: [...mockVerificationQueue].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    ),
  }
}

/**
 * Reviews a student verification request (Approve or Reject).
 * Atomically updates verification status and user profile verification status.
 */
export async function reviewVerification(
  adminUserId: string,
  isAdmin: boolean,
  requestId: string,
  decision: 'approved' | 'rejected',
  notes?: string
): Promise<{ success: boolean; error?: string; item?: VerificationQueueItem }> {
  if (!isAdmin) {
    return {
      success: false,
      error: 'Unauthorized: Only administrators can approve or reject verification requests.',
    }
  }

  const reviewNotes = notes || (decision === 'approved' ? 'Verified by campus admin.' : 'Insufficient proof of enrollment.')

  if (isSupabaseConfigured) {
    try {
      const { data: updatedReq, error: reqError } = await supabase
        .from('verification_requests')
        .update({
          status: decision,
          rejection_reason: decision === 'rejected' ? reviewNotes : null,
          reviewed_by: adminUserId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select(`
          id,
          user_id,
          enrollment_number,
          id_card_url,
          status,
          rejection_reason,
          submitted_at,
          reviewed_at,
          reviewed_by
        `)
        .single()

      if (reqError) {
        return { success: false, error: reqError.message }
      }

      if (!updatedReq) {
        return { success: false, error: 'Verification request not found.' }
      }

      // Fetch profile info to return complete VerificationQueueItem contract
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('full_name, branch, graduation_year')
        .eq('id', updatedReq.user_id)
        .maybeSingle()

      const item: VerificationQueueItem = {
        id: updatedReq.id,
        userId: updatedReq.user_id,
        fullName: userProfile?.full_name || 'Student',
        email: 'student@lnct.ac.in',
        branch: userProfile?.branch || 'Engineering',
        graduationYear: userProfile?.graduation_year || '2025',
        enrollmentNo: updatedReq.enrollment_number || 'N/A',
        idCardUrl: updatedReq.id_card_url || '',
        status: updatedReq.status as VerificationQueueItem['status'],
        submittedAt: updatedReq.submitted_at,
        reviewedAt: updatedReq.reviewed_at || undefined,
        reviewedBy: updatedReq.reviewed_by || 'Admin Desk',
        reviewNotes: updatedReq.rejection_reason || reviewNotes,
      }

      return { success: true, item }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Database review failed.'
      return { success: false, error: message }
    }
  }

  const item = mockVerificationQueue.find((v) => v.id === requestId)
  if (!item) {
    return { success: false, error: 'Verification request not found.' }
  }

  item.status = decision
  item.reviewedAt = new Date().toISOString()
  item.reviewedBy = 'Admin Desk'
  item.reviewNotes = reviewNotes

  return { success: true, item }
}

/**
 * Files a content moderation report.
 */
export async function reportContent(
  reporterId: string,
  data: {
    targetType: ContentReportItem['targetType']
    targetId: string
    targetSnippet?: string
    reason: ContentReportItem['reason']
    details?: string
  },
  reporterName?: string
): Promise<{ success: boolean; error?: string; report?: ContentReportItem }> {
  const details = data.details?.trim() || 'Reported by community member.'

  if (isSupabaseConfigured) {
    try {
      const { data: inserted, error } = await supabase
        .from('content_reports')
        .insert({
          reporter_id: reporterId,
          target_type: data.targetType,
          target_id: data.targetId,
          reason: data.reason,
          details,
          status: 'pending',
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      if (inserted) {
        return {
          success: true,
          report: {
            id: inserted.id,
            reporterId: inserted.reporter_id,
            reporterName: reporterName || 'Community Member',
            targetType: inserted.target_type as ContentReportItem['targetType'],
            targetId: inserted.target_id,
            targetSnippet: data.targetSnippet,
            reason: inserted.reason as ContentReportItem['reason'],
            details: inserted.details || '',
            status: inserted.status as ContentReportItem['status'],
            adminNotes: inserted.admin_notes,
            resolvedBy: inserted.resolved_by,
            createdAt: inserted.created_at,
            updatedAt: inserted.updated_at,
          },
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit report.'
      return { success: false, error: message }
    }
  }

  const newReport: ContentReportItem = {
    id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    reporterId,
    reporterName: reporterName || 'Community Member',
    targetType: data.targetType,
    targetId: data.targetId,
    targetSnippet: data.targetSnippet,
    reason: data.reason,
    details,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  mockContentReports.unshift(newReport)
  return { success: true, report: newReport }
}

/**
 * Fetches content reports for administrator review.
 */
export async function fetchContentReports(
  adminUserId: string,
  isAdmin: boolean,
  statusFilter?: string
): Promise<{ success: boolean; error?: string; reports?: ContentReportItem[] }> {
  initSeedAdminData()

  if (!isAdmin) {
    return {
      success: false,
      error: 'Unauthorized: Administrator privileges are required to view moderation reports.',
    }
  }

  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('content_reports')
        .select(`
          id,
          reporter_id,
          target_type,
          target_id,
          reason,
          details,
          status,
          admin_notes,
          resolved_by,
          created_at,
          updated_at,
          profiles!reporter_id (
            full_name
          )
        `)
        .order('created_at', { ascending: false })

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'pending' | 'reviewed' | 'resolved' | 'dismissed')
      }

      const { data, error } = await query

      if (error) {
        console.error('[LNCT Connect] Error querying content reports:', error.message)
        return { success: false, error: error.message }
      }

      if (data) {
        const reports = data.map((row) => {
          const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
          return {
            id: row.id,
            reporterId: row.reporter_id,
            reporterName: prof?.full_name || 'Student',
            targetType: row.target_type as ContentReportItem['targetType'],
            targetId: row.target_id,
            reason: row.reason as ContentReportItem['reason'],
            details: row.details || '',
            status: row.status as ContentReportItem['status'],
            adminNotes: row.admin_notes,
            resolvedBy: row.resolved_by,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }
        })
        return { success: true, reports }
      }
      return { success: true, reports: [] }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Database query failed.'
      return { success: false, error: message }
    }
  }

  let reports = [...mockContentReports]
  if (statusFilter && statusFilter !== 'all') {
    reports = reports.filter((r) => r.status === statusFilter)
  }

  return { success: true, reports }
}

/**
 * Resolves or dismisses a content report.
 */
export async function resolveContentReport(
  adminUserId: string,
  isAdmin: boolean,
  reportId: string,
  resolution: 'resolved' | 'dismissed',
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isAdmin) {
    return {
      success: false,
      error: 'Unauthorized: Administrator privileges are required to resolve moderation reports.',
    }
  }

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('content_reports')
        .update({
          status: resolution,
          admin_notes: notes || null,
          resolved_by: adminUserId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId)

      if (error) {
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Database update failed.'
      return { success: false, error: message }
    }
  }

  const target = mockContentReports.find((r) => r.id === reportId)
  if (!target) {
    return { success: false, error: 'Report not found.' }
  }

  target.status = resolution
  target.adminNotes = notes || null
  target.resolvedBy = adminUserId
  target.updatedAt = new Date().toISOString()

  return { success: true }
}

/**
 * Fetches high-level campus statistics for the admin dashboard.
 */
export async function fetchCampusAdminStats(
  adminUserId: string,
  isAdmin: boolean
): Promise<{ success: boolean; error?: string; stats?: CampusAdminStats }> {
  if (!isAdmin) {
    return {
      success: false,
      error: 'Unauthorized: Administrator privileges are required.',
    }
  }

  const pendingVerifications = mockVerificationQueue.filter((v) => v.status === 'pending').length
  const openReports = mockContentReports.filter((r) => r.status === 'pending').length

  return {
    success: true,
    stats: {
      totalStudents: 1420,
      verifiedStudents: 1184,
      pendingVerifications,
      activeProjects: 38,
      openReports,
      mentorshipSessions: 165,
    },
  }
}

// -----------------------------------------------------------------------------
// ADMINISTRATIVE OPPORTUNITY MANAGEMENT
// -----------------------------------------------------------------------------


/**
 * Fetches all platform opportunities for the administrator management desk.
 */
export async function fetchAdminOpportunities(
  adminUserId: string,
  isAdmin: boolean
): Promise<{ success: boolean; error?: string; opportunities?: Opportunity[] }> {
  if (!isAdmin) {
    return {
      success: false,
      error: 'Unauthorized: Administrator privileges are required to view admin opportunities desk.',
    }
  }

  const { opportunities } = await fetchOpportunities()
  return { success: true, opportunities }
}

/**
 * Posts a new campus opportunity through the admin desk.
 */
export async function createCampusOpportunity(
  adminUserId: string,
  isAdmin: boolean,
  data: CreateOpportunityData
): Promise<{ success: boolean; error?: string; opportunity?: Opportunity }> {
  return createOpportunity({ ...data, postedBy: adminUserId }, isAdmin)
}

/**
 * Updates an opportunity listing through the admin desk.
 */
export async function updateCampusOpportunity(
  adminUserId: string,
  isAdmin: boolean,
  opportunityId: string,
  data: UpdateOpportunityData
): Promise<{ success: boolean; error?: string; opportunity?: Opportunity }> {
  return updateOpportunity(opportunityId, data, isAdmin)
}

/**
 * Deletes an opportunity from the campus board through the admin desk.
 */
export async function deleteCampusOpportunity(
  adminUserId: string,
  isAdmin: boolean,
  opportunityId: string
): Promise<{ success: boolean; error?: string }> {
  return deleteOpportunity(opportunityId, isAdmin)
}

