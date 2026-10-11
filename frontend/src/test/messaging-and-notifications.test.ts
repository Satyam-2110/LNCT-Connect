import { describe, it, expect, beforeEach } from 'vitest'
import {
  fetchConversations,
  getOrCreateConversation,
  fetchMessages,
  sendMessage,
  markConversationRead,
  __resetMessagingStore,
} from '../services/messaging'
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
  __resetNotificationsStore,
} from '../services/notifications'

describe('Phase 14: Private Messaging & Realtime Notifications', () => {
  const verifiedUserOne = {
    id: 'user-alice-001',
    name: 'Alice Johnson',
    initials: 'AJ',
    avatar: 'from-blue-500 to-indigo-600',
    role: 'Frontend Dev',
    company: 'LNCT CS',
  }

  const verifiedUserTwo = {
    id: 'user-bob-002',
    name: 'Bob Sharma',
    initials: 'BS',
    avatar: 'from-amber-400 to-orange-500',
    role: 'Backend Dev',
    company: 'LNCT IT',
  }

  beforeEach(() => {
    __resetMessagingStore()
    __resetNotificationsStore()
  })

  describe('Progressive Access & Self-Conversation Prevention', () => {
    it('blocks unverified students from starting a direct conversation with descriptive error', async () => {
      const res = await getOrCreateConversation(
        'unverified-user-1',
        verifiedUserTwo.id,
        verifiedUserTwo,
        false // isVerified = false
      )

      expect(res.success).toBe(false)
      expect(res.error).toMatch(/verification is required/i)
      expect(res.conversation).toBeUndefined()
    })

    it('blocks unverified students from sending direct messages', async () => {
      const res = await sendMessage(
        'conv-seed-1',
        'unverified-user-1',
        'Hey, are you free for a code review?',
        false // isVerified = false
      )

      expect(res.success).toBe(false)
      expect(res.error).toMatch(/verification is required/i)
      expect(res.message).toBeUndefined()
    })

    it('strictly prevents users from starting a direct conversation with themselves', async () => {
      const res = await getOrCreateConversation(
        verifiedUserOne.id,
        verifiedUserOne.id, // same ID
        verifiedUserOne,
        true // isVerified = true
      )

      expect(res.success).toBe(false)
      expect(res.error).toMatch(/cannot start a direct conversation with yourself/i)
      expect(res.conversation).toBeUndefined()
    })
  })

  describe('Conversation Creation & Message Dispatch', () => {
    it('allows verified students to create a conversation between distinct users', async () => {
      const res = await getOrCreateConversation(
        verifiedUserOne.id,
        verifiedUserTwo.id,
        verifiedUserTwo,
        true
      )

      expect(res.success).toBe(true)
      expect(res.conversation).toBeDefined()
      expect(res.conversation?.participantOne).toBe(verifiedUserOne.id)
      expect(res.conversation?.participantTwo).toBe(verifiedUserTwo.id)
      expect(res.conversation?.otherParticipant.name).toBe(verifiedUserTwo.name)
    })

    it('retrieves existing conversation without duplicating threads', async () => {
      const first = await getOrCreateConversation(
        verifiedUserOne.id,
        verifiedUserTwo.id,
        verifiedUserTwo,
        true
      )

      const second = await getOrCreateConversation(
        verifiedUserTwo.id,
        verifiedUserOne.id,
        verifiedUserOne,
        true
      )

      expect(first.conversation?.id).toBe(second.conversation?.id)
    })

    it('rejects sending empty or whitespace-only messages', async () => {
      const created = await getOrCreateConversation(
        verifiedUserOne.id,
        verifiedUserTwo.id,
        verifiedUserTwo,
        true
      )
      const convId = created.conversation!.id

      const res = await sendMessage(convId, verifiedUserOne.id, '    ', true)
      expect(res.success).toBe(false)
      expect(res.error).toMatch(/cannot be empty/i)
    })

    it('persists sent messages, updates conversation last message preview, and returns chronological order', async () => {
      const created = await getOrCreateConversation(
        verifiedUserOne.id,
        verifiedUserTwo.id,
        verifiedUserTwo,
        true
      )
      const convId = created.conversation!.id

      // Send first message
      const msg1 = await sendMessage(
        convId,
        verifiedUserOne.id,
        'Hey Bob! Want to collaborate on the hackathon project?',
        true
      )
      expect(msg1.success).toBe(true)
      expect(msg1.message?.content).toBe('Hey Bob! Want to collaborate on the hackathon project?')
      expect(msg1.message?.mine).toBe(true)

      // Send second message from Bob
      const msg2 = await sendMessage(
        convId,
        verifiedUserTwo.id,
        'Count me in! What tech stack are you thinking?',
        true
      )
      expect(msg2.success).toBe(true)

      // Fetch messages for Alice
      const aliceMessages = await fetchMessages(convId, verifiedUserOne.id)
      expect(aliceMessages.length).toBe(2)
      expect(aliceMessages[0].content).toBe('Hey Bob! Want to collaborate on the hackathon project?')
      expect(aliceMessages[0].mine).toBe(true)
      expect(aliceMessages[1].content).toBe('Count me in! What tech stack are you thinking?')
      expect(aliceMessages[1].mine).toBe(false)

      // Check conversation preview updated
      const conversations = await fetchConversations(verifiedUserOne.id)
      const targetConv = conversations.find((c) => c.id === convId)
      expect(targetConv?.lastMessage).toBe('Count me in! What tech stack are you thinking?')
    })
  })

  describe('Read Receipts & Conversation Isolation', () => {
    it('marks conversation incoming messages as read and clears unread counter', async () => {
      const created = await getOrCreateConversation(
        verifiedUserOne.id,
        verifiedUserTwo.id,
        verifiedUserTwo,
        true
      )
      const convId = created.conversation!.id

      // Bob sends message to Alice
      await sendMessage(convId, verifiedUserTwo.id, 'Can you send the Figma link?', true)

      // Alice fetches conversations - should have 1 unread message
      const beforeRead = await fetchConversations(verifiedUserOne.id)
      const convBefore = beforeRead.find((c) => c.id === convId)
      expect(convBefore?.unreadCount).toBe(1)

      // Alice marks conversation as read
      await markConversationRead(convId, verifiedUserOne.id)

      // Alice fetches conversations again - unread count should be 0
      const afterRead = await fetchConversations(verifiedUserOne.id)
      const convAfter = afterRead.find((c) => c.id === convId)
      expect(convAfter?.unreadCount).toBe(0)
    })
  })

  describe('Campus Notifications System', () => {
    it('fetches campus notifications for the user with actor info and unread status', async () => {
      const notifs = await fetchNotifications('current-user')
      expect(notifs.length).toBeGreaterThan(0)
      expect(notifs.some((n) => n.type === 'connection_accepted')).toBe(true)
      expect(notifs.some((n) => n.type === 'mentorship_request')).toBe(true)
    })

    it('marks a specific notification as read', async () => {
      const notifs = await fetchNotifications('current-user')
      const target = notifs.find((n) => !n.isRead)
      expect(target).toBeDefined()

      await markNotificationRead(target!.id, 'current-user')

      const updated = await fetchNotifications('current-user')
      const refreshedTarget = updated.find((n) => n.id === target!.id)
      expect(refreshedTarget?.isRead).toBe(true)
    })

    it('marks all notifications as read for a user', async () => {
      await markAllNotificationsRead('current-user')

      const updated = await fetchNotifications('current-user')
      expect(updated.every((n) => n.isRead)).toBe(true)
    })

    it('creates a new campus notification successfully', async () => {
      const createRes = await createNotification({
        recipientId: verifiedUserOne.id,
        actorId: verifiedUserTwo.id,
        actor: {
          name: verifiedUserTwo.name,
          initials: verifiedUserTwo.initials,
          avatar: verifiedUserTwo.avatar,
        },
        type: 'mentorship_request',
        title: 'New Session Request',
        message: 'Bob Sharma requested a mentorship session on "Backend APIs".',
        link: '/mentorship',
      })

      expect(createRes.success).toBe(true)
      expect(createRes.notification).toBeDefined()
      expect(createRes.notification?.recipientId).toBe(verifiedUserOne.id)
      expect(createRes.notification?.isRead).toBe(false)

      const userNotifs = await fetchNotifications(verifiedUserOne.id)
      expect(userNotifs.some((n) => n.id === createRes.notification?.id)).toBe(true)
    })
  })
})
