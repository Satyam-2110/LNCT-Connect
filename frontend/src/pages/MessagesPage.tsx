import { useState, useEffect, useMemo, useRef } from 'react'
import { Info, MoreHorizontal, Paperclip, Send, Smile, Sparkles, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/layout'
import { Avatar, Button, Card, SearchField } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  markConversationRead,
  subscribeToMessages,
  type ChatConversation,
  type ChatMessage,
} from '../services/messaging'
import { VerificationModal } from '../components/VerificationModal'
import { cn } from '../lib/utils'

export function MessagesPage() {
  const { user, isVerified } = useAuth()
  const userId = user?.id || 'current-user'

  const [conversationsList, setConversationsList] = useState<ChatConversation[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [query, setQuery] = useState('')
  const [verificationOpen, setVerificationOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load threads
  const loadThreads = async () => {
    setLoadingThreads(true)
    const list = await fetchConversations(userId)
    setConversationsList(list)
    if (list.length > 0 && !activeId) {
      setActiveId(list[0].id)
    }
    setLoadingThreads(false)
  }

  useEffect(() => {
    loadThreads()
  }, [userId])

  // Load active messages and subscribe to real-time incoming messages
  useEffect(() => {
    if (!activeId) return

    let active = true
    setLoadingMessages(true)

    fetchMessages(activeId, userId).then((msgs) => {
      if (active) {
        setMessages(msgs)
        setLoadingMessages(false)
      }
    })

    // Mark as read
    markConversationRead(activeId, userId).then(() => {
      setConversationsList((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, unreadCount: 0 } : c))
      )
    })

    // Subscribe to live incoming messages
    const unsubscribe = subscribeToMessages(activeId, (incoming) => {
      if (!active) return
      setMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev
        return [...prev, { ...incoming, mine: incoming.senderId === userId }]
      })

      setConversationsList((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                lastMessage: incoming.content,
                lastMessageAt: incoming.createdAt,
              }
            : c
        )
      )

      markConversationRead(activeId, userId)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [activeId, userId])

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const activeThread =
    conversationsList.find((c) => c.id === activeId) || conversationsList[0]

  const filteredThreads = useMemo(() => {
    if (!query.trim()) return conversationsList
    return conversationsList.filter((c) =>
      c.otherParticipant.name.toLowerCase().includes(query.toLowerCase())
    )
  }, [conversationsList, query])

  const handleSend = async () => {
    if (!draft.trim() || sending) return

    if (!user) {
      return
    }

    if (!isVerified) {
      setVerificationOpen(true)
      return
    }

    setSending(true)
    const res = await sendMessage(activeId, userId, draft.trim(), isVerified)
    setSending(false)

    if (res.success && res.message) {
      const newMsg = res.message
      setMessages((prev) => [...prev, newMsg])
      setDraft('')

      // Update thread preview
      setConversationsList((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                lastMessage: newMsg.content,
                lastMessageAt: newMsg.createdAt,
              }
            : c
        )
      )
    }
  }

  const formatMessageTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return isNaN(d.getTime())
      ? 'Just now'
      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatThreadTime = (dateStr: string) => {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    const diffMs = Date.now() - d.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    if (diffHours < 24) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <AppShell wide>
      <div className="mb-6">
        <p className="label-sm mb-1.5" style={{ color: 'var(--color-accent)' }}>
          Direct Conversations
        </p>
        <h1
          className="font-display text-3xl font-bold tracking-[-0.03em]"
          style={{ color: 'var(--color-ink)' }}
        >
          Campus Messages
        </h1>
      </div>

      <Card className="grid h-[calc(100vh-210px)] min-h-[580px] overflow-hidden md:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_260px]">
        {/* Threads List */}
        <aside
          className="flex min-h-0 flex-col border-r"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="border-b p-3.5" style={{ borderColor: 'var(--color-border)' }}>
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Search conversations…"
            />
          </div>

          <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto p-2 space-y-1">
            {loadingThreads ? (
              <div className="py-12 text-center text-xs text-zinc-400">Loading messages...</div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-400">No conversations found.</div>
            ) : (
              filteredThreads.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setActiveId(conversation.id)}
                  className={cn(
                    'flex w-full gap-3 rounded-md p-3 text-left transition',
                    activeThread?.id === conversation.id
                      ? 'border'
                      : 'hover:bg-[var(--color-bg-secondary)]'
                  )}
                  style={{
                    background:
                      activeThread?.id === conversation.id
                        ? 'var(--color-accent-subtle)'
                        : 'transparent',
                    borderColor:
                      activeThread?.id === conversation.id
                        ? 'rgba(231, 111, 53, 0.3)'
                        : 'transparent',
                  }}
                >
                  <Avatar
                    name={conversation.otherParticipant.name}
                    initials={conversation.otherParticipant.initials}
                    tone={conversation.otherParticipant.avatar}
                    size="sm"
                    online={conversation.otherParticipant.online}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <p
                        className="truncate text-xs font-bold"
                        style={{ color: 'var(--color-ink)' }}
                      >
                        {conversation.otherParticipant.name}
                      </p>
                      <span
                        className="shrink-0 text-[10px]"
                        style={{ color: 'var(--color-ink-muted)' }}
                      >
                        {formatThreadTime(conversation.lastMessageAt)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p
                        className="truncate text-xs"
                        style={{ color: 'var(--color-ink-muted)' }}
                      >
                        {conversation.lastMessage}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span
                          className="grid size-4 shrink-0 place-items-center rounded-full text-[9px] font-bold text-white"
                          style={{ background: 'var(--color-accent)' }}
                        >
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Active Conversation Message Pane */}
        {activeThread ? (
          <section className="flex min-w-0 flex-col">
            <header
              className="flex h-[68px] items-center justify-between border-b px-5"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-3">
                <Avatar
                  name={activeThread.otherParticipant.name}
                  initials={activeThread.otherParticipant.initials}
                  tone={activeThread.otherParticipant.avatar}
                  size="sm"
                  online={activeThread.otherParticipant.online}
                />
                <div>
                  <p className="font-display text-sm font-bold" style={{ color: 'var(--color-ink)' }}>
                    {activeThread.otherParticipant.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                    {activeThread.otherParticipant.role} @ {activeThread.otherParticipant.company}
                  </p>
                </div>
              </div>

              <div className="flex gap-1">
                <Link to="/people">
                  <button
                    aria-label="Campus directory"
                    title="Find peers in Campus Directory"
                    className="grid size-8 place-items-center rounded-md text-[var(--color-ink-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-ink)]"
                  >
                    <UserPlus className="size-4" />
                  </button>
                </Link>
                <button
                  aria-label="Conversation info"
                  className="grid size-8 place-items-center rounded-md text-[var(--color-ink-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-ink)]"
                >
                  <Info className="size-4" />
                </button>
              </div>
            </header>

            <div
              className="scrollbar-none flex-1 overflow-y-auto px-5 py-6 space-y-4"
              style={{ background: 'var(--color-bg)' }}
            >
              <p
                className="text-center text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-ink-muted)' }}
              >
                Encrypted Campus Thread
              </p>

              {loadingMessages ? (
                <div className="py-12 text-center text-xs text-zinc-400">Loading message history...</div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-400">
                  No messages yet. Send a note to break the ice!
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn('flex', message.mine ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[78%] rounded-lg px-4 py-2.5 text-xs leading-relaxed',
                        message.mine ? 'rounded-br-none shadow-sm' : 'rounded-bl-none border'
                      )}
                      style={{
                        background: message.mine ? 'var(--color-accent)' : 'var(--color-card)',
                        color: message.mine ? '#FFFFFF' : 'var(--color-ink)',
                        borderColor: message.mine ? 'transparent' : 'var(--color-border)',
                      }}
                    >
                      <p>{message.content}</p>
                      <p
                        className="mt-1 text-[10px]"
                        style={{
                          color: message.mine ? 'rgba(255, 255, 255, 0.8)' : 'var(--color-ink-muted)',
                          textAlign: 'right',
                        }}
                      >
                        {formatMessageTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div
              className="border-t p-3.5"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div
                className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-card)',
                }}
              >
                <button
                  aria-label="Attach file"
                  className="grid size-8 place-items-center rounded text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                >
                  <Paperclip className="size-4" />
                </button>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSend()
                  }}
                  aria-label="Type message"
                  placeholder={`Message ${activeThread.otherParticipant.name.split(' ')[0]}…`}
                  className="h-9 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
                  style={{ color: 'var(--color-ink)' }}
                />
                <button
                  aria-label="Emoji picker"
                  className="grid size-8 place-items-center rounded text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                >
                  <Smile className="size-4" />
                </button>
                <button
                  aria-label="Send message"
                  onClick={handleSend}
                  disabled={sending || !draft.trim()}
                  className="grid size-9 place-items-center rounded-md text-white transition hover:opacity-90 active:scale-95 disabled:opacity-50"
                  style={{ background: 'var(--color-accent)' }}
                >
                  <Send className="size-3.5" />
                </button>
              </div>
            </div>
          </section>
        ) : (
          <div className="grid place-items-center p-8 text-center text-xs text-zinc-400">
            Select a conversation to view messages.
          </div>
        )}

        {/* Right Info Aside */}
        {activeThread && (
          <aside
            className="hidden border-l p-6 xl:block"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <Avatar
              name={activeThread.otherParticipant.name}
              initials={activeThread.otherParticipant.initials}
              tone={activeThread.otherParticipant.avatar}
              size="lg"
            />
            <h2
              className="font-display mt-3.5 text-sm font-bold"
              style={{ color: 'var(--color-ink)' }}
            >
              {activeThread.otherParticipant.name}
            </h2>
            <p
              className="mt-0.5 text-xs font-semibold"
              style={{ color: 'var(--color-accent)' }}
            >
              {activeThread.otherParticipant.role} · {activeThread.otherParticipant.company}
            </p>
            <p
              className="mt-5 text-xs leading-relaxed"
              style={{ color: 'var(--color-ink-muted)' }}
            >
              Connected via LNCT Campus Directory. Direct conversations are participant-isolated and confidential.
            </p>
            <Link to="/people">
              <button
                className="mt-5 w-full rounded-md border py-2 text-xs font-semibold transition hover:bg-[var(--color-bg-secondary)]"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-ink)',
                }}
              >
                View Full Profile
              </button>
            </Link>
          </aside>
        )}
      </Card>

      <VerificationModal
        isOpen={verificationOpen}
        onClose={() => setVerificationOpen(false)}
      />
    </AppShell>
  )
}
