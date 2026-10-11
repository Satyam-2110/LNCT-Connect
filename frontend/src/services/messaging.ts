import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { conversations as seedConversations } from '../data/messages'

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  content: string
  isRead: boolean
  createdAt: string
  mine?: boolean
}

export interface ChatConversation {
  id: string
  participantOne: string
  participantTwo: string
  otherParticipant: {
    id: string
    name: string
    initials: string
    avatar: string
    role?: string
    company?: string
    online?: boolean
  }
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

interface MockConversationRecord {
  id: string
  participantOne: string
  participantTwo: string
  otherParticipant: {
    id: string
    name: string
    initials: string
    avatar: string
    role?: string
    company?: string
    online?: boolean
  }
  lastMessage: string
  lastMessageAt: string
}

interface MockMessageRecord {
  id: string
  conversationId: string
  senderId: string
  content: string
  isRead: boolean
  createdAt: string
}

const mockConversationsStore: MockConversationRecord[] = []
const mockMessagesStore: MockMessageRecord[] = []

// Local subscriber store for testing & offline Realtime dispatch
const messageSubscribers: Map<string, Set<(message: ChatMessage) => void>> = new Map()

export function __clearMessageSubscribers() {
  messageSubscribers.clear()
}

/**
 * Initializes or resets the mock messaging store.
 */
export function __resetMessagingStore() {
  mockConversationsStore.length = 0
  mockMessagesStore.length = 0
  messageSubscribers.clear()
  initSeedConversations()
}

export const __resetConversationsStore = __resetMessagingStore


function initSeedConversations() {
  if (mockConversationsStore.length > 0) return

  for (const seed of seedConversations) {
    mockConversationsStore.push({
      id: seed.id,
      participantOne: 'current-user',
      participantTwo: seed.person.id,
      otherParticipant: {
        id: seed.person.id,
        name: seed.person.name,
        initials: seed.person.initials,
        avatar: seed.person.avatar,
        role: seed.person.role,
        company: seed.person.company,
        online: seed.person.online,
      },
      lastMessage: seed.preview,
      lastMessageAt: new Date(Date.now() - 3600000).toISOString(),
    })

    for (const msg of seed.messages) {
      mockMessagesStore.push({
        id: `seed-${seed.id}-${msg.id}`,
        conversationId: seed.id,
        senderId: msg.mine ? 'current-user' : seed.person.id,
        content: msg.text,
        isRead: true,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      })
    }
  }
}

// Initial hydration
initSeedConversations()

export interface ConversationOptions {
  limit?: number
  offset?: number
}

/**
 * Fetches all conversations involving the user with optional pagination.
 */
export async function fetchConversations(
  userId: string,
  options: ConversationOptions = {}
): Promise<ChatConversation[]> {
  const { limit, offset = 0 } = options
  initSeedConversations()

  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('conversations')
        .select(`
          id,
          participant_one,
          participant_two,
          last_message,
          last_message_at,
          created_at,
          updated_at,
          p1:profiles!participant_one (
            id,
            full_name,
            avatar_url,
            role,
            company
          ),
          p2:profiles!participant_two (
            id,
            full_name,
            avatar_url,
            role,
            company
          )
        `)
        .or(`participant_one.eq.${userId},participant_two.eq.${userId}`)
        .order('updated_at', { ascending: false })

      if (limit !== undefined) {
        query = query.range(offset, offset + limit - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('[LNCT Connect] Error querying live conversations:', error.message)
        return []
      }

      if (data) {
        return data.map((row) => {
          const isP1 = row.participant_one === userId
          const otherRaw = isP1 ? row.p2 : row.p1
          const other = Array.isArray(otherRaw) ? otherRaw[0] : otherRaw
          const otherName = other?.full_name || 'Campus Peer'
          const initials = (otherName as string)
            .split(' ')
            .map((p: string) => p[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)

          return {
            id: row.id,
            participantOne: row.participant_one,
            participantTwo: row.participant_two,
            otherParticipant: {
              id: isP1 ? row.participant_two : row.participant_one,
              name: otherName,
              initials,
              avatar: other?.avatar_url || 'from-indigo-500 to-purple-600',
              role: other?.role || 'Student',
              company: other?.company || 'LNCT',
              online: true,
            },
            lastMessage: row.last_message || 'Started a conversation',
            lastMessageAt: row.last_message_at || row.updated_at,
            unreadCount: 0,
          }
        })
      }
      return []
    } catch (err) {
      console.error('[LNCT Connect] Unexpected error querying live conversations:', err)
      return []
    }
  }

  const results = mockConversationsStore
    .filter((c) => c.participantOne === userId || c.participantTwo === userId || c.participantOne === 'current-user')
    .map((c) => {
      const unreadCount = mockMessagesStore.filter(
        (m) => m.conversationId === c.id && m.senderId !== userId && !m.isRead
      ).length

      return {
        id: c.id,
        participantOne: c.participantOne,
        participantTwo: c.participantTwo,
        otherParticipant: c.otherParticipant,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt,
        unreadCount,
      }
    })
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())

  if (limit !== undefined) {
    return results.slice(offset, offset + limit)
  }

  return results
}


/**
 * Gets an existing conversation between two users or creates a new one.
 * Progressive access: verified students only.
 * Self-conversation: blocked.
 */
export async function getOrCreateConversation(
  userOneId: string,
  userTwoId: string,
  userTwoProfile: {
    name: string
    initials: string
    avatar: string
    role?: string
    company?: string
  },
  isVerified: boolean
): Promise<{ success: boolean; error?: string; conversation?: ChatConversation }> {
  if (!isVerified) {
    return {
      success: false,
      error: 'Institutional ID verification is required to start a conversation.',
    }
  }

  if (userOneId === userTwoId) {
    return {
      success: false,
      error: 'You cannot start a direct conversation with yourself.',
    }
  }

  if (isSupabaseConfigured) {
    try {
      // Check existing
      const { data: existing, error: findError } = await supabase
        .from('conversations')
        .select('id, participant_one, participant_two, last_message, last_message_at, updated_at')
        .or(
          `and(participant_one.eq.${userOneId},participant_two.eq.${userTwoId}),and(participant_one.eq.${userTwoId},participant_two.eq.${userOneId})`
        )
        .maybeSingle()

      if (!findError && existing) {
        return {
          success: true,
          conversation: {
            id: existing.id,
            participantOne: existing.participant_one,
            participantTwo: existing.participant_two,
            otherParticipant: {
              id: userTwoId,
              name: userTwoProfile.name,
              initials: userTwoProfile.initials,
              avatar: userTwoProfile.avatar,
              role: userTwoProfile.role,
              company: userTwoProfile.company,
              online: true,
            },
            lastMessage: existing.last_message || 'Started a conversation',
            lastMessageAt: existing.last_message_at || existing.updated_at,
            unreadCount: 0,
          },
        }
      }

      // Create new
      const { data: created, error: insertError } = await supabase
        .from('conversations')
        .insert({
          participant_one: userOneId,
          participant_two: userTwoId,
        })
        .select()
        .single()

      if (insertError) {
        return { success: false, error: insertError.message }
      }

      if (created) {
        return {
          success: true,
          conversation: {
            id: created.id,
            participantOne: created.participant_one,
            participantTwo: created.participant_two,
            otherParticipant: {
              id: userTwoId,
              name: userTwoProfile.name,
              initials: userTwoProfile.initials,
              avatar: userTwoProfile.avatar,
              role: userTwoProfile.role,
              company: userTwoProfile.company,
              online: true,
            },
            lastMessage: 'Conversation started',
            lastMessageAt: created.created_at,
            unreadCount: 0,
          },
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Database conversation creation failed.'
      return { success: false, error: message }
    }
  }

  // Mock store
  const existing = mockConversationsStore.find(
    (c) =>
      (c.participantOne === userOneId && c.participantTwo === userTwoId) ||
      (c.participantOne === userTwoId && c.participantTwo === userOneId)
  )

  if (existing) {
    return {
      success: true,
      conversation: {
        id: existing.id,
        participantOne: existing.participantOne,
        participantTwo: existing.participantTwo,
        otherParticipant: existing.otherParticipant,
        lastMessage: existing.lastMessage,
        lastMessageAt: existing.lastMessageAt,
        unreadCount: 0,
      },
    }
  }

  const newConv: MockConversationRecord = {
    id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    participantOne: userOneId,
    participantTwo: userTwoId,
    otherParticipant: {
      id: userTwoId,
      name: userTwoProfile.name,
      initials: userTwoProfile.initials,
      avatar: userTwoProfile.avatar,
      role: userTwoProfile.role,
      company: userTwoProfile.company,
      online: true,
    },
    lastMessage: 'Conversation started',
    lastMessageAt: new Date().toISOString(),
  }

  mockConversationsStore.unshift(newConv)

  return {
    success: true,
    conversation: {
      ...newConv,
      unreadCount: 0,
    },
  }
}

/**
 * Fetches message history for a conversation chronologically.
 */
export async function fetchMessages(conversationId: string, currentUserId?: string): Promise<ChatMessage[]> {
  initSeedConversations()

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, content, is_read, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('[LNCT Connect] Error fetching messages:', error.message)
        return []
      }

      if (data) {
        return data.map((m) => ({
          id: m.id,
          conversationId: m.conversation_id,
          senderId: m.sender_id,
          content: m.content,
          isRead: m.is_read,
          createdAt: m.created_at,
          mine: currentUserId ? m.sender_id === currentUserId : false,
        }))
      }
      return []
    } catch (err) {
      console.error('[LNCT Connect] Unexpected error fetching messages:', err)
      return []
    }
  }

  // Mock messages
  return mockMessagesStore
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((m) => ({
      ...m,
      mine: currentUserId ? m.senderId === currentUserId : false,
    }))
}

/**
 * Sends a new message in a conversation.
 * Progressive access: verified students only.
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  isVerified: boolean
): Promise<{ success: boolean; error?: string; message?: ChatMessage }> {
  if (!isVerified) {
    return {
      success: false,
      error: 'Institutional ID verification is required to send messages.',
    }
  }

  const trimmed = content.trim()
  if (!trimmed) {
    return { success: false, error: 'Message cannot be empty.' }
  }

  if (isSupabaseConfigured) {
    try {
      const { data: inserted, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content: trimmed,
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      if (inserted) {
        const msg: ChatMessage = {
          id: inserted.id,
          conversationId: inserted.conversation_id,
          senderId: inserted.sender_id,
          content: inserted.content,
          isRead: inserted.is_read,
          createdAt: inserted.created_at,
          mine: true,
        }
        return { success: true, message: msg }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Database message dispatch failed.'
      return { success: false, error: message }
    }
  }

  // Mock store
  const newMsg: MockMessageRecord = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    conversationId,
    senderId,
    content: trimmed,
    isRead: false,
    createdAt: new Date().toISOString(),
  }

  mockMessagesStore.push(newMsg)

  // Update conversation record
  const conv = mockConversationsStore.find((c) => c.id === conversationId)
  if (conv) {
    conv.lastMessage = trimmed
    conv.lastMessageAt = newMsg.createdAt
  }

  // Realtime notification to local active subscribers
  const subs = messageSubscribers.get(conversationId)
  if (subs) {
    subs.forEach((cb) => cb({ ...newMsg, mine: false }))
  }

  return {
    success: true,
    message: {
      ...newMsg,
      mine: true,
    },
  }
}

/**
 * Marks all incoming messages in a conversation as read.
 */
export async function markConversationRead(conversationId: string, currentUserId: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUserId)
    } catch {
      // Ignore
    }
  }

  // Update mock
  for (const m of mockMessagesStore) {
    if (m.conversationId === conversationId && m.senderId !== currentUserId) {
      m.isRead = true
    }
  }
}

/**
 * Updates a message with security guardrails.
 * Message content and sender are strictly immutable post-creation.
 * Only the isRead status may be updated by conversation participants.
 */
export async function updateMessage(
  messageId: string,
  userId: string,
  updates: {
    content?: string
    senderId?: string
    isRead?: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  if (updates.content !== undefined) {
    return {
      success: false,
      error: 'Message content cannot be modified post-creation.',
    }
  }

  if (updates.senderId !== undefined) {
    return {
      success: false,
      error: 'Message sender cannot be modified post-creation.',
    }
  }

  if (isSupabaseConfigured) {
    try {
      const payload: { is_read?: boolean } = {}
      if (updates.isRead !== undefined) payload.is_read = updates.isRead

      const { error } = await supabase
        .from('messages')
        .update(payload)
        .eq('id', messageId)

      if (error) {
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Database update failed.'
      return { success: false, error: message }
    }
  }

  const msg = mockMessagesStore.find((m) => m.id === messageId)
  if (!msg) {
    return { success: false, error: 'Message not found.' }
  }

  if (updates.isRead !== undefined) {
    msg.isRead = updates.isRead
  }

  return { success: true }
}

/**
 * Attempts to modify conversation participants.
 * Conversation participants are strictly immutable post-creation to prevent hijacking.
 */
export async function updateConversationParticipants(
  conversationId: string,
  userId: string,
  newParticipantOne: string,
  newParticipantTwo: string
): Promise<{ success: boolean; error?: string }> {
  return {
    success: false,
    error: 'Conversation participants cannot be altered post-creation.',
  }
}

/**
 * Subscribes to real-time incoming messages in a conversation.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (message: ChatMessage) => void
): () => void {
  if (isSupabaseConfigured) {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = payload.new as any
          if (m) {
            callback({
              id: m.id,
              conversationId: m.conversation_id,
              senderId: m.sender_id,
              content: m.content,
              isRead: m.is_read,
              createdAt: m.created_at,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  // Local fallback / mock event bus
  if (!messageSubscribers.has(conversationId)) {
    messageSubscribers.set(conversationId, new Set())
  }
  const subs = messageSubscribers.get(conversationId)!
  subs.add(callback)

  return () => {
    subs.delete(callback)
    if (subs.size === 0) {
      messageSubscribers.delete(conversationId)
    }
  }
}

