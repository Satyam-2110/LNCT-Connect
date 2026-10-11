import { useState, useEffect } from 'react'
import { Bell, Check, CheckCheck, Heart, HeartHandshake, MessageCircle, Sparkles, UserCheck, UserPlus, Users, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Badge, Button, Card, EmptyState } from './ui'
import { useAuth } from '../context/AuthContext'
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  subscribeToNotifications,
  type CampusNotification,
} from '../services/notifications'

interface NotificationsDrawerProps {
  isOpen: boolean
  onClose: () => void
  onUnreadCountChange?: (count: number) => void
}

export function NotificationsDrawer({
  isOpen,
  onClose,
  onUnreadCountChange,
}: NotificationsDrawerProps) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState<CampusNotification[]>([])
  const [loading, setLoading] = useState(true)

  const loadNotifications = async () => {
    if (!user) return
    setLoading(true)
    const data = await fetchNotifications(user.id)
    setNotifications(data)
    setLoading(false)
    const unread = data.filter((n) => !n.isRead).length
    onUnreadCountChange?.(unread)
  }

  useEffect(() => {
    if (isOpen && user) {
      loadNotifications()
    }
  }, [isOpen, user])

  // Realtime notifications subscription
  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeToNotifications(user.id, (incoming) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === incoming.id)) return prev
        const next = [incoming, ...prev]
        const unread = next.filter((n) => !n.isRead).length
        onUnreadCountChange?.(unread)
        return next
      })
    })

    return () => {
      unsubscribe()
    }
  }, [user?.id, onUnreadCountChange])

  if (!isOpen) return null

  const handleMarkAsRead = async (notifId: string, link?: string | null) => {
    if (!user) return
    await markNotificationRead(notifId, user.id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
    )
    const remaining = notifications.filter((n) => n.id !== notifId && !n.isRead).length
    onUnreadCountChange?.(remaining)

    if (link) {
      onClose()
      navigate(link)
    }
  }

  const handleMarkAllRead = async () => {
    if (!user) return
    await markAllNotificationsRead(user.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    onUnreadCountChange?.(0)
  }

  const getTypeIcon = (type: CampusNotification['type']) => {
    switch (type) {
      case 'connection_accepted':
      case 'connection_request':
        return <UserCheck className="size-4 text-emerald-400" />
      case 'mentorship_request':
        return <HeartHandshake className="size-4 text-orange-400" />
      case 'project_application':
        return <Users className="size-4 text-blue-400" />
      case 'message':
        return <MessageCircle className="size-4 text-indigo-400" />
      case 'reaction':
        return <Heart className="size-4 text-rose-400" />
      default:
        return <Sparkles className="size-4 text-amber-400" />
    }
  }

  const formatTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return `${Math.floor(diffHours / 24)}d ago`
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <Card
        className="relative z-10 h-full w-full max-w-sm rounded-none border-l p-0 shadow-2xl animate-in slide-in-from-right duration-200 flex flex-col"
        style={{
          background: 'var(--color-bg)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-bg-secondary)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="grid size-8 place-items-center rounded-lg"
              style={{
                background: 'rgba(231, 111, 53, 0.12)',
                color: 'var(--color-accent)',
              }}
            >
              <Bell className="size-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold" style={{ color: 'var(--color-ink)' }}>
                Campus Alerts
              </h3>
              <p className="text-[11px] font-medium" style={{ color: 'var(--color-ink-muted)' }}>
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Quick action bar */}
        {unreadCount > 0 && (
          <div
            className="flex items-center justify-between border-b px-5 py-2.5 text-xs"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-bg)',
            }}
          >
            <span className="text-[11px] font-medium text-zinc-400">Mark all notifications as read</span>
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-[11px] font-semibold text-orange-400 hover:text-orange-300 transition-colors"
            >
              <CheckCheck className="size-3.5" /> Mark read
            </button>
          </div>
        )}

        {/* Notifications Stream */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {loading ? (
            <div className="py-16 text-center text-xs text-zinc-400 font-medium">
              Loading alerts...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12">
              <EmptyState
                title="No notifications yet"
                description="When peers connect with you, request mentorship, or message you, updates will appear here."
              />
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleMarkAsRead(notif.id, notif.link)}
                className="group relative cursor-pointer rounded-xl border p-3.5 transition-all hover:border-[var(--color-accent)]/40 hover:shadow-sm"
                style={{
                  background: notif.isRead ? 'var(--color-bg-secondary)' : 'rgba(231, 111, 53, 0.05)',
                  borderColor: notif.isRead ? 'var(--color-border)' : 'rgba(231, 111, 53, 0.25)',
                }}
              >
                {!notif.isRead && (
                  <span
                    className="absolute right-3 top-3.5 size-2 rounded-full"
                    style={{ background: 'var(--color-accent)' }}
                  />
                )}

                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    {notif.actor ? (
                      <Avatar
                        name={notif.actor.name}
                        initials={notif.actor.initials}
                        tone={notif.actor.avatar}
                        size="sm"
                      />
                    ) : (
                      <div
                        className="grid size-8 place-items-center rounded-lg"
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                      >
                        {getTypeIcon(notif.type)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs" style={{ color: 'var(--color-ink)' }}>
                        {notif.title}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-ink-secondary)' }}>
                      {notif.message}
                    </p>
                    <p className="mt-2 text-[10px] font-medium text-zinc-400">
                      {formatTime(notif.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
