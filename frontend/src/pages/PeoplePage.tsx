import { useEffect, useState, useTransition } from 'react'
import { Check, Clock, SlidersHorizontal, UserCheck, UserPlus, Users, X } from 'lucide-react'
import { AppShell, PageIntro } from '../components/layout'
import { StudentCard } from '../components/cards'
import { Avatar, Button, Card, EmptyState, SearchField } from '../components/ui'
import { fetchProfiles } from '../services/profiles'
import { fetchPendingRequests, respondToConnectionRequest, type PendingRequest } from '../services/connections'
import { useAuth } from '../context/AuthContext'
import type { Student } from '../types'
import { Link } from 'react-router-dom'

const branches = ['All branches', 'Computer Science', 'Information Technology', 'Electronics & Communication', 'MBA']
const years = ['Any year', '2nd year', '3rd year', '4th year', 'Alumni']
const skills = ['All skills', 'React', 'Python', 'UI/UX', 'Node.js', 'Data Science', 'TypeScript', 'Java']

export function PeoplePage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'explore' | 'requests'>('explore')

  // Search & Filter State
  const [query, setQuery] = useState('')
  const [branch, setBranch] = useState(branches[0])
  const [year, setYear] = useState(years[0])
  const [skill, setSkill] = useState(skills[0])
  const [alumni, setAlumni] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Data State
  const [studentsList, setStudentsList] = useState<Student[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const loadData = async () => {
    setLoading(true)
    const [profiles, requests] = await Promise.all([
      fetchProfiles({ query, branch, year, skill, alumni }),
      user ? fetchPendingRequests(user.id) : Promise.resolve([]),
    ])
    setStudentsList(profiles)
    setPendingRequests(requests)
    setLoading(false)
  }

  useEffect(() => {
    startTransition(() => {
      loadData()
    })
  }, [query, branch, year, skill, alumni, user?.id])

  const active = [branch !== branches[0], year !== years[0], skill !== skills[0], alumni].filter(Boolean).length

  const clear = () => {
    setBranch(branches[0])
    setYear(years[0])
    setSkill(skills[0])
    setAlumni(false)
    setQuery('')
  }

  const handleRespond = async (connectionId: string, accept: boolean) => {
    if (!user) return
    await respondToConnectionRequest(connectionId, accept, user.id)
    const refreshed = await fetchPendingRequests(user.id)
    setPendingRequests(refreshed)
  }

  return (
    <AppShell wide>
      <PageIntro
        eyebrow="Campus Directory"
        title="Discover your LNCT network"
        detail="Find ambitious peers, collaborative project builders, and alumni mentors across every department and graduating class."
      />

      {/* View Switcher: Explore vs Pending Requests */}
      <div className="mb-8 flex items-center gap-3 border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={() => setActiveTab('explore')}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition"
          style={{
            background: activeTab === 'explore' ? 'var(--color-accent)' : 'transparent',
            color: activeTab === 'explore' ? '#FFFFFF' : 'var(--color-ink-secondary)',
          }}
        >
          <Users className="size-4" />
          <span>Explore Network</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition relative"
          style={{
            background: activeTab === 'requests' ? 'var(--color-accent)' : 'transparent',
            color: activeTab === 'requests' ? '#FFFFFF' : 'var(--color-ink-secondary)',
          }}
        >
          <Clock className="size-4" />
          <span>Pending Requests</span>
          {pendingRequests.length > 0 && (
            <span
              className="ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{
                background: activeTab === 'requests' ? 'rgba(255,255,255,0.25)' : 'var(--color-accent)',
                color: '#FFFFFF',
              }}
            >
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'explore' ? (
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Desktop Filter Aside */}
          <aside className="hidden h-fit lg:block">
            <Card className="p-5">
              <FilterPanel
                branch={branch}
                setBranch={setBranch}
                year={year}
                setYear={setYear}
                skill={skill}
                setSkill={setSkill}
                alumni={alumni}
                setAlumni={setAlumni}
                clear={clear}
              />
            </Card>
          </aside>

          {/* Directory Content */}
          <section>
            <div className="flex flex-col gap-3 sm:flex-row">
              <SearchField
                className="flex-1"
                value={query}
                onChange={setQuery}
                placeholder="Search by student name, branch, skills, or interests…"
              />
              <Button
                variant="secondary"
                className="lg:hidden"
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                <SlidersHorizontal className="size-4" />
                Filters{' '}
                {active > 0 && (
                  <span
                    className="grid size-4 place-items-center rounded-full text-[10px] text-white"
                    style={{ background: 'var(--color-accent)' }}
                  >
                    {active}
                  </span>
                )}
              </Button>
            </div>

            {/* Mobile Filter Modal/Drawer */}
            {filtersOpen && (
              <div className="mt-3 lg:hidden">
                <Card className="p-5">
                  <FilterPanel
                    branch={branch}
                    setBranch={setBranch}
                    year={year}
                    setYear={setYear}
                    skill={skill}
                    setSkill={setSkill}
                    alumni={alumni}
                    setAlumni={setAlumni}
                    clear={clear}
                  />
                </Card>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>
                Showing{' '}
                <span className="font-bold" style={{ color: 'var(--color-ink)' }}>
                  {studentsList.length}
                </span>{' '}
                students and alumni
              </p>
              {active > 0 && (
                <button
                  onClick={clear}
                  className="flex items-center gap-1 text-xs font-semibold hover:underline"
                  style={{ color: 'var(--color-accent)' }}
                >
                  <X className="size-3" />
                  Clear all filters
                </button>
              )}
            </div>

            {studentsList.length ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {studentsList.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onConnectionChange={loadData}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-8">
                <EmptyState
                  title="No matching students found"
                  description="Try broadening your search term or resetting your active department and skill filters."
                  actionLabel="Clear Filters"
                  onAction={clear}
                />
              </div>
            )}
          </section>
        </div>
      ) : (
        /* Pending Requests View */
        <section className="max-w-3xl">
          <div className="mb-6">
            <h2 className="font-display text-xl font-bold" style={{ color: 'var(--color-ink)' }}>
              Incoming Connection Requests
            </h2>
            <p className="text-xs text-[var(--color-ink-muted)] mt-1">
              Peers who have invited you to connect and collaborate on LNCT Connect.
            </p>
          </div>

          {pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((req) => (
                <Card key={req.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <Avatar
                      name={req.requester.name}
                      initials={req.requester.initials}
                      tone={req.requester.avatar}
                      size="md"
                    />
                    <div>
                      <Link
                        to={`/profile/${req.requester.id}`}
                        className="font-display text-base font-bold hover:underline"
                        style={{ color: 'var(--color-ink)' }}
                      >
                        {req.requester.name}
                      </Link>
                      <p className="text-xs text-[var(--color-ink-muted)]">
                        {req.requester.branch} · {req.requester.year}
                      </p>
                      <p className="text-xs text-[var(--color-ink-secondary)] mt-1 line-clamp-1 max-w-md">
                        {req.requester.bio}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-0 border-[var(--color-border)]">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleRespond(req.id, false)}
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleRespond(req.id, true)}
                    >
                      <UserCheck className="size-3.5" /> Accept
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No pending connection requests"
              description="When other students or alumni send you connection invitations, they will appear here for your review."
              actionLabel="Explore Campus Directory"
              onAction={() => setActiveTab('explore')}
            />
          )}
        </section>
      )}
    </AppShell>
  )
}

function FilterPanel({
  branch,
  setBranch,
  year,
  setYear,
  skill,
  setSkill,
  alumni,
  setAlumni,
  clear,
}: {
  branch: string
  setBranch: (v: string) => void
  year: string
  setYear: (v: string) => void
  skill: string
  setSkill: (v: string) => void
  alumni: boolean
  setAlumni: (v: boolean) => void
  clear: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--color-border)' }}>
        <span className="label-sm" style={{ color: 'var(--color-ink)' }}>
          Directory Filters
        </span>
        <button
          onClick={clear}
          className="text-xs text-[var(--color-accent)] hover:underline font-medium"
        >
          Reset
        </button>
      </div>

      {/* Branch selector */}
      <div>
        <label className="label-sm mb-2 block" style={{ color: 'var(--color-ink-secondary)' }}>
          Branch / Dept
        </label>
        <div className="space-y-1">
          {branches.map((b) => (
            <button
              key={b}
              onClick={() => setBranch(b)}
              className="w-full text-left text-xs px-2.5 py-1.5 rounded transition font-medium"
              style={{
                background: branch === b ? 'var(--color-accent-subtle)' : 'transparent',
                color: branch === b ? 'var(--color-accent)' : 'var(--color-ink-secondary)',
                fontWeight: branch === b ? 600 : 400,
              }}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Year selector */}
      <div>
        <label className="label-sm mb-2 block" style={{ color: 'var(--color-ink-secondary)' }}>
          Academic Year
        </label>
        <div className="space-y-1">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className="w-full text-left text-xs px-2.5 py-1.5 rounded transition font-medium"
              style={{
                background: year === y ? 'var(--color-accent-subtle)' : 'transparent',
                color: year === y ? 'var(--color-accent)' : 'var(--color-ink-secondary)',
                fontWeight: year === y ? 600 : 400,
              }}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div>
        <label className="label-sm mb-2 block" style={{ color: 'var(--color-ink-secondary)' }}>
          Top Skills
        </label>
        <div className="space-y-1">
          {skills.map((s) => (
            <button
              key={s}
              onClick={() => setSkill(s)}
              className="w-full text-left text-xs px-2.5 py-1.5 rounded transition font-medium"
              style={{
                background: skill === s ? 'var(--color-accent-subtle)' : 'transparent',
                color: skill === s ? 'var(--color-accent)' : 'var(--color-ink-secondary)',
                fontWeight: skill === s ? 600 : 400,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Alumni toggle */}
      <div className="pt-2 border-t border-[var(--color-border)]">
        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>
          <input
            type="checkbox"
            checked={alumni}
            onChange={(e) => setAlumni(e.target.checked)}
            className="rounded accent-[var(--color-accent)] size-4"
          />
          <span>Show Alumni Only</span>
        </label>
      </div>
    </div>
  )
}
