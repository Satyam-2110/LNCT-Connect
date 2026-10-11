import { supabase, isSupabaseConfigured } from '../lib/supabase'

export interface CampusNotification {
  id: string
  recipientId: string
  actorId?: string | null
  actor?: {
    name: string
    initials: string
    avatar: string
  }
  type:
    | 'connection_request'
    | 'connection_accepted'
    | 'project_application'
    | 'mentorship_request'
    | 'message'
    | 'reaction'
  title: string
  message: string
  link?: string | null
  isRead: boolean
  createdAt: string
}

interface MockNotificationRecord {
  id: string
  recipientId: string
  actorId?: string | null
  actor?: {
    name: string
    initials: string
    avatar: string
  }
  type: CampusNotification['type']
  title: string
  message: string
  link?: string | null
  isRead: boolean
  createdAt: string
}

const mockNotificationsStore: MockNotificationRecord[] = []

function initSeedNotifications() {
  if (mockNotificationsStore.length > 0) return

  mockNotificationsStore.push(
    {
      id: 'notif-1',
      recipientId: 'current-user',
      actorId: 'rahul-sharma',
      actor: {
        name: 'Rahul Sharma',
        initials: 'RS',
        avatar: 'from-blue-500 to-indigo-600',
      },
      type: 'connection_accepted',
      title: 'Connection Accepted',
      message: 'Rahul Sharma accepted your connection request.',
      link: '/profile/rahul-sharma',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30m ago
    },
    {
      id: 'notif-2',
      recipientId: 'current-user',
      actorId: 'sneha-kulkarni',
      actor: {
        name: 'Sneha Kulkarni',
        initials: 'SK',
        avatar: 'from-teal-400 to-emerald-600',
      },
      type: 'mentorship_request',
      title: 'Mentorship Confirmed',
      message: 'Sneha Kulkarni accepted your mentorship session on "Career roadmap".',
      link: '/mentorship',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3h ago
    },
    {
      id: 'notif-3',
      recipientId: 'current-user',
      actorId: 'rohan-verma',
      actor: {
        name: 'Rohan Verma',
        initials: 'RV',
        avatar: 'from-orange-400 to-amber-600',
      },
      type: 'project_application',
      title: 'New Team Applicant',
      message: 'Rohan Verma applied to join "LNCT Autonomous Rover".',
      link: '/projects',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    }
  )
}

initSeedNotifications()

export function __resetNotificationsStore() {
  mockNotificationsStore.length = 0
  notificationSubscribers.clear()
  initSeedNotifications()
}

// Local subscriber store for testing & offline Realtime dispatch
const notificationSubscribers: Map<string, Set<(notification: CampusNotification) => void>> = new Map()

export function __clearNotificationSubscribers() {
  notificationSubscribers.clear()
}

/**
 * Fetches notifications for the given user.
 */
export async function fetchNotifications(userId: string): Promise<CampusNotification[]> {
  initSeedNotifications()

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          recipient_id,
          actor_id,
          type,
          title,
          message,
          link,
          is_read,
          created_at,
          actor:profiles!actor_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[LNCT Connect] Error fetching notifications:', error.message)
        return []
      }

      if (data) {
        return data.map((row) => {
          const actorRaw = row.actor
          const actor = Array.isArray(actorRaw) ? actorRaw[0] : actorRaw
          const actorName = actor?.full_name || 'Campus Member'
          const initials = (actorName as string)
            .split(' ')
            .map((p: string) => p[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)

          return {
            id: row.id,
            recipientId: row.recipient_id,
            actorId: row.actor_id,
            actor: {
              name: actorName,
              initials,
              avatar: actor?.avatar_url || 'from-indigo-500 to-purple-600',
            },
            type: row.type as CampusNotification['type'],
            title: row.title,
            message: row.message,
            link: row.link,
            isRead: row.is_read,
            createdAt: row.created_at,
          }
        })
      }
      return []
    } catch (err) {
      console.error('[LNCT Connect] Unexpected error fetching notifications:', err)
      return []
    }
  }

  return mockNotificationsStore
    .filter((n) => n.recipientId === userId || n.recipientId === 'current-user')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/**
 * Marks a single notification as read.
 */
export async function markNotificationRead(
  notificationId: string,
  userId: string
): Promise<{ success: boolean }> {
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('recipient_id', userId)
    } catch {
      // Ignore
    }
  }

  const notif = mockNotificationsStore.find((n) => n.id === notificationId)
  if (notif) {
    notif.isRead = true
  }

  return { success: true }
}

/**
 * Marks all notifications for a user as read.
 */
export async function markAllNotificationsRead(userId: string): Promise<{ success: boolean }> {
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', userId)
    } catch {
      // Ignore
    }
  }

  for (const n of mockNotificationsStore) {
    if (n.recipientId === userId || n.recipientId === 'current-user') {
      n.isRead = true
    }
  }

  return { success: true }
}

/**
 * Creates a notification for a campus interaction.
 */
export async function createNotification(
  data: {
    recipientId: string
    actorId?: string | null
    actor?: {
      name: string
      initials: string
      avatar: string
    }
    type: CampusNotification['type']
    title: string
    message: string
    link?: string | null
  },
  currentUserId?: string
): Promise<{ success: boolean; error?: string; notification?: CampusNotification }> {
  // Hardened authorization guard: prohibit creating notifications on behalf of other actors
  if (currentUserId && data.actorId && data.actorId !== currentUserId) {
    return {
      success: false,
      error: 'Unauthorized: Cannot create notification with spoofed actor ID.',
    }
  }

  if (isSupabaseConfigured) {
    try {
      const { data: inserted, error } = await supabase
        .from('notifications')
        .insert({
          recipient_id: data.recipientId,
          actor_id: data.actorId || null,
          type: data.type,
          title: data.title,
          message: data.message,
          link: data.link || null,
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      if (inserted) {
        return {
          success: true,
          notification: {
            id: inserted.id,
            recipientId: inserted.recipient_id,
            actorId: inserted.actor_id,
            actor: data.actor,
            type: inserted.type as CampusNotification['type'],
            title: inserted.title,
            message: inserted.message,
            link: inserted.link,
            isRead: inserted.is_read,
            createdAt: inserted.created_at,
          },
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Database notification creation failed.'
      return { success: false, error: message }
    }
  }

  const newNotif: MockNotificationRecord = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    recipientId: data.recipientId,
    actorId: data.actorId,
    actor: data.actor,
    type: data.type,
    title: data.title,
    message: data.message,
    link: data.link,
    isRead: false,
    createdAt: new Date().toISOString(),
  }

  mockNotificationsStore.unshift(newNotif)

  // Realtime notification to local active subscribers
  const subs = notificationSubscribers.get(data.recipientId)
  if (subs) {
    subs.forEach((cb) => cb(newNotif))
  }

  return { success: true, notification: newNotif }
}

/**
 * Subscribes to real-time incoming campus notifications for a user.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notification: CampusNotification) => void
): () => void {
  if (isSupabaseConfigured) {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new as any
          if (n) {
            callback({
              id: n.id,
              recipientId: n.recipient_id,
              actorId: n.actor_id,
              type: n.type,
              title: n.title,
              message: n.message,
              link: n.link,
              isRead: n.is_read,
              createdAt: n.created_at,
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
  if (!notificationSubscribers.has(userId)) {
    notificationSubscribers.set(userId, new Set())
  }
  const subs = notificationSubscribers.get(userId)!
  subs.add(callback)

  return () => {
    subs.delete(callback)
    if (subs.size === 0) {
      notificationSubscribers.delete(userId)
    }
  }
}
