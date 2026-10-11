import { describe, it, expect, beforeEach, vi } from 'vitest'
import migrationSql from '../../../backend/supabase/migrations/0010_admin_opportunities_rls.sql?raw'
import {
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  fetchOpportunities,
  __resetOpportunitiesStore,
} from '../services/opportunities'
import {
  fetchAdminOpportunities,
  createCampusOpportunity,
  updateCampusOpportunity,
  deleteCampusOpportunity,
} from '../services/admin'
import {
  subscribeToMessages,
  sendMessage,
  __clearMessageSubscribers,
  __resetConversationsStore,
} from '../services/messaging'
import {
  subscribeToNotifications,
  createNotification,
  __clearNotificationSubscribers,
  __resetNotificationsStore,
} from '../services/notifications'
import {
  updateUserProfile,
  fetchProfileById,
  getMockProfileEdits,
  __clearMockProfileEdits,
} from '../services/profiles'

describe('Phase 19: Functionality, Admin & Realtime Polish', () => {
  beforeEach(() => {
    __resetOpportunitiesStore()
    __clearMessageSubscribers()
    __resetConversationsStore()
    __clearNotificationSubscribers()
    __resetNotificationsStore()
    __clearMockProfileEdits()
  })

  describe('1. Migration 0010: Admin Opportunities RLS', () => {
    it('defines UPDATE and DELETE policies restricted to administrators', () => {
      expect(migrationSql).toContain('CREATE POLICY "Admins can update opportunities"')
      expect(migrationSql).toContain('CREATE POLICY "Admins can delete opportunities"')
      expect(migrationSql).toContain("role = 'admin'")
      expect(migrationSql).toContain('ON public.opportunities')
    })
  })

  describe('2. Admin Opportunity Management CRUD & Security Guards', () => {
    it('blocks non-admin users from creating opportunities', async () => {
      const res = await createOpportunity(
        {
          title: 'Unauthorized Intern',
          organization: 'Fake Org',
          type: 'Internship',
          location: 'Bhopal',
          deadline: 'Tomorrow',
          description: 'Hacking campus board',
        },
        false // isAdmin = false
      )

      expect(res.success).toBe(false)
      expect(res.error).toMatch(/Administrator privileges are required/)
      expect(res.opportunity).toBeUndefined()
    })

    it('allows administrators to create valid campus opportunities', async () => {
      const res = await createOpportunity(
        {
          title: 'AI Research Fellowship',
          organization: 'LNCT AI Labs',
          type: 'Internship',
          location: 'LNCT Bhopal Campus',
          deadline: 'Nov 30, 2026',
          skills: ['PyTorch', 'Transformers', 'Python'],
          description: 'Prestigious student fellowship building foundation models.',
          featured: true,
        },
        true // isAdmin = true
      )

      expect(res.success).toBe(true)
      expect(res.opportunity).toBeDefined()
      expect(res.opportunity?.title).toBe('AI Research Fellowship')
      expect(res.opportunity?.organization).toBe('LNCT AI Labs')
      expect(res.opportunity?.skills).toContain('PyTorch')
      expect(res.opportunity?.featured).toBe(true)
    })

    it('validates required fields on opportunity creation', async () => {
      const res = await createOpportunity(
        {
          title: '',
          organization: 'LNCT Lab',
          type: 'Internship',
          location: '',
          deadline: '',
          description: '',
        },
        true
      )

      expect(res.success).toBe(false)
      expect(res.error).toMatch(/All required opportunity fields must be filled/)
    })

    it('blocks non-admin users from modifying existing opportunities', async () => {
      const res = await updateOpportunity(
        'hackverse',
        { title: 'Defaced Hackathon' },
        false // isAdmin = false
      )

      expect(res.success).toBe(false)
      expect(res.error).toMatch(/Administrator privileges are required/)
    })

    it('allows administrators to update existing opportunities', async () => {
      const res = await updateOpportunity(
        'hackverse',
        {
          title: 'HackVerse Central India 2026',
          location: 'Main Auditorium, LNCT Bhopal',
          featured: true,
        },
        true // isAdmin = true
      )

      expect(res.success).toBe(true)
      expect(res.opportunity?.title).toBe('HackVerse Central India 2026')
      expect(res.opportunity?.location).toBe('Main Auditorium, LNCT Bhopal')
      expect(res.opportunity?.featured).toBe(true)
    })

    it('blocks non-admin users from deleting opportunities', async () => {
      const res = await deleteOpportunity('hackverse', false)
      expect(res.success).toBe(false)
      expect(res.error).toMatch(/Administrator privileges are required/)
    })

    it('allows administrators to delete opportunities and reflects deletion in catalog', async () => {
      const delRes = await deleteOpportunity('hackverse', true)
      expect(delRes.success).toBe(true)

      const { opportunities } = await fetchOpportunities()
      expect(opportunities.some((o) => o.id === 'hackverse')).toBe(false)
    })

    it('handles admin opportunity desk wrapper functions in admin service', async () => {
      // Non-admin check
      const authCheck = await fetchAdminOpportunities('student-001', false)
      expect(authCheck.success).toBe(false)
      expect(authCheck.error).toMatch(/Administrator privileges are required/)

      // Admin check
      const adminDesk = await fetchAdminOpportunities('admin-user-01', true)
      expect(adminDesk.success).toBe(true)
      expect(adminDesk.opportunities?.length).toBeGreaterThan(0)

      // Admin wrapper create
      const created = await createCampusOpportunity('admin-user-01', true, {
        title: 'Quantum Computing Hackathon',
        organization: 'LNCT Quantum Club',
        type: 'Hackathon',
        location: 'Lab 402',
        deadline: 'Dec 15, 2026',
        description: 'First annual campus quantum hackathon.',
      })
      expect(created.success).toBe(true)
      expect(created.opportunity?.title).toBe('Quantum Computing Hackathon')

      // Admin wrapper update
      const updated = await updateCampusOpportunity('admin-user-01', true, created.opportunity!.id, {
        deadline: 'Dec 20, 2026',
      })
      expect(updated.success).toBe(true)
      expect(updated.opportunity?.deadline).toBe('Dec 20, 2026')

      // Admin wrapper delete
      const deleted = await deleteCampusOpportunity('admin-user-01', true, created.opportunity!.id)
      expect(deleted.success).toBe(true)
    })
  })

  describe('3. Realtime Channel Subscriptions', () => {
    it('receives live message dispatches via subscribeToMessages', async () => {
      const convId = 'conv-test-realtime'
      const receivedMessages: any[] = []

      const unsubscribe = subscribeToMessages(convId, (msg) => {
        receivedMessages.push(msg)
      })

      // Send a message to this conversation
      const sendRes = await sendMessage(convId, 'sender-student-1', 'Hey from Realtime!', true)
      expect(sendRes.success).toBe(true)

      // Verify callback was triggered
      expect(receivedMessages.length).toBe(1)
      expect(receivedMessages[0].content).toBe('Hey from Realtime!')
      expect(receivedMessages[0].conversationId).toBe(convId)

      // Unsubscribe and verify no more messages are received
      unsubscribe()

      await sendMessage(convId, 'sender-student-1', 'Second message after teardown', true)
      expect(receivedMessages.length).toBe(1)
    })

    it('isolates real-time message streams by conversation ID', async () => {
      const convA = 'conv-stream-A'
      const convB = 'conv-stream-B'
      const messagesA: any[] = []
      const messagesB: any[] = []

      const unsubA = subscribeToMessages(convA, (m) => messagesA.push(m))
      const unsubB = subscribeToMessages(convB, (m) => messagesB.push(m))

      await sendMessage(convA, 'user-1', 'Message for Conv A', true)
      await sendMessage(convB, 'user-2', 'Message for Conv B', true)

      expect(messagesA.length).toBe(1)
      expect(messagesA[0].content).toBe('Message for Conv A')

      expect(messagesB.length).toBe(1)
      expect(messagesB[0].content).toBe('Message for Conv B')

      unsubA()
      unsubB()
    })

    it('receives live notifications via subscribeToNotifications', async () => {
      const userId = 'student-recipient-007'
      const receivedNotifs: any[] = []

      const unsubscribe = subscribeToNotifications(userId, (n) => {
        receivedNotifs.push(n)
      })

      // Dispatch a notification
      const createRes = await createNotification({
        recipientId: userId,
        type: 'connection_request',
        title: 'New Connection Request',
        message: 'Aarav Patel wants to connect.',
      })
      expect(createRes.success).toBe(true)

      expect(receivedNotifs.length).toBe(1)
      expect(receivedNotifs[0].title).toBe('New Connection Request')
      expect(receivedNotifs[0].recipientId).toBe(userId)

      // Unsubscribe
      unsubscribe()

      await createNotification({
        recipientId: userId,
        type: 'message',
        title: 'New Message',
        message: 'You have a message.',
      })
      expect(receivedNotifs.length).toBe(1)
    })
  })

  describe('4. Profile Edit Offline Synchronization & Escalation Guard', () => {
    it('synchronizes offline profile edits and returns updated profile state', async () => {
      const targetUserId = '1' // Aanya Mehta in seed

      const updateRes = await updateUserProfile(targetUserId, {
        fullName: 'Aanya Mehta-Sharma',
        bio: 'Senior Lead Architect at LNCT Robotics Club.',
        company: 'Robotics Lead @ LNCT',
      })

      expect(updateRes.success).toBe(true)
      expect(updateRes.error).toBeNull()

      // Verify edits were recorded in mock store
      const edits = getMockProfileEdits(targetUserId)
      expect(edits).toBeDefined()
      expect(edits?.fullName).toBe('Aanya Mehta-Sharma')
      expect(edits?.bio).toBe('Senior Lead Architect at LNCT Robotics Club.')

      // Verify fetchProfileById surfaces the synchronized edits
      const updatedProfile = await fetchProfileById(targetUserId)
      expect(updatedProfile).not.toBeNull()
      expect(updatedProfile?.name).toBe('Aanya Mehta-Sharma')
      expect(updatedProfile?.bio).toBe('Senior Lead Architect at LNCT Robotics Club.')
      expect(updatedProfile?.company).toBe('Robotics Lead @ LNCT')
    })

    it('strictly prevents non-admin users from escalating role or verification status during profile update', async () => {
      const attackRes = await updateUserProfile(
        'student-attacker',
        {
          fullName: 'Attacker Student',
          role: 'admin',
          verificationStatus: 'verified',
        },
        false // isAdmin = false
      )

      expect(attackRes.success).toBe(false)
      expect(attackRes.error?.message).toMatch(/Unauthorized: Non-admin users are prohibited/)
      expect(getMockProfileEdits('student-attacker')).toBeUndefined()
    })
  })
})

