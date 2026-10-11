import { describe, it, expect } from 'vitest'
import { mapDatabaseProfileToStudent } from '../services/profiles'
import {
  sendConnectionRequest,
  respondToConnectionRequest,
  getConnectionStatus,
} from '../services/connections'

describe('Profiles Service & Mapping Tests', () => {
  it('correctly maps PostgreSQL database profiles to frontend student contract', () => {
    const dbRow = {
      id: 'uuid-101',
      full_name: 'Priya Sharma',
      avatar_url: 'https://example.com/avatar.jpg',
      branch: 'Computer Science',
      batch: '4th Year (2021-2025)',
      graduation_year: '2025',
      bio: 'Competitive programmer and open source contributor.',
      location: 'Bhopal, MP',
      company: 'TCS Digital',
      role: 'student',
      is_alumni: true,
      verification_status: 'verified',
    }

    const student = mapDatabaseProfileToStudent(dbRow, ['C++', 'Algorithms', 'React'])

    expect(student.id).toBe('uuid-101')
    expect(student.name).toBe('Priya Sharma')
    expect(student.initials).toBe('PS')
    expect(student.branch).toBe('Computer Science')
    expect(student.isAlumni).toBe(true)
    expect(student.skills).toEqual(['C++', 'Algorithms', 'React'])
  })

  it('generates single-word initials gracefully', () => {
    const dbRow = {
      id: 'uuid-102',
      full_name: 'Antigravity',
      avatar_url: '',
      branch: 'AI',
      batch: '2026',
    }

    const student = mapDatabaseProfileToStudent(dbRow, [])
    expect(student.initials).toBe('AN')
  })
})

describe('Peer Connection Lifecycle & Security Rules', () => {
  it('strictly prevents a student from connecting with themselves', async () => {
    const result = await sendConnectionRequest('user-1', 'user-1', true)
    expect(result.error).not.toBeNull()
    expect(result.error?.message).toContain('cannot send a connection request to yourself')
  })

  it('rejects connection write operations from unverified accounts', async () => {
    const unverifiedAttempt = await sendConnectionRequest('user-1', 'user-2', false)
    expect(unverifiedAttempt.error).not.toBeNull()
    expect(unverifiedAttempt.error?.message).toContain('Student verification required')
  })

  it('allows verified accounts to send connection requests', async () => {
    const verifiedAttempt = await sendConnectionRequest('user-1', 'user-2', true)
    expect(verifiedAttempt.error).toBeNull()
    expect(verifiedAttempt.success).toBe(true)
  })

  it('correctly identifies self connection state', async () => {
    const status = await getConnectionStatus('student-a', 'student-a')
    expect(status).toBe('self')
  })

  it('correctly handles pending sent and accepted states', async () => {
    // Send request from user-A to user-B
    await sendConnectionRequest('student-a', 'student-b', true)

    // Check status from requester's perspective
    const sentStatus = await getConnectionStatus('student-a', 'student-b')
    expect(sentStatus).toBe('pending_sent')

    // Check status from receiver's perspective
    const receivedStatus = await getConnectionStatus('student-b', 'student-a')
    expect(receivedStatus).toBe('pending_received')
  })
})
