import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { fetchProfileById } from './profiles'
import type { Student } from '../types'

export type ConnectionState = 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'self'

export interface PendingRequest {
  id: string
  requesterId: string
  requester: Student
  createdAt: string
}

// In-memory mock store for local offline testing when Supabase is unconfigured
const mockConnections: Map<string, { id: string; requesterId: string; receiverId: string; status: string; createdAt: string }> = new Map()

/**
 * Calculates current connection relationship between the active user and target student.
 */
export async function getConnectionStatus(
  currentUserId: string | null | undefined,
  targetUserId: string
): Promise<ConnectionState> {
  if (!currentUserId) return 'none'
  if (currentUserId === targetUserId) return 'self'

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .or(
          `and(requester_id.eq.${currentUserId},receiver_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},receiver_id.eq.${currentUserId})`
        )
        .maybeSingle()

      if (!error && data) {
        if (data.status === 'accepted') return 'accepted'
        if (data.status === 'pending') {
          return data.requester_id === currentUserId ? 'pending_sent' : 'pending_received'
        }
      }
    } catch (err) {
      console.error('[LNCT Connect] Error checking connection status:', err)
    }
  } else {
    // Offline dev mode check
    for (const conn of mockConnections.values()) {
      if (conn.requesterId === currentUserId && conn.receiverId === targetUserId) {
        return conn.status === 'accepted' ? 'accepted' : 'pending_sent'
      }
      if (conn.requesterId === targetUserId && conn.receiverId === currentUserId) {
        return conn.status === 'accepted' ? 'accepted' : 'pending_received'
      }
    }
  }

  return 'none'
}

/**
 * Reset mock connections store for isolated test suites.
 */
export function __resetConnectionsStore() {
  mockConnections.clear()
}

/**
 * Returns mock connections map for testing inspection.
 */
export function __getMockConnections() {
  return mockConnections
}

/**
 * Sends a new connection request, strictly checking verification prerequisites
 * and preventing duplicate / reciprocal connection requests.
 */
export async function sendConnectionRequest(
  requesterId: string,
  receiverId: string,
  isVerified: boolean
): Promise<{ error: Error | null; success?: boolean }> {
  if (requesterId === receiverId) {
    return { error: new Error('You cannot send a connection request to yourself.') }
  }

  // Progressive access enforcement: Only verified users can send connection requests
  if (!isVerified) {
    return {
      error: new Error(
        'Student verification required. Please verify your student ID before connecting with peers.'
      ),
    }
  }

  if (isSupabaseConfigured) {
    try {
      // Check for bidirectional existing connection
      const { data: existing } = await supabase
        .from('connections')
        .select('id, requester_id, receiver_id, status')
        .or(
          `and(requester_id.eq.${requesterId},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${requesterId})`
        )
        .maybeSingle()

      if (existing) {
        if (existing.status === 'accepted') {
          return { error: new Error('You are already connected with this student.') }
        }
        return { error: new Error('A connection request is already pending between you and this student.') }
      }

      const { error } = await supabase.from('connections').insert({
        requester_id: requesterId,
        receiver_id: receiverId,
        status: 'pending',
      })

      if (error) {
        if (error.code === '23505') {
          return { error: new Error('A connection request is already pending between you and this student.') }
        }
        return { error }
      }
      return { error: null, success: true }
    } catch (err: any) {
      return { error: err }
    }
  }

  // Local offline fallback: bilateral deduplication check
  for (const conn of mockConnections.values()) {
    if (
      (conn.requesterId === requesterId && conn.receiverId === receiverId) ||
      (conn.requesterId === receiverId && conn.receiverId === requesterId)
    ) {
      if (conn.status === 'accepted') {
        return { error: new Error('You are already connected with this student.') }
      }
      return { error: new Error('A connection request is already pending between you and this student.') }
    }
  }

  const mockId = `mock-conn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  mockConnections.set(mockId, {
    id: mockId,
    requesterId,
    receiverId,
    status: 'pending',
    createdAt: new Date().toISOString(),
  })
  return { error: null, success: true }
}

/**
 * Responds to an incoming connection request (accept or decline).
 * Strictly requires recipient authorization to prevent requester self-acceptance.
 */
export async function respondToConnectionRequest(
  connectionId: string,
  accept: boolean,
  currentUserId?: string
): Promise<{ error: Error | null; success?: boolean }> {
  if (!currentUserId) {
    return {
      error: new Error('Authentication required to respond to connection request.'),
      success: false,
    }
  }

  if (isSupabaseConfigured) {
    try {
      const { data: conn, error: fetchErr } = await supabase
        .from('connections')
        .select('id, requester_id, receiver_id, status')
        .eq('id', connectionId)
        .maybeSingle()

      if (fetchErr || !conn) {
        return { error: fetchErr || new Error('Connection request not found.'), success: false }
      }

      if (conn.receiver_id !== currentUserId) {
        return {
          error: new Error('Unauthorized: Only the recipient can accept or reject a connection request.'),
          success: false,
        }
      }

      if (accept) {
        const { error } = await supabase
          .from('connections')
          .update({ status: 'accepted' })
          .eq('id', connectionId)
          .eq('receiver_id', currentUserId)
        return { error, success: !error }
      } else {
        const { error } = await supabase
          .from('connections')
          .delete()
          .eq('id', connectionId)
          .eq('receiver_id', currentUserId)
        return { error, success: !error }
      }
    } catch (err: any) {
      return { error: err, success: false }
    }
  }

  // Local offline fallback
  const conn = mockConnections.get(connectionId)
  if (!conn) {
    return { error: new Error('Connection request not found.'), success: false }
  }

  if (conn.receiverId !== currentUserId) {
    return {
      error: new Error('Unauthorized: Only the recipient can accept or reject a connection request.'),
      success: false,
    }
  }

  if (accept) {
    conn.status = 'accepted'
  } else {
    mockConnections.delete(connectionId)
  }
  return { error: null, success: true }
}

/**
 * Fetches all pending connection requests awaiting the specified user's review.
 */
export async function fetchPendingRequests(userId: string): Promise<PendingRequest[]> {
  const requests: PendingRequest[] = []

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('connections')
        .select('id, requester_id, created_at')
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (!error && data) {
        for (const item of data) {
          const profile = await fetchProfileById(item.requester_id)
          if (profile) {
            requests.push({
              id: item.id,
              requesterId: item.requester_id,
              requester: profile,
              createdAt: item.created_at,
            })
          }
        }
      }
    } catch (err) {
      console.error('[LNCT Connect] Error fetching pending connection requests:', err)
    }
  } else {
    // Offline dev mode check
    for (const [id, conn] of mockConnections.entries()) {
      if (conn.receiverId === userId && conn.status === 'pending') {
        const profile = await fetchProfileById(conn.requesterId)
        if (profile) {
          requests.push({
            id,
            requesterId: conn.requesterId,
            requester: profile,
            createdAt: conn.createdAt,
          })
        }
      }
    }
  }

  return requests
}

/**
 * Removes an existing connection or cancels a pending request.
 */
export async function removeConnection(
  currentUserId: string,
  targetUserId: string
): Promise<{ error: Error | null }> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .or(
          `and(requester_id.eq.${currentUserId},receiver_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},receiver_id.eq.${currentUserId})`
        )
      return { error }
    } catch (err: any) {
      return { error: err }
    }
  }

  for (const [id, conn] of mockConnections.entries()) {
    if (
      (conn.requesterId === currentUserId && conn.receiverId === targetUserId) ||
      (conn.requesterId === targetUserId && conn.receiverId === currentUserId)
    ) {
      mockConnections.delete(id)
      break
    }
  }

  return { error: null }
}
