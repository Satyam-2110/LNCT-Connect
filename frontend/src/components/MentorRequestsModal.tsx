import { useState, useEffect } from 'react'
import { Calendar, Check, Clock, HeartHandshake, Sparkles, User, X } from 'lucide-react'
import { Avatar, Badge, Button, Card, EmptyState } from './ui'
import { fetchMentorshipRequests, respondToMentorshipRequest, type MentorshipRequest } from '../services/mentorship'

interface MentorRequestsModalProps {
  isOpen: boolean
  onClose: () => void
  mentorId: string
  onRequestUpdated?: () => void
}

export function MentorRequestsModal({
  isOpen,
  onClose,
  mentorId,
  onRequestUpdated,
}: MentorRequestsModalProps) {
  const [requests, setRequests] = useState<MentorshipRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted'>('all')

  const loadRequests = async () => {
    setLoading(true)
    const data = await fetchMentorshipRequests(mentorId, 'mentor')
    setRequests(data)
    setLoading(false)
  }

  useEffect(() => {
    if (isOpen) {
      loadRequests()
    }
  }, [isOpen, mentorId])

  if (!isOpen) return null

  const handleRespond = async (requestId: string, accept: boolean) => {
    const { error } = await respondToMentorshipRequest(
      requestId,
      mentorId,
      accept ? 'accepted' : 'rejected'
    )

    if (!error) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: accept ? 'accepted' : 'rejected' } : r
        )
      )
      onRequestUpdated?.()
    }
  }

  const filteredRequests = requests.filter((r) => {
    if (filter === 'pending') return r.status === 'pending'
    if (filter === 'accepted') return r.status === 'accepted'
    return true
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <Card className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="grid size-9 place-items-center rounded-lg"
              style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}
            >
              <HeartHandshake className="size-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>
                Incoming Mentorship Requests
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                Review and schedule 1-on-1 sessions requested by students
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="mt-4 flex gap-2">
          {(['all', 'pending', 'accepted'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className="px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors"
              style={{
                background: filter === tab ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                color: filter === tab ? '#FFFFFF' : 'var(--color-ink-secondary)',
              }}
            >
              {tab === 'all' ? `All (${requests.length})` : tab}
            </button>
          ))}
        </div>

        {/* Requests List */}
        <div className="mt-4 space-y-3.5">
          {loading ? (
            <div className="py-12 text-center text-xs font-medium text-zinc-400">
              Loading requests...
            </div>
          ) : filteredRequests.length === 0 ? (
            <EmptyState
              title="No mentorship requests found"
              description={
                filter === 'pending'
                  ? 'You have caught up with all incoming student requests!'
                  : 'Students interested in your topics will submit booking requests here.'
              }
            />
          ) : (
            filteredRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 rounded-xl border transition-all"
                style={{
                  background: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <Avatar
                    name={req.student.name}
                    initials={req.student.initials}
                    tone={req.student.avatar}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-display text-sm font-bold truncate" style={{ color: 'var(--color-ink)' }}>
                        {req.student.name}
                      </h4>
                      <Badge tone="accent">{req.topic}</Badge>
                      <Badge
                        tone={
                          req.status === 'accepted'
                            ? 'green'
                            : req.status === 'rejected'
                            ? 'default'
                            : 'amber'
                        }
                      >
                        {req.status}
                      </Badge>
                    </div>

                    <p className="mt-0.5 text-xs text-zinc-400">
                      {req.student.branch} · {req.student.year}
                    </p>

                    <div
                      className="mt-2.5 rounded-lg border p-3 text-xs leading-relaxed"
                      style={{
                        background: 'var(--color-bg)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-ink-secondary)',
                      }}
                    >
                      <p className="font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                        <Sparkles className="size-3 text-amber-400" />
                        Goals & Context:
                      </p>
                      {req.goalsNote}
                    </div>

                    <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-400">
                      <Clock className="size-3 text-zinc-500" />
                      <span>Preferred Time: <strong className="text-zinc-300">{req.preferredTime}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Response Actions */}
                <div className="flex sm:flex-col gap-2 shrink-0 self-end sm:self-center">
                  {req.status === 'pending' ? (
                    <>
                      <Button
                        variant="primary"
                        className="h-8 px-3 text-xs w-full sm:w-auto"
                        onClick={() => handleRespond(req.id, true)}
                      >
                        <Check className="size-3.5 mr-1" /> Accept
                      </Button>
                      <Button
                        variant="secondary"
                        className="h-8 px-3 text-xs w-full sm:w-auto"
                        onClick={() => handleRespond(req.id, false)}
                      >
                        Decline
                      </Button>
                    </>
                  ) : req.status === 'accepted' ? (
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 py-1 px-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <Check className="size-3" /> Scheduled
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-zinc-500 py-1 px-2.5 rounded-lg bg-zinc-800/40">
                      Declined
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
