import { useState } from 'react'
import { AlertCircle, Check, HeartHandshake, Plus, Sparkles, X } from 'lucide-react'
import { Button, Card } from './ui'
import { useAuth } from '../context/AuthContext'
import { registerMentorProfile } from '../services/mentorship'
import { VerificationModal } from './VerificationModal'
import type { Mentor } from '../types'

interface MentorApplicationModalProps {
  isOpen: boolean
  onClose: () => void
  onRegistered?: (mentor: Mentor) => void
}

const suggestedTopics = [
  'Career Roadmap',
  'System Design',
  'DSA & LeetCode Prep',
  'Resume & Portfolio Review',
  'Frontend Engineering',
  'Backend & APIs',
  'AI / ML Projects',
  'Startup Validation',
  'Placement Interviews',
]

const availabilityOptions = [
  '1 slot this month',
  '2 slots this month',
  '3 slots this month',
  '4 slots this month',
]

export function MentorApplicationModal({
  isOpen,
  onClose,
  onRegistered,
}: MentorApplicationModalProps) {
  const { user, profile: authProfile, isVerified } = useAuth()

  const [role, setRole] = useState(authProfile?.role === 'mentor' ? 'Senior Engineer' : '')
  const [company, setCompany] = useState(authProfile?.company || '')
  const [experience, setExperience] = useState('')
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['Career Roadmap', 'System Design'])
  const [customTopic, setCustomTopic] = useState('')
  const [availability, setAvailability] = useState(availabilityOptions[1])
  const [bio, setBio] = useState(authProfile?.bio || '')

  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [verificationOpen, setVerificationOpen] = useState(false)

  if (!isOpen) return null

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    )
  }

  const addCustomTopic = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTopic.trim()) {
      e.preventDefault()
      const trimmed = customTopic.trim()
      if (!selectedTopics.includes(trimmed)) {
        setSelectedTopics([...selectedTopics, trimmed])
      }
      setCustomTopic('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!user) {
      setErrorMessage('Please sign in to register as a mentor.')
      return
    }

    if (!isVerified) {
      setVerificationOpen(true)
      return
    }

    if (!experience.trim()) {
      setErrorMessage('Please describe your years or depth of engineering/career experience.')
      return
    }

    if (selectedTopics.length === 0) {
      setErrorMessage('Please select or specify at least one advisory topic.')
      return
    }

    setSubmitting(true)

    const res = await registerMentorProfile(
      user.id,
      {
        name: authProfile?.full_name || user.email?.split('@')[0] || 'Campus Mentor',
        avatar: authProfile?.avatar_url || 'from-teal-400 to-emerald-600',
        branch: authProfile?.branch || 'Engineering',
        role: role.trim() || 'Software Engineer',
        company: company.trim() || 'LNCT Alumni Network',
        experience: experience.trim(),
        topics: selectedTopics,
        availability,
        bio: bio.trim() || 'Available for 1-on-1 mentorship sessions on LNCT Connect.',
      },
      isVerified
    )

    setSubmitting(false)

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to register mentor profile.')
      return
    }

    setSuccess(true)
    if (res.mentor && onRegistered) {
      onRegistered(res.mentor)
    }

    setTimeout(() => {
      onClose()
      setSuccess(false)
    }, 1400)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

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
                  Become a Campus Mentor
                </h3>
                <p className="text-xs font-medium" style={{ color: 'var(--color-ink-muted)' }}>
                  Share your industry insights and guide junior LNCT peers.
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

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMessage && (
              <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {success ? (
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
                  Mentor Profile Activated!
                </h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Your profile is now live in the Alumni Mentorship directory. Students can request guidance sessions directly.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-ink-secondary)' }}>
                      Current Role
                    </label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. SDE-1, Data Analyst"
                      className="w-full rounded-lg border px-3.5 py-2 text-xs"
                      style={{
                        background: 'var(--color-bg-secondary)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-ink)',
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-ink-secondary)' }}>
                      Company / Organization
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Amazon, TCS, Startup"
                      className="w-full rounded-lg border px-3.5 py-2 text-xs"
                      style={{
                        background: 'var(--color-bg-secondary)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-ink)',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-ink-secondary)' }}>
                    Experience & Background *
                  </label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 3 years in full-stack engineering & AWS cloud"
                    className="w-full rounded-lg border px-3.5 py-2 text-xs"
                    style={{
                      background: 'var(--color-bg-secondary)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-ink)',
                    }}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-ink-secondary)' }}>
                      Advisory Topics *
                    </label>
                    <span className="text-[11px] text-zinc-400">Select topics you can guide students on</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                    {suggestedTopics.map((topic) => {
                      const active = selectedTopics.includes(topic)
                      return (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => toggleTopic(topic)}
                          className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors border"
                          style={{
                            background: active ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                            color: active ? '#FFFFFF' : 'var(--color-ink-secondary)',
                            borderColor: active ? 'var(--color-accent)' : 'var(--color-border)',
                          }}
                        >
                          {topic}
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      onKeyDown={addCustomTopic}
                      placeholder="Type custom topic & press Enter..."
                      className="flex-1 rounded-lg border px-3 py-1.5 text-xs"
                      style={{
                        background: 'var(--color-bg-secondary)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-ink)',
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-8 px-3 text-xs"
                      onClick={() => {
                        if (customTopic.trim() && !selectedTopics.includes(customTopic.trim())) {
                          setSelectedTopics([...selectedTopics, customTopic.trim()])
                          setCustomTopic('')
                        }
                      }}
                    >
                      <Plus className="size-3.5 mr-1" /> Add
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-ink-secondary)' }}>
                    Monthly Availability Commitment
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {availabilityOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAvailability(opt)}
                        className="rounded-lg border p-2 text-xs font-medium text-center transition-colors"
                        style={{
                          background: availability === opt ? 'rgba(231, 111, 53, 0.08)' : 'var(--color-bg-secondary)',
                          borderColor: availability === opt ? 'var(--color-accent)' : 'var(--color-border)',
                          color: availability === opt ? 'var(--color-accent)' : 'var(--color-ink-secondary)',
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-ink-secondary)' }}>
                    Short Bio / Guidance Style
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Briefly describe what excites you about mentoring junior engineers..."
                    className="w-full rounded-lg border p-2.5 text-xs transition-colors"
                    style={{
                      background: 'var(--color-bg-secondary)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-ink)',
                    }}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <Button variant="ghost" onClick={onClose} type="button" disabled={submitting}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" disabled={submitting}>
                    {submitting ? 'Activating Profile...' : 'Activate Mentor Profile'}
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
