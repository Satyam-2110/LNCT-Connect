import { useEffect, useState } from 'react'
import { Bookmark, ChevronRight, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell, PageIntro } from '../components/layout'
import { OpportunityCard } from '../components/cards'
import { Badge, Card, EmptyState, SearchField } from '../components/ui'
import { fetchOpportunities, toggleOpportunityBookmark } from '../services/opportunities'
import { useAuth } from '../context/AuthContext'
import { VerificationModal } from '../components/VerificationModal'
import type { Opportunity } from '../types'

const categories = ['All', 'Internship', 'Job', 'Freelance', 'Hackathon', 'Competition', 'Campus Event'] as const

export function OpportunitiesPage() {
  const { user, profile } = useAuth()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<typeof categories[number]>('All')
  const [savedOnly, setSavedOnly] = useState(false)

  const [opportunitiesList, setOpportunitiesList] = useState<Opportunity[]>([])
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [verificationOpen, setVerificationOpen] = useState(false)

  const loadData = async () => {
    setLoading(true)
    const { opportunities, savedIds: saved } = await fetchOpportunities({
      query,
      category,
      savedOnly,
      currentUserId: user?.id,
    })
    setOpportunitiesList(opportunities)
    setSavedIds(saved)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [query, category, savedOnly, user?.id])

  const handleToggleSave = async (oppId: string) => {
    if (!user) {
      setVerificationOpen(true)
      return
    }

    const isCurrentlySaved = savedIds.includes(oppId)
    // Optimistic update
    setSavedIds((prev) =>
      isCurrentlySaved ? prev.filter((id) => id !== oppId) : [...prev, oppId]
    )

    const { error } = await toggleOpportunityBookmark(oppId, user.id)
    if (error) {
      // Revert if error
      setSavedIds((prev) =>
        isCurrentlySaved ? [...prev, oppId] : prev.filter((id) => id !== oppId)
      )
    }
  }

  return (
    <AppShell wide>
      <PageIntro
        eyebrow="Opportunities Board"
        title="Roles, internships & hackathons"
        detail="Internships, technical roles, competitions, and campus hackathons curated for LNCT students ready to build."
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_290px]">
        <section>
          {/* Search & Saved Filter */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Search roles, organizations, tech stacks, or domains…"
              className="flex-1"
            />
            <button
              onClick={() => setSavedOnly(!savedOnly)}
              className="flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-xs font-semibold transition"
              style={{
                borderColor: savedOnly ? 'var(--color-accent)' : 'var(--color-border)',
                background: savedOnly ? 'var(--color-accent-subtle)' : 'var(--color-card)',
                color: savedOnly ? 'var(--color-accent)' : 'var(--color-ink)',
              }}
            >
              <Bookmark className={`size-3.5 ${savedOnly ? 'fill-current text-[var(--color-accent)]' : ''}`} />
              Saved Roles ({savedIds.length})
            </button>
            {profile?.role === 'admin' && (
              <Link to="/admin">
                <button
                  className="flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-xs font-semibold transition hover:bg-[var(--color-bg-secondary)]"
                  style={{
                    borderColor: 'rgba(231, 111, 53, 0.4)',
                    background: 'var(--color-card)',
                    color: 'var(--color-accent)',
                  }}
                >
                  <Shield className="size-3.5 text-orange-400" />
                  Manage Opportunities
                </button>
              </Link>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="scrollbar-none mt-5 flex gap-2 overflow-x-auto pb-1">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className="whitespace-nowrap rounded-lg px-4 py-2 text-xs font-semibold transition"
                style={{
                  background: category === item ? 'var(--color-dark-section)' : 'var(--color-bg-secondary)',
                  color: category === item ? '#FAF9F6' : 'var(--color-ink-secondary)',
                  border: `1px solid ${category === item ? 'var(--color-dark-section)' : 'var(--color-border)'}`,
                }}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="py-16 text-center text-sm" style={{ color: 'var(--color-ink-muted)' }}>
              Loading curated campus opportunities…
            </div>
          ) : opportunitiesList.length ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {opportunitiesList.map((opportunity) => (
                <div key={opportunity.id} className="relative">
                  <OpportunityCard
                    opportunity={opportunity}
                    isSaved={savedIds.includes(opportunity.id)}
                    onToggleSave={handleToggleSave}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState
                title={savedOnly ? 'No saved opportunities' : 'No opportunities found'}
                detail={
                  savedOnly
                    ? 'Click the bookmark icon on any role or hackathon to save it here for quick access.'
                    : "Try searching another domain, selecting 'All' categories, or clearing your search query."
                }
                actionLabel={savedOnly ? 'Browse All Opportunities' : 'Reset Category Filter'}
                onAction={() => {
                  setSavedOnly(false)
                  setCategory('All')
                  setQuery('')
                }}
              />
            </div>
          )}
        </section>

        {/* Right Sidebar */}
        <aside className="hidden space-y-6 xl:block">
          <Card className="overflow-hidden">
            <div
              className="h-16"
              style={{
                background: 'var(--color-dark-section)',
              }}
            />
            <div className="p-5">
              <p className="label-sm mb-1.5" style={{ color: 'var(--color-accent)' }}>
                Application Checklist
              </p>
              <h3 className="font-display text-sm font-bold" style={{ color: 'var(--color-ink)' }}>
                Preparing for Campus Drives
              </h3>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full" style={{ background: 'var(--color-accent)' }} />
                  Highlight project links and GitHub proof
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full" style={{ background: 'var(--color-accent)' }} />
                  Ask LNCT alumni for referral reviews
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full" style={{ background: 'var(--color-accent)' }} />
                  Keep college enrollment ID verified
                </li>
              </ul>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="label-sm" style={{ color: 'var(--color-accent)' }}>
                Upcoming Hackathons
              </span>
              <Badge tone="accent">Campus Live</Badge>
            </div>
            <p className="font-display mt-2 text-sm font-bold" style={{ color: 'var(--color-ink)' }}>
              HackVerse 2026
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-ink-muted)' }}>
              36-hour sprint · Oct 12 · LNCT Auditorium
            </p>
          </Card>
        </aside>
      </div>

      <VerificationModal
        isOpen={verificationOpen}
        onClose={() => setVerificationOpen(false)}
      />
    </AppShell>
  )
}
