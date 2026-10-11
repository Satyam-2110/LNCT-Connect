import { useState } from 'react'
import { AlertCircle, Calendar, Check, Clock, HeartHandshake, Sparkles, X } from 'lucide-react'
import { Button, Card } from './ui'
import { useAuth } from '../context/AuthContext'
import { requestMentorshipSession, type MentorshipRequest } from '../services/mentorship'
import { VerificationModal } from './VerificationModal'
import type { Mentor } from '../types'

interface BookSessionModalProps {
  isOpen: boolean
  onClose: () => void
  mentor: Mentor
  onRequestSent?: (request: MentorshipRequest) => void
}

const timeOptions = [
  'Weekday Evening (after 6 PM)',
  'Weekend Morning (10 AM – 12 PM)',
  'Weekend Afternoon (2 PM – 5 PM)',
  'Flexible / Any time',
]

export function BookSessionModal({
  isOpen,
  onClose,
  mentor,
  onRequestSent,
}: BookSessionModalProps) {
  const { user, profile: authProfile, isVerified } = useAuth()

  const [selectedTopic, setSelectedTopic] = useState<string>(mentor.topics[0] || 'Career roadmap')
  const [customTopic, setCustomTopic] = useState('')
  const [goalsNote, setGoalsNote] = useState('')
  const [preferredTime, setPreferredTime] = useState(timeOptions[0])

  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successSent, setSuccessSent] = useState(false)
  const [verificationOpen, setVerificationOpen] = useState(false)

  if (!isOpen) return null

  const isSelf = user?.id === mentor.id

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!user) {
      setErrorMessage('Please sign in to book a mentorship session.')
      return
    }

    if (!isVerified) {
      setVerificationOpen(true)
      return
    }

    if (isSelf) {
      setErrorMessage('You cannot request mentorship from yourself.')
      return
    }

    const topic = customTopic.trim() || selectedTopic
    if (!topic) {
      setErrorMessage('Please select or write an advisory topic.')
      return
    }

    if (goalsNote.trim().length < 5) {
      setErrorMessage('Please describe what you are building and your goals for this session.')
      return
    }

    setSubmitting(true)

    const studentProfile = {
      name: authProfile?.full_name || user.email?.split('@')[0] || 'Student',
      initials: (authProfile?.full_name || 'ST')
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
      avatar: authProfile?.avatar_url || 'from-orange-400 to-amber-600',
      branch: authProfile?.branch || 'Engineering',
      year: authProfile?.batch || 'Student',
    }

    const res = await requestMentorshipSession(
      mentor.id,
      user.id,
      studentProfile,
      {
        topic,
        goalsNote: goalsNote.trim(),
        preferredTime,
      },
      isVerified
    )

    setSubmitting(false)

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to submit mentorship request.')
      return
    }

    setSuccessSent(true)
    if (res.request && onRequestSent) {
      onRequestSent(res.request)
    }

    setTimeout(() => {
      onClose()
      setSuccessSent(false)
    }, 1400)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal Window */}
        <Card
          className="relative z-10 w-full max-w-xl overflow-hidden border p-0 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          style={{
            background: 'var(--color-bg)',
            borderColor: 'var(--color-border)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between border-b px-6 py-5"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-bg-secondary)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex size-10 items-center justify-center rounded-xl"
                style={{
                  background: 'rgba(231, 111, 53, 0.12)',
                  color: 'var(--color-accent)',
                }}
              >
                <HeartHandshake className="size-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
                  Request Mentorship Session
                </h3>
                <p className="text-xs font-medium" style={{ color: 'var(--color-ink-muted)' }}>
                  with {mentor.name} · {mentor.role} @ {mentor.company}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {errorMessage && (
              <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {isSelf && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-300">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>This is your own mentor profile. You cannot request a session with yourself.</span>
              </div>
            )}

            {successSent ? (
              <div className="py-8 text-center space-y-3">
                <div
                  className="mx-auto flex size-12 items-center justify-center rounded-full"
                  style={{
                    background: 'rgba(34, 197, 94, 0.15)',
                    color: '#22c55e',
                  }}
                >
                  <Check className="size-6" />
                </div>
                <h4 className="font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>
                  Session Request Sent!
                </h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  {mentor.name} has been notified and can review your goals note and preferred availability.
                </p>
              </div>
            ) : (
              <>
                {/* Topic Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-ink-secondary)' }}>
                    Advisory Topic
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {mentor.topics.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => {
                          setSelectedTopic(topic)
                          setCustomTopic('')
                        }}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border"
                        style={{
                          background: selectedTopic === topic && !customTopic ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                          color: selectedTopic === topic && !customTopic ? '#FFFFFF' : 'var(--color-ink)',
                          borderColor: selectedTopic === topic && !customTopic ? 'var(--color-accent)' : 'var(--color-border)',
                        }}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Or enter custom topic (e.g., Placement prep)..."
                    className="mt-2.5 w-full rounded-lg border px-3.5 py-2 text-xs transition-colors"
                    style={{
                      background: 'var(--color-bg-secondary)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-ink)',
                    }}
                  />
                </div>

                {/* Goals & Note */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-ink-secondary)' }}>
                      What are you building or looking to unlock?
                    </label>
                    <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                      <Sparkles className="size-3 text-amber-400" />
                      Be specific
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={goalsNote}
                    onChange={(e) => setGoalsNote(e.target.value)}
                    placeholder="E.g., I'm building a distributed crawler in Go and struggling with worker pool coordination and backpressure. Looking for 20 mins to review architecture."
                    className="w-full rounded-lg border p-3 text-xs leading-relaxed transition-colors"
                    style={{
                      background: 'var(--color-bg-secondary)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-ink)',
                    }}
                  />
                </div>

                {/* Preferred Time */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-ink-secondary)' }}>
                    Preferred Availability
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {timeOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setPreferredTime(opt)}
                        className="flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs transition-colors"
                        style={{
                          background: preferredTime === opt ? 'rgba(231, 111, 53, 0.08)' : 'var(--color-bg-secondary)',
                          borderColor: preferredTime === opt ? 'var(--color-accent)' : 'var(--color-border)',
                          color: preferredTime === opt ? 'var(--color-accent)' : 'var(--color-ink-secondary)',
                        }}
                      >
                        <Clock className="size-3.5 shrink-0" />
                        <span className="font-medium">{opt}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mentor Availability Note */}
                <div
                  className="rounded-lg border p-3 flex items-center justify-between text-xs"
                  style={{
                    background: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-zinc-400" />
                    Mentor Availability:
                  </span>
                  <span className="font-semibold text-zinc-200">{mentor.availability}</span>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <Button variant="ghost" onClick={onClose} type="button" disabled={submitting}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" disabled={submitting || isSelf}>
                    {submitting ? 'Sending Request...' : 'Send Mentorship Request'}
                  </Button>
                </div>
              </>
            )}
          </form>
        </Card>
      </div>

      <VerificationModal
        isOpen={verificationOpen}
        onClose={() => setVerificationOpen(false)}
      />
    </>
  )
}
