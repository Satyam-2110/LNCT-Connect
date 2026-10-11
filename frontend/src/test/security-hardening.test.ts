import { describe, it, expect, beforeEach } from 'vitest'
import {
  fetchVerificationQueue,
  reviewVerification,
  reportContent,
  fetchContentReports,
  resolveContentReport,
  fetchCampusAdminStats,
  __resetAdminStore,
} from '../services/admin'
import {
  sendConnectionRequest,
  respondToConnectionRequest,
  getConnectionStatus,
  __resetConnectionsStore,
  __getMockConnections,
} from '../services/connections'
import {
  sendMessage,
  updateMessage,
  updateConversationParticipants,
  __resetMessagingStore,
} from '../services/messaging'
import {
  createNotification,
  __resetNotificationsStore,
} from '../services/notifications'
import { updateUserProfile } from '../services/profiles'

describe('Phase 15: Administration, Moderation & Security Hardening', () => {
  const adminUser = {
    id: 'admin-super-001',
    name: 'Campus Administrator',
    role: 'admin',
    isAdmin: true,
  }

  const normalStudent = {
    id: 'student-regular-002',
    name: 'Vikram Singh',
    role: 'student',
    isAdmin: false,
  }

  beforeEach(() => {
    __resetAdminStore()
  })

  describe('Administrative Verification Queue & Authorization', () => {
    it('strictly blocks non-admin users from accessing verification queues', async () => {
      const res = await fetchVerificationQueue(normalStudent.id, normalStudent.isAdmin)

      expect(res.success).toBe(false)
      expect(res.error).toMatch(/unauthorized|administrator privileges/i)
      expect(res.items).toBeUndefined()
    })

    it('allows verified admin to retrieve pending student verification submissions', async () => {
      const res = await fetchVerificationQueue(adminUser.id, adminUser.isAdmin)

      expect(res.success).toBe(true)
      expect(res.items).toBeDefined()
      expect(res.items!.length).toBeGreaterThan(0)
      expect(res.items!.some((i) => i.status === 'pending')).toBe(true)
    })

    it('blocks non-admin users from approving or rejecting verification requests', async () => {
      const res = await reviewVerification(
        normalStudent.id,
        normalStudent.isAdmin,
        'vr-seed-1',
        'approved'
      )

      expect(res.success).toBe(false)
      expect(res.error).toMatch(/unauthorized|only administrators/i)
      expect(res.item).toBeUndefined()
    })

    it('allows admin to approve a student verification request', async () => {
      const res = await reviewVerification(
        adminUser.id,
        adminUser.isAdmin,
        'vr-seed-1',
        'approved',
        'Enrollment verified against LNCT College Records.'
      )

      expect(res.success).toBe(true)
      expect(res.item).toBeDefined()
      expect(res.item?.status).toBe('approved')
      expect(res.item?.reviewNotes).toMatch(/verified against lnct/i)
    })

    it('allows admin to reject a verification request with explanatory notes', async () => {
      const res = await reviewVerification(
        adminUser.id,
        adminUser.isAdmin,
        'vr-seed-2',
        'rejected',
        'Uploaded ID document was illegible; please re-upload clear photo.'
      )

      expect(res.success).toBe(true)
      expect(res.item).toBeDefined()
      expect(res.item?.status).toBe('rejected')
      expect(res.item?.reviewNotes).toMatch(/illegible/i)
    })
  })

  describe('Community Content Moderation & Reporting', () => {
    it('allows authenticated community members to file content reports', async () => {
      const res = await reportContent(
        normalStudent.id,
        {
          targetType: 'post',
          targetId: 'post-test-flagged-001',
          targetSnippet: 'Suspicious exam paper leak message...',
          reason: 'inappropriate',
          details: 'Claiming to sell mid-term question papers on campus.',
        },
        normalStudent.name
      )

      expect(res.success).toBe(true)
      expect(res.report).toBeDefined()
      expect(res.report?.status).toBe('pending')
      expect(res.report?.reporterId).toBe(normalStudent.id)
      expect(res.report?.reason).toBe('inappropriate')
    })

    it('blocks non-admin users from viewing global moderation reports', async () => {
      const res = await fetchContentReports(normalStudent.id, normalStudent.isAdmin)

      expect(res.success).toBe(false)
      expect(res.error).toMatch(/unauthorized/i)
      expect(res.reports).toBeUndefined()
    })

    it('allows administrators to view flagged content reports', async () => {
      const res = await fetchContentReports(adminUser.id, adminUser.isAdmin)

      expect(res.success).toBe(true)
      expect(res.reports).toBeDefined()
      expect(res.reports!.length).toBeGreaterThan(0)
    })

    it('blocks non-admin users from resolving or dismissing moderation reports', async () => {
      const res = await resolveContentReport(
        normalStudent.id,
        normalStudent.isAdmin,
        'rep-seed-1',
        'resolved'
      )

      expect(res.success).toBe(false)
      expect(res.error).toMatch(/unauthorized/i)
    })

    it('allows administrators to resolve a report with audit notes', async () => {
      const res = await resolveContentReport(
        adminUser.id,
        adminUser.isAdmin,
        'rep-seed-1',
        'resolved',
        'Removed promotional spam link and issued warning to poster.'
      )

      expect(res.success).toBe(true)

      const reports = await fetchContentReports(adminUser.id, adminUser.isAdmin)
      const target = reports.reports?.find((r) => r.id === 'rep-seed-1')
      expect(target?.status).toBe('resolved')
      expect(target?.adminNotes).toMatch(/removed promotional spam/i)
    })

    it('allows administrators to dismiss invalid reports', async () => {
      const res = await resolveContentReport(
        adminUser.id,
        adminUser.isAdmin,
        'rep-seed-2',
        'dismissed',
        'Reviewed context; comment does not violate policy.'
      )

      expect(res.success).toBe(true)
    })
  })

  describe('Security Hardening & Privilege Isolation', () => {
    it('blocks non-admin users from querying campus administrative metrics', async () => {
      const res = await fetchCampusAdminStats(normalStudent.id, normalStudent.isAdmin)

      expect(res.success).toBe(false)
      expect(res.error).toMatch(/unauthorized/i)
      expect(res.stats).toBeUndefined()
    })

    it('allows administrators to query campus metrics', async () => {
      const res = await fetchCampusAdminStats(adminUser.id, adminUser.isAdmin)

      expect(res.success).toBe(true)
      expect(res.stats).toBeDefined()
      expect(res.stats?.totalStudents).toBeGreaterThan(0)
      expect(res.stats?.verifiedStudents).toBeGreaterThan(0)
    })
  })
})

describe('Phase 16: Database Security & RLS Hardening (Negative Security Tests)', () => {
  const alice = { id: 'alice-student-001', name: 'Alice Verma', role: 'student', isVerified: true }
  const bob = { id: 'bob-student-002', name: 'Bob Sharma', role: 'student', isVerified: true }
  const charlie = { id: 'charlie-student-003', name: 'Charlie Patel', role: 'student', isVerified: true }

  beforeEach(() => {
    __resetConnectionsStore()
    __resetMessagingStore()
    __resetNotificationsStore()
  })

  describe('1. Connection Request Authorization & Self-Acceptance Prohibited', () => {
    it('strictly blocks requesters from self-accepting their own connection request', async () => {
      // Alice sends request to Bob
      const sendRes = await sendConnectionRequest(alice.id, bob.id, alice.isVerified)
      expect(sendRes.success).toBe(true)

      const connections = __getMockConnections()
      const connectionId = connections.keys().next().value as string
      expect(connectionId).toBeDefined()

      // Alice (the requester) maliciously attempts to accept her own request
      const unauthorizedAttempt = await respondToConnectionRequest(connectionId, true, alice.id)
      expect(unauthorizedAttempt.error).not.toBeNull()
      expect(unauthorizedAttempt.error?.message).toMatch(/unauthorized|only the recipient/i)

      // Verify connection state has NOT transitioned to accepted
      const aliceStatus = await getConnectionStatus(alice.id, bob.id)
      expect(aliceStatus).toBe('pending_sent')

      // Bob (the legitimate recipient) accepts the request
      const legitimateAccept = await respondToConnectionRequest(connectionId, true, bob.id)
      expect(legitimateAccept.error).toBeNull()
      expect(legitimateAccept.success).toBe(true)

      // Verify connection is now accepted
      const updatedStatus = await getConnectionStatus(alice.id, bob.id)
      expect(updatedStatus).toBe('accepted')
    })

    it('strictly blocks unauthenticated connection responses', async () => {
      await sendConnectionRequest(alice.id, bob.id, alice.isVerified)
      const connectionId = __getMockConnections().keys().next().value as string

      const unauthenticatedAttempt = await respondToConnectionRequest(connectionId, true, undefined)
      expect(unauthenticatedAttempt.error).not.toBeNull()
      expect(unauthenticatedAttempt.error?.message).toMatch(/authentication required/i)
    })

    it('strictly blocks unrelated third-party users from accepting a connection request', async () => {
      await sendConnectionRequest(alice.id, bob.id, alice.isVerified)
      const connectionId = __getMockConnections().keys().next().value as string

      // Charlie (unrelated third party) attempts to accept Alice's request to Bob
      const thirdPartyAttempt = await respondToConnectionRequest(connectionId, true, charlie.id)
      expect(thirdPartyAttempt.error).not.toBeNull()
      expect(thirdPartyAttempt.error?.message).toMatch(/unauthorized|only the recipient/i)
    })
  })

  describe('2. Connection Deduplication & Bilateral Conflict Prevention', () => {
    it('blocks reciprocal/reverse connection requests while a request is already pending', async () => {
      // Alice sends request to Bob
      const req1 = await sendConnectionRequest(alice.id, bob.id, true)
      expect(req1.success).toBe(true)

      // Bob tries to send request to Alice while one is already pending
      const req2 = await sendConnectionRequest(bob.id, alice.id, true)
      expect(req2.error).not.toBeNull()
      expect(req2.error?.message).toMatch(/already pending/i)
    })

    it('blocks duplicate connection requests in both directions once already accepted', async () => {
      await sendConnectionRequest(alice.id, bob.id, true)
      const connectionId = __getMockConnections().keys().next().value as string
      await respondToConnectionRequest(connectionId, true, bob.id)

      // Alice tries to request again
      const dup1 = await sendConnectionRequest(alice.id, bob.id, true)
      expect(dup1.error).not.toBeNull()
      expect(dup1.error?.message).toMatch(/already connected/i)

      // Bob tries to request again in reverse
      const dup2 = await sendConnectionRequest(bob.id, alice.id, true)
      expect(dup2.error).not.toBeNull()
      expect(dup2.error?.message).toMatch(/already connected/i)
    })
  })

  describe('3. Message Sender & Content Spoofing Prevention', () => {
    it('strictly prohibits altering message content post-creation', async () => {
      const sendRes = await sendMessage('conv-seed-1', alice.id, 'Original message text', true)
      expect(sendRes.success).toBe(true)
      const msgId = sendRes.message!.id

      // Malicious attempt to forge or mutate the message text
      const tamperAttempt = await updateMessage(msgId, alice.id, {
        content: 'Forged modified text claiming to be original.',
      })

      expect(tamperAttempt.success).toBe(false)
      expect(tamperAttempt.error).toMatch(/content cannot be modified/i)
    })

    it('strictly prohibits altering message sender post-creation', async () => {
      const sendRes = await sendMessage('conv-seed-1', alice.id, 'Hello Bob!', true)
      expect(sendRes.success).toBe(true)
      const msgId = sendRes.message!.id

      // Malicious attempt to spoof sender attribution
      const tamperAttempt = await updateMessage(msgId, alice.id, {
        senderId: charlie.id,
      })

      expect(tamperAttempt.success).toBe(false)
      expect(tamperAttempt.error).toMatch(/sender cannot be modified/i)
    })

    it('permits updating isRead flag only on messages', async () => {
      const sendRes = await sendMessage('conv-seed-1', alice.id, 'Hello Bob!', true)
      expect(sendRes.success).toBe(true)
      const msgId = sendRes.message!.id

      const readUpdate = await updateMessage(msgId, bob.id, { isRead: true })
      expect(readUpdate.success).toBe(true)
      expect(readUpdate.error).toBeUndefined()
    })
  })

  describe('4. Profile Privilege Escalation Guard', () => {
    it('strictly blocks non-admin users from self-elevating their platform role', async () => {
      const escalateRole = await updateUserProfile(
        alice.id,
        {
          role: 'admin',
        },
        false // non-admin caller
      )

      expect(escalateRole.error).not.toBeNull()
      expect(escalateRole.error?.message).toMatch(/unauthorized|prohibited.*role/i)
    })

    it('strictly blocks non-admin users from self-verifying account status', async () => {
      const escalateVerification = await updateUserProfile(
        alice.id,
        {
          verificationStatus: 'verified',
        },
        false // non-admin caller
      )

      expect(escalateVerification.error).not.toBeNull()
      expect(escalateVerification.error?.message).toMatch(/unauthorized|prohibited.*verification/i)
    })

    it('permits authorized campus administrators to update student roles', async () => {
      const adminUpdate = await updateUserProfile(
        alice.id,
        {
          role: 'mentor',
        },
        true // authorized admin caller
      )

      expect(adminUpdate.error).toBeNull()
      expect(adminUpdate.success).toBe(true)
    })
  })

  describe('5. Notification Actor Spoofing Guard', () => {
    it('strictly blocks inserting notifications with a spoofed actor ID', async () => {
      // Alice attempts to issue a notification impersonating Campus Administrator
      const spoofAttempt = await createNotification(
        {
          recipientId: bob.id,
          actorId: 'admin-super-001', // Spoofed actor!
          type: 'message',
          title: 'Administrative Warning',
          message: 'Your account has received a disciplinary notice.',
        },
        alice.id // Authenticated caller is Alice
      )

      expect(spoofAttempt.success).toBe(false)
      expect(spoofAttempt.error).toMatch(/unauthorized|spoofed actor/i)
      expect(spoofAttempt.notification).toBeUndefined()
    })

    it('allows inserting notifications where actor ID matches the authenticated caller', async () => {
      const legitimateNotif = await createNotification(
        {
          recipientId: bob.id,
          actorId: alice.id,
          type: 'reaction',
          title: 'Alice reacted to your post',
          message: 'Alice liked your campus update.',
        },
        alice.id // Authenticated caller matches actorId
      )

      expect(legitimateNotif.success).toBe(true)
      expect(legitimateNotif.notification).toBeDefined()
      expect(legitimateNotif.notification?.actorId).toBe(alice.id)
    })
  })

  describe('6. Conversation Participant Immutability Guard', () => {
    it('strictly blocks modifying conversation participants post-creation', async () => {
      const hijackAttempt = await updateConversationParticipants(
        'conv-seed-1',
        alice.id,
        alice.id,
        'malicious-attacker-007'
      )

      expect(hijackAttempt.success).toBe(false)
      expect(hijackAttempt.error).toMatch(/participants cannot be altered/i)
    })
  })
})

