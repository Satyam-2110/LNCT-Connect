import { useState, useEffect } from 'react'
import { AlertCircle, Bookmark, ChevronRight, ImagePlus, Link2, Plus, Send, UserRound, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/layout'
import { PostCard } from '../components/cards'
import { Avatar, Badge, Button, Card, EmptyState, SectionTitle } from '../components/ui'
import { MagneticButton } from '../components/Interactive'
import { projects } from '../data/projects'
import { students } from '../data/students'
import { useAuth } from '../context/AuthContext'
import { fetchFeed, createPost } from '../services/posts'
import { VerificationModal } from '../components/VerificationModal'
import type { Post } from '../types'
import { cn } from '../lib/utils'

const tagCategories = [
  'All',
  '#BuildInPublic',
  '#AIforEducation',
  '#DesignNotes',
  '#Mentorship',
  '#AlumniConnect',
  '#CampusHacks',
]

const composerPresetTags = [
  '#BuildInPublic',
  '#ProjectUpdate',
  '#CampusNotes',
  '#TechDiscussion',
  '#Mentorship',
]

export function HomePage() {
  const { user, profile: authProfile, isVerified } = useAuth()

  // Feed State
  const [postsList, setPostsList] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTag, setSelectedTag] = useState('All')
  const [savedOnly, setSavedOnly] = useState(false)

  // Composer State
  const [composerOpen, setComposerOpen] = useState(false)
  const [newPost, setNewPost] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>(['#BuildInPublic'])
  const [customTag, setCustomTag] = useState('')
  const [submittingPost, setSubmittingPost] = useState(false)
  const [postedSuccess, setPostedSuccess] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const [verificationOpen, setVerificationOpen] = useState(false)

  // Profile display data
  const displayName = authProfile?.full_name || user?.email?.split('@')[0] || 'Student'
  const displayInitials =
    displayName.trim().split(' ').length > 1
      ? `${displayName.trim().split(' ')[0][0]}${displayName.trim().split(' ')[1][0]}`.toUpperCase()
      : displayName.slice(0, 2).toUpperCase()
  const displayBranch = authProfile?.branch || 'Engineering'
  const displayYear = authProfile?.batch || 'Undergraduate'
  const profileId = user?.id || 'me'

  const loadFeed = async () => {
    setLoading(true)
    const data = await fetchFeed({
      tag: selectedTag,
      savedOnly,
      currentUserId: user?.id,
    })
    setPostsList(data)
    setLoading(false)
  }

  useEffect(() => {
    loadFeed()
  }, [selectedTag, savedOnly, user?.id])

  const toggleTagSelection = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const addCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTag.trim()) {
      e.preventDefault()
      const formatted = customTag.trim().startsWith('#')
        ? customTag.trim()
        : `#${customTag.trim()}`
      if (!selectedTags.includes(formatted)) {
        setSelectedTags([...selectedTags, formatted])
      }
      setCustomTag('')
    }
  }

  const publish = async () => {
    if (!newPost.trim()) return

    if (!user || !isVerified) {
      setVerificationOpen(true)
      return
    }

    setSubmittingPost(true)
    setPostError(null)

    const authorMeta = {
      name: displayName,
      initials: displayInitials,
      avatar: authProfile?.avatar_url || 'warm',
      branch: displayBranch,
      year: displayYear,
    }

    const { error, post: created } = await createPost(
      user.id,
      authorMeta,
      newPost.trim(),
      selectedTags,
      isVerified
    )

    setSubmittingPost(false)

    if (error) {
      setPostError(error.message)
      return
    }

    if (created) {
      setPostsList((prev) => [created, ...prev])
      setPostedSuccess(true)
      setComposerOpen(false)
      setNewPost('')
      setTimeout(() => setPostedSuccess(false), 5000)
    }
  }

  const handlePostDeleted = (postId: string) => {
    setPostsList((prev) => prev.filter((p) => p.id !== postId))
  }

  return (
    <AppShell wide>
      <div className="grid items-start gap-6 xl:grid-cols-[250px_minmax(0,640px)_290px]">
        {/* Left Sidebar: Profile Summary */}
        <aside className="hidden space-y-4 xl:block">
          <Card className="overflow-hidden">
            <div
              className="h-16"
              style={{
                background: 'var(--color-dark-section)',
              }}
            />
            <div className="px-5 pb-5">
              <div className="-mt-8">
                <Avatar name={displayName} initials={displayInitials} tone="warm" size="lg" />
              </div>
              <Link
                to={`/profile/${profileId}`}
                className="font-display mt-3 block text-base font-bold transition hover:text-[var(--color-accent)]"
                style={{ color: 'var(--color-ink)' }}
              >
                {displayName}
              </Link>
              <p className="mt-0.5 text-xs font-medium" style={{ color: 'var(--color-ink-muted)' }}>
                {displayBranch} · {displayYear}
              </p>

              <div
                className="mt-4 border-y py-3.5"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--color-ink-muted)' }}>Verification status</span>
                  <span
                    className={cn(
                      'font-semibold text-xs capitalize',
                      isVerified ? 'text-emerald-600' : 'text-amber-600'
                    )}
                  >
                    {authProfile?.verification_status || (isVerified ? 'Verified' : 'Unverified')}
                  </span>
                </div>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full"
                  style={{ background: 'var(--color-bg-secondary)' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: isVerified ? '100%' : '35%',
                      background: isVerified ? 'rgb(16, 185, 129)' : 'var(--color-accent)',
                    }}
                  />
                </div>
              </div>

              <nav className="mt-3.5 space-y-1">
                <Link
                  to={`/profile/${profileId}`}
                  className="flex items-center justify-between rounded-md px-2 py-2 text-xs font-medium transition hover:bg-[var(--color-bg-secondary)]"
                  style={{ color: 'var(--color-ink-secondary)' }}
                >
                  <span className="flex items-center gap-2.5">
                    <UserRound className="size-3.5" style={{ color: 'var(--color-ink-muted)' }} />
                    My profile
                  </span>
                  <ChevronRight className="size-3 text-[var(--color-ink-muted)]" />
                </Link>

                <Link
                  to="/projects"
                  className="flex items-center justify-between rounded-md px-2 py-2 text-xs font-medium transition hover:bg-[var(--color-bg-secondary)]"
                  style={{ color: 'var(--color-ink-secondary)' }}
                >
                  <span className="flex items-center gap-2.5">
                    <Plus className="size-3.5" style={{ color: 'var(--color-ink-muted)' }} />
                    Campus projects
                  </span>
                  <ChevronRight className="size-3 text-[var(--color-ink-muted)]" />
                </Link>

                <button
                  onClick={() => setSavedOnly(!savedOnly)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2 py-2 text-xs font-medium transition text-left',
                    savedOnly
                      ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold'
                      : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-bg-secondary)]'
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Bookmark
                      className={cn(
                        'size-3.5',
                        savedOnly ? 'text-[var(--color-accent)] fill-current' : 'text-[var(--color-ink-muted)]'
                      )}
                    />
                    Saved items
                  </span>
                  <ChevronRight className="size-3 text-[var(--color-ink-muted)]" />
                </button>
              </nav>
            </div>
          </Card>

          <Card className="p-5">
            <p className="label-sm mb-1.5" style={{ color: 'var(--color-accent)' }}>
              Campus Pulse
            </p>
            <p className="text-xs leading-5" style={{ color: 'var(--color-ink-secondary)' }}>
              {isVerified
                ? 'Your student account is active and verified. Share project updates and collaborate with peers freely.'
                : 'Complete student ID verification to unlock posting, peer connection requests, and collaboration.'}
            </p>
            {!isVerified && (
              <button
                onClick={() => setVerificationOpen(true)}
                className="mt-3.5 block text-xs font-semibold hover:underline"
                style={{ color: 'var(--color-accent)' }}
              >
                Verify identity →
              </button>
            )}
          </Card>
        </aside>

        {/* Center: Social Feed */}
        <section className="space-y-6">
          <div
            className="rounded-xl p-6 border shadow-sm transition-colors duration-400 relative overflow-hidden"
            style={{
              background: 'color-mix(in srgb, var(--color-card) 90%, transparent)',
              borderColor: 'var(--color-border)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 8px 32px -4px rgba(23, 23, 23, 0.06)',
            }}
          >
            <div
              className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full opacity-15 blur-2xl"
              style={{ background: 'var(--color-accent)' }}
            />
            <p className="label-sm mb-1.5 font-bold relative z-10" style={{ color: 'var(--color-accent)' }}>
              Campus Feed
            </p>
            <h1
              className="font-display text-2xl sm:text-3xl font-bold tracking-[-0.03em] relative z-10"
              style={{ color: 'var(--color-ink)' }}
            >
              Welcome, {displayName} <span style={{ color: 'var(--color-accent)' }}>✦</span>
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm font-medium relative z-10 leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
              Explore collaborative project updates, announcements, and peer activity across the LNCT campus.
            </p>
          </div>

          {/* Interactive Post Composer */}
          <Card className="p-5">
            <div className="flex gap-3.5">
              <Avatar name={displayName} initials={displayInitials} tone="warm" />
              <button
                onClick={() => setComposerOpen(true)}
                className="h-10 flex-1 rounded-md border px-4 text-left text-sm transition hover:border-[var(--color-accent)]"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-ink-muted)',
                }}
              >
                What are you building or exploring?
              </button>
            </div>

            <AnimatePresence>
              {composerOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  <textarea
                    autoFocus
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Share a campus project update, technical note, or question…"
                    className="h-28 w-full resize-none rounded-md border p-3.5 text-sm outline-none transition focus:border-[var(--color-accent)]"
                    style={{
                      borderColor: 'var(--color-border)',
                      background: 'var(--color-card)',
                      color: 'var(--color-ink)',
                    }}
                  />

                  {/* Tag Chips Picker */}
                  <div className="mt-3">
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-ink-muted)' }}>
                      Topic Tags:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {composerPresetTags.map((tag) => {
                        const active = selectedTags.includes(tag)
                        return (
                          <button
                            type="button"
                            key={tag}
                            onClick={() => toggleTagSelection(tag)}
                            className={cn(
                              'px-2.5 py-1 rounded-md text-xs font-semibold transition border',
                              active
                                ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                                : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-ink-secondary)] hover:border-[var(--color-accent)]'
                            )}
                          >
                            {tag}
                          </button>
                        )
                      })}
                      {selectedTags
                        .filter((t) => !composerPresetTags.includes(t))
                        .map((tag) => (
                          <span
                            key={tag}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-[var(--color-accent)] text-white border border-[var(--color-accent)]"
                          >
                            {tag}
                            <X
                              className="size-3 cursor-pointer"
                              onClick={() => setSelectedTags(selectedTags.filter((t) => t !== tag))}
                            />
                          </span>
                        ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value)}
                        onKeyDown={addCustomTag}
                        placeholder="Type custom #tag & press Enter…"
                        className="h-8 rounded-md border px-3 text-xs outline-none transition focus:border-[var(--color-accent)]"
                        style={{
                          borderColor: 'var(--color-border)',
                          background: 'var(--color-bg-secondary)',
                          color: 'var(--color-ink)',
                        }}
                      />
                    </div>
                  </div>

                  {postError && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded border border-rose-200 dark:border-rose-900/50">
                      <AlertCircle className="size-4 shrink-0" />
                      {postError}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setComposerOpen(false)}
                        className="rounded-md px-3 py-1.5 text-xs font-medium text-[var(--color-ink-muted)] hover:bg-[var(--color-bg-secondary)]"
                      >
                        Cancel
                      </button>
                    </div>
                    <MagneticButton>
                      <Button
                        size="sm"
                        onClick={publish}
                        disabled={submittingPost || !newPost.trim()}
                      >
                        <Send className="size-3.5" />
                        {submittingPost ? 'Publishing…' : 'Publish Post'}
                      </Button>
                    </MagneticButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!composerOpen && (
              <div
                className="mt-4 flex gap-2 border-t pt-3"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <button
                  onClick={() => setComposerOpen(true)}
                  className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium text-[var(--color-ink-muted)] hover:bg-[var(--color-bg-secondary)]"
                >
                  <ImagePlus className="size-3.5 text-[var(--color-accent)]" />
                  Media update
                </button>
                <button
                  onClick={() => setComposerOpen(true)}
                  className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium text-[var(--color-ink-muted)] hover:bg-[var(--color-bg-secondary)]"
                >
                  <Link2 className="size-3.5 text-[var(--color-accent)]" />
                  Project note
                </button>
              </div>
            )}
          </Card>

          {/* Success Banner */}
          {postedSuccess && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div
                className="rounded-md border p-3.5 text-sm font-medium"
                style={{
                  borderColor: 'rgba(46, 125, 80, 0.3)',
                  background: 'rgba(46, 125, 80, 0.08)',
                  color: '#2E7D50',
                }}
              >
                ✓ Your update is live in the LNCT campus stream.
              </div>
            </motion.div>
          )}

          {/* Feed Filter Chips & Heading */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
                {savedOnly ? 'Saved Posts' : 'Network Stream'}
              </h2>
              {savedOnly && (
                <button
                  onClick={() => setSavedOnly(false)}
                  className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
                >
                  ← Back to full stream
                </button>
              )}
            </div>

            {/* Tag Pills */}
            {!savedOnly && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {tagCategories.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={cn(
                      'whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition border',
                      selectedTag === tag
                        ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                        : 'bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-ink-secondary)] hover:border-[var(--color-accent)]'
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Posts List */}
          {loading ? (
            <div className="py-12 text-center text-sm" style={{ color: 'var(--color-ink-muted)' }}>
              Loading campus updates…
            </div>
          ) : postsList.length > 0 ? (
            <div className="space-y-4">
              {postsList.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPostDeleted={handlePostDeleted}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={savedOnly ? 'No saved posts' : 'No posts found'}
              detail={
                savedOnly
                  ? 'Click the bookmark icon on any post in the stream to save it here for later reference.'
                  : `No posts found under "${selectedTag}". Share the first update with your peers!`
              }
              actionLabel={savedOnly ? 'Browse Full Feed' : 'Reset Tag Filter'}
              onAction={() => {
                setSavedOnly(false)
                setSelectedTag('All')
              }}
            />
          )}
        </section>

        {/* Right Sidebar: Discovery */}
        <aside className="hidden space-y-6 xl:block">
          <Card className="p-5">
            <SectionTitle
              title="Students to Know"
              action={
                <Link
                  to="/people"
                  className="text-xs font-semibold hover:underline"
                  style={{ color: 'var(--color-accent)' }}
                >
                  See all →
                </Link>
              }
            />
            <div className="space-y-4">
              {students.slice(1, 4).map((person) => (
                <div className="flex items-center gap-3" key={person.id}>
                  <Avatar name={person.name} initials={person.initials} tone={person.avatar} size="sm" />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/profile/${person.id}`}
                      className="block truncate text-xs font-bold transition hover:text-[var(--color-accent)]"
                      style={{ color: 'var(--color-ink)' }}
                    >
                      {person.name}
                    </Link>
                    <p className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--color-ink-muted)' }}>
                      {person.skills.slice(0, 2).join(' · ')}
                    </p>
                  </div>
                  <Link
                    to={`/profile/${person.id}`}
                    className="text-xs font-semibold"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          </Card>

          <div>
            <SectionTitle
              title="Active Projects"
              action={
                <Link
                  to="/projects"
                  className="text-xs font-semibold hover:underline"
                  style={{ color: 'var(--color-accent)' }}
                >
                  Explore →
                </Link>
              }
            />
            <div className="space-y-3">
              {projects.slice(0, 2).map((project) => (
                <Card key={project.id} className="p-4 transition hover:border-[rgba(23,23,23,0.18)]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'var(--color-ink)' }}>
                        {project.name}
                      </p>
                      <p className="mt-1 text-[11px] line-clamp-2" style={{ color: 'var(--color-ink-muted)' }}>
                        {project.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t pt-2" style={{ borderColor: 'var(--color-border)' }}>
                    <Badge tone="accent">{project.status}</Badge>
                    <Link
                      to="/projects"
                      className="text-xs font-semibold"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      View →
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Verification Guard Modal */}
      <VerificationModal
        isOpen={verificationOpen}
        onClose={() => setVerificationOpen(false)}
      />
    </AppShell>
  )
}
