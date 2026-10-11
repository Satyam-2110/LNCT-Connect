import { useState, useEffect } from 'react'
import { ArrowRight, Bell, Check, HeartHandshake, Sparkles, UserCheck } from 'lucide-react'
import { AppShell } from '../components/layout'
import { MentorCard } from '../components/cards'
import { Badge, Button, Card, EmptyState, SearchField } from '../components/ui'
import { MagneticButton } from '../components/Interactive'
import { useAuth } from '../context/AuthContext'
import { fetchMentors, fetchMentorshipRequests, type MentorshipRequest } from '../services/mentorship'
import { MentorApplicationModal } from '../components/MentorApplicationModal'
import { MentorRequestsModal } from '../components/MentorRequestsModal'
import { VerificationModal } from '../components/VerificationModal'
import type { Mentor } from '../types'

const topicFilters = [
  'All Topics',
  'System Design',
  'Career Roadmap',
  'Placement Prep',
  'Frontend Engineering',
  'Data Careers',
  'Startups',
]

export function MentorshipPage() {
  const { user, isVerified } = useAuth()

  const [mentorsList, setMentorsList] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('All Topics')

  const [applicationModalOpen, setApplicationModalOpen] = useState(false)
  const [requestsModalOpen, setRequestsModalOpen] = useState(false)
  const [verificationOpen, setVerificationOpen] = useState(false)

  const [mentorRequests, setMentorRequests] = useState<MentorshipRequest[]>([])

  const loadMentors = async () => {
    setLoading(true)
    const topic = selectedTopic === 'All Topics' ? undefined : selectedTopic
    const data = await fetchMentors({ query, topic })
    setMentorsList(data)
    setLoading(false)
  }

  const loadIncomingRequests = async () => {
    if (!user) return
    const reqs = await fetchMentorshipRequests(user.id, 'mentor')
    setMentorRequests(reqs)
  }

  useEffect(() => {
    loadMentors()
  }, [query, selectedTopic])

  useEffect(() => {
    if (user) {
      loadIncomingRequests()
    }
  }, [user])

  const pendingCount = mentorRequests.filter((r) => r.status === 'pending').length
  const isRegisteredMentor = mentorsList.some((m) => m.id === user?.id)

  const handleBecomeMentorClick = () => {
    if (!user) return
    if (!isVerified) {
      setVerificationOpen(true)
      return
    }
    setApplicationModalOpen(true)
  }

  return (
    <AppShell wide>
      {/* Top Editorial Banner (Dark section #20211F) */}
      <div
        className="relative overflow-hidden rounded-xl border p-8 sm:p-10"
        style={{
          background: 'var(--color-dark-section)',
          borderColor: '#323330',
        }}
      >
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <Badge tone="accent">
              <HeartHandshake className="mr-1.5 size-3.5" />
              Alumni Mentorship Initiative
            </Badge>
            <h1 className="font-display mt-4 text-3xl font-bold tracking-[-0.04em] text-[#FAF9F6] sm:text-4xl">
              Learn from alumni who walked the path.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#B0ADA8] sm:text-base">
              A 30-minute conversation with someone who navigated the same placements, career transitions, and codebases can save months of trial and error.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {user && (isRegisteredMentor || mentorRequests.length > 0) && (
              <Button
                variant="secondary"
                className="relative"
                onClick={() => setRequestsModalOpen(true)}
              >
                <Bell className="size-4 mr-1.5" />
                Review Requests
                {pendingCount > 0 && (
                  <span className="ml-2 inline-flex size-5 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white">
                    {pendingCount}
                  </span>
                )}
              </Button>
            )}

            <MagneticButton>
              <Button
                variant="primary"
                onClick={handleBecomeMentorClick}
              >
                {isRegisteredMentor ? (
                  <>
                    <UserCheck className="size-4 mr-1.5" /> Update Mentor Profile
                  </>
                ) : (
                  <>
                    Become a Mentor <ArrowRight className="size-4 ml-1.5" />
                  </>
                )}
              </Button>
            </MagneticButton>
          </div>
        </div>
      </div>

      {/* Directory Controls & Topic Filters */}
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold" style={{ color: 'var(--color-ink)' }}>
            Available Mentors
          </h2>
          <p className="mt-0.5 text-xs font-medium" style={{ color: 'var(--color-ink-muted)' }}>
            Verified LNCT alumni offering 1-on-1 guidance sessions.
          </p>
        </div>
        <SearchField
          className="w-full sm:w-80"
          value={query}
          onChange={setQuery}
          placeholder="Filter by role, company, or domain…"
        />
      </div>

      {/* Topic Filter Chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {topicFilters.map((topic) => {
          const active = selectedTopic === topic
          return (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all border"
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

      {/* Mentor Cards Grid */}
      {loading ? (
        <div className="mt-12 py-16 text-center text-xs font-medium text-zinc-400">
          Loading alumni mentors...
        </div>
      ) : mentorsList.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No mentors found"
            description="Try modifying your topic filter or search query to discover more alumni mentors."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {mentorsList.map((mentor) => (
            <MentorCard key={mentor.id} mentor={mentor} />
          ))}
        </div>
      )}

      {/* Guidance Note */}
      <Card
        className="mt-12 p-6"
        style={{
          background: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-accent)' }}>
              <Sparkles className="size-4" />
              How to craft a high-impact mentorship request
            </p>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed" style={{ color: 'var(--color-ink-secondary)' }}>
              Share what you are currently building, the specific technical or career bottleneck you are facing, and what a 20-minute discussion will unlock. Specificity yields great conversations.
            </p>
          </div>
          <Button variant="secondary" onClick={() => setApplicationModalOpen(true)}>
            Join Mentorship Roster
          </Button>
        </div>
      </Card>

      {/* Modals */}
      <MentorApplicationModal
        isOpen={applicationModalOpen}
        onClose={() => setApplicationModalOpen(false)}
        onRegistered={() => {
          loadMentors()
          loadIncomingRequests()
        }}
      />

      {user && (
        <MentorRequestsModal
          isOpen={requestsModalOpen}
          onClose={() => setRequestsModalOpen(false)}
          mentorId={user.id}
          onRequestUpdated={() => {
            loadIncomingRequests()
          }}
        />
      )}

      <VerificationModal
        isOpen={verificationOpen}
        onClose={() => setVerificationOpen(false)}
      />
    </AppShell>
  )
}
