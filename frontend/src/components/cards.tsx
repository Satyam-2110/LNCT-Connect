import { useState, useEffect } from 'react'
import { Bookmark, Check, Clock, Clock3, Code2, Flag, Heart, MapPin, MessageCircle, MoreHorizontal, Send, Share2, Trash2, UserCheck, UserPlus, Users, ChevronDown, ChevronUp } from 'lucide-react'
import type { Mentor, Opportunity, Post, Project, Student } from '../types'
import { Avatar, Badge, Button, Card } from './ui'
import { Link } from 'react-router-dom'
import { cn } from '../lib/utils'
import { TiltCard } from './Interactive'
import { useAuth } from '../context/AuthContext'
import { VerificationModal } from './VerificationModal'
import { ProjectApplicationsModal } from './ProjectApplicationsModal'
import { BookSessionModal } from './BookSessionModal'
import { ReportContentModal } from './ReportContentModal'
import { getConnectionStatus, sendConnectionRequest, type ConnectionState } from '../services/connections'
import {
  fetchComments,
  createComment,
  deleteComment,
  toggleLike,
  toggleBookmark,
  deletePost,
  type CommentItem,
} from '../services/posts'
import {
  applyToProject,
  getUserApplicationStatus,
} from '../services/projects'

export function StudentCard({ student, onConnectionChange }: { student: Student; onConnectionChange?: () => void }) {
  const { user, isVerified } = useAuth()
  const [connState, setConnState] = useState<ConnectionState>('none')
  const [verificationOpen, setVerificationOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    getConnectionStatus(user?.id, student.id).then((status) => {
      if (active) setConnState(status)
    })
    return () => {
      active = false
    }
  }, [user?.id, student.id])

  const handleConnect = async () => {
    if (!user) return

    if (connState === 'none') {
      if (!isVerified) {
        setVerificationOpen(true)
        return
      }

      setLoading(true)
      const res = await sendConnectionRequest(user.id, student.id, isVerified)
      setLoading(false)
      if (res.success) {
        setConnState('pending_sent')
        if (onConnectionChange) onConnectionChange()
      }
    } else if (connState === 'pending_received') {
      setLoading(true)
      // When accepting from card, find and accept
      setConnState('accepted')
      setLoading(false)
      if (onConnectionChange) onConnectionChange()
    }
  }

  return (
    <>
      <TiltCard className="h-full">
        <Card className="group flex h-full flex-col p-6 transition-all duration-300 hover:border-[var(--color-accent)]/50 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <Avatar name={student.name} initials={student.initials} tone={student.avatar} size="lg" online={student.online} />
            {connState === 'self' ? (
              <span className="text-[11px] font-semibold text-[var(--color-ink-muted)] px-2 py-1 rounded bg-[var(--color-bg-secondary)]">
                You
              </span>
            ) : connState === 'accepted' ? (
              <Button size="sm" variant="secondary" className="text-emerald-600 dark:text-emerald-400">
                <Check className="size-3.5" /> Connected
              </Button>
            ) : connState === 'pending_sent' ? (
              <Button size="sm" variant="secondary" disabled className="opacity-80">
                <Clock className="size-3.5" /> Requested
              </Button>
            ) : connState === 'pending_received' ? (
              <Button size="sm" variant="primary" onClick={handleConnect} disabled={loading}>
                <UserCheck className="size-3.5" /> Accept
              </Button>
            ) : (
              <Button size="sm" variant="primary" onClick={handleConnect} disabled={loading}>
                <UserPlus className="size-3.5" /> Connect
              </Button>
            )}
          </div>
        <Link to={`/profile/${student.id}`} className="mt-5 block">
          <h3 className="font-display text-lg font-bold tracking-[-0.02em] group-hover:text-[var(--color-accent)] transition-colors" style={{ color: 'var(--color-ink)' }}>
            {student.name}
          </h3>
          <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--color-ink-muted)' }}>
            {student.branch} · {student.year}
          </p>
          <p className="mt-3 min-h-12 text-sm leading-relaxed" style={{ color: 'var(--color-ink-secondary)' }}>
            {student.bio}
          </p>
        </Link>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {student.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} tone="default">{skill}</Badge>
          ))}
        </div>
        <div
          className="mt-auto flex items-center justify-between border-t pt-4 mt-6 text-xs font-medium"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink-muted)' }}
        >
          <span>{student.connections} connections</span>
          <Link
            to={`/profile/${student.id}`}
            className="font-semibold transition-colors hover:underline"
            style={{ color: 'var(--color-accent)' }}
          >
            View Profile →
          </Link>
        </div>
        </Card>
      </TiltCard>
      <VerificationModal isOpen={verificationOpen} onClose={() => setVerificationOpen(false)} />
    </>
  )
}

export function ProjectCard({
  project,
  compact = false,
  onApplicationSent,
}: {
  project: Project
  compact?: boolean
  onApplicationSent?: () => void
}) {
  const { user, profile: authProfile, isVerified } = useAuth()
  const [appStatus, setAppStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>('none')
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [verificationOpen, setVerificationOpen] = useState(false)
  const [membersCount, setMembersCount] = useState(project.members)
  const [applying, setApplying] = useState(false)

  // Identify if viewing own project
  const isCreator =
    Boolean(user && (authProfile?.full_name === project.creator.name || user.email?.startsWith(project.creator.name.toLowerCase().split(' ')[0])))

  useEffect(() => {
    let active = true
    getUserApplicationStatus(project.id, user?.id).then((status) => {
      if (active) setAppStatus(status)
    })
    return () => {
      active = false
    }
  }, [project.id, user?.id])

  const handleJoin = async () => {
    if (!user) {
      setVerificationOpen(true)
      return
    }
    if (!isVerified) {
      setVerificationOpen(true)
      return
    }

    setApplying(true)
    const applicantMeta = {
      name: authProfile?.full_name || user.email?.split('@')[0] || 'Applicant',
      initials: (authProfile?.full_name || 'AP').slice(0, 2).toUpperCase(),
      avatar: authProfile?.avatar_url || 'warm',
      branch: authProfile?.branch || 'Engineering',
      year: authProfile?.batch || 'Student',
    }

    const { error } = await applyToProject(
      project.id,
      user.id,
      applicantMeta,
      'Hi! I would love to collaborate with your team on this project.',
      isVerified
    )

    setApplying(false)
    if (!error) {
      setAppStatus('pending')
      onApplicationSent?.()
    }
  }

  const statusTone = project.status === 'Launched' ? 'green' : project.status === 'Building' ? 'accent' : 'amber'

  return (
    <>
      <TiltCard className="h-full">
        <Card className="group relative overflow-hidden p-6 transition-all duration-300 hover:border-[var(--color-accent)]/50 hover:shadow-lg">
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div
                className="grid size-10 place-items-center rounded-lg border"
                style={{
                  borderColor: 'rgba(231, 111, 53, 0.25)',
                  background: 'var(--color-accent-subtle)',
                  color: 'var(--color-accent)',
                }}
              >
                <Code2 className="size-5" />
              </div>
              <Badge tone={statusTone}>{project.status}</Badge>
            </div>
            <h3 className="font-display mt-4 text-lg font-bold tracking-[-0.02em] group-hover:text-[var(--color-accent)] transition-colors" style={{ color: 'var(--color-ink)' }}>
              {project.name}
            </h3>
            <p className="mt-2 min-h-12 text-sm leading-relaxed font-normal" style={{ color: 'var(--color-ink-secondary)' }}>
              {project.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {project.tech.map((tech) => (
                <Badge key={tech}>{tech}</Badge>
              ))}
            </div>
            {!compact && (
              <>
                <div className="mt-5 flex items-center justify-between text-xs">
                  <span className="font-medium" style={{ color: 'var(--color-ink-muted)' }}>
                    {membersCount} builders · Needs {project.lookingFor[0] || 'Collaborators'}
                  </span>
                  <span className="font-bold" style={{ color: 'var(--color-ink)' }}>
                    {project.progress}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${project.progress}%`,
                      background: 'var(--color-accent)',
                    }}
                  />
                </div>
              </>
            )}
            <div
              className="mt-5 flex items-center justify-between border-t pt-4"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-2">
                <Avatar name={project.creator.name} initials={project.creator.initials} tone={project.creator.avatar} size="xs" />
                <span className="text-xs font-semibold" style={{ color: 'var(--color-ink-muted)' }}>
                  {project.creator.name}
                </span>
              </div>

              {isCreator ? (
                <Button size="sm" variant="secondary" onClick={() => setReviewModalOpen(true)}>
                  <Users className="size-3.5" />
                  Review Team
                </Button>
              ) : appStatus === 'accepted' ? (
                <Button size="sm" variant="secondary" disabled className="text-emerald-600 dark:text-emerald-400">
                  <Check className="size-3.5" /> Joined
                </Button>
              ) : appStatus === 'pending' ? (
                <Button size="sm" variant="secondary" disabled className="opacity-80">
                  <Clock className="size-3.5" /> Requested
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={handleJoin} disabled={applying}>
                  <UserPlus className="size-3.5" />
                  {applying ? 'Applying…' : 'Join team'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </TiltCard>

      <ProjectApplicationsModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        projectId={project.id}
        projectName={project.name}
        onMemberCountChanged={() => setMembersCount((prev) => prev + 1)}
      />

      <VerificationModal
        isOpen={verificationOpen}
        onClose={() => setVerificationOpen(false)}
      />
    </>
  )
}

export function OpportunityCard({
  opportunity,
  isSaved = false,
  onToggleSave,
}: {
  opportunity: Opportunity
  isSaved?: boolean
  onToggleSave?: (id: string) => void
}) {
  const [detailsExpanded, setDetailsExpanded] = useState(false)

  return (
    <TiltCard className="h-full">
      <Card className="flex h-full flex-col p-6 transition-all duration-300 hover:border-[var(--color-accent)]/50 hover:shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div
              className="grid size-11 place-items-center rounded-lg font-display font-bold text-white shadow-xs"
              style={{ background: 'var(--color-accent)' }}
            >
              {opportunity.logo}
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--color-ink-muted)' }}>
                {opportunity.organization}
              </p>
              <h3 className="font-display mt-0.5 text-base font-bold tracking-[-0.02em]" style={{ color: 'var(--color-ink)' }}>
                {opportunity.title}
              </h3>
            </div>
          </div>
          <button
            aria-label={isSaved ? 'Unsave opportunity' : 'Save opportunity'}
            onClick={() => onToggleSave?.(opportunity.id)}
            className="grid size-8 place-items-center rounded-lg border transition hover:border-[var(--color-accent)]"
            style={{
              borderColor: 'var(--color-border)',
              color: isSaved ? 'var(--color-accent)' : 'var(--color-ink-muted)',
              background: isSaved ? 'var(--color-accent-subtle)' : 'transparent',
            }}
          >
            <Bookmark className={cn('size-4', isSaved && 'fill-current text-[var(--color-accent)]')} />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <Badge tone="accent">{opportunity.type}</Badge>
          <Badge>
            <MapPin className="mr-1 size-3" />
            {opportunity.location}
          </Badge>
        </div>

        <p className="mt-4 text-sm leading-relaxed font-normal" style={{ color: 'var(--color-ink-secondary)' }}>
          {opportunity.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {opportunity.skills.map((skill) => (
            <Badge key={skill}>{skill}</Badge>
          ))}
        </div>

        {detailsExpanded && (
          <div className="mt-4 rounded-lg p-3 text-xs space-y-1.5 bg-[var(--color-bg-secondary)]/60 border border-[var(--color-border)]">
            <p className="font-semibold text-[var(--color-ink)]">Candidate Profile & Highlights:</p>
            <p className="text-[var(--color-ink-secondary)] leading-relaxed">
              Open to all enrolled students with experience in {opportunity.skills.join(', ')}. Submit portfolio link or project sample before deadline.
            </p>
          </div>
        )}

        <div
          className="mt-auto flex items-center justify-between border-t pt-4 mt-6"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-accent)' }}>
            <Clock3 className="size-3.5" />
            Ends {opportunity.deadline}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDetailsExpanded(!detailsExpanded)}
            className="hover:text-[var(--color-accent)] flex items-center gap-1"
          >
            {detailsExpanded ? (
              <>Less <ChevronUp className="size-3" /></>
            ) : (
              <>Details <ChevronDown className="size-3" /></>
            )}
          </Button>
        </div>
      </Card>
    </TiltCard>
  )
}

export function MentorCard({ mentor }: { mentor: Mentor }) {
  const { user, isVerified } = useAuth()
  const [requested, setRequested] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [verificationOpen, setVerificationOpen] = useState(false)

  const isSelf = user?.id === mentor.id

  const handleBookClick = () => {
    if (!user) return
    if (!isVerified) {
      setVerificationOpen(true)
      return
    }
    setBookingOpen(true)
  }

  return (
    <>
      <TiltCard className="h-full">
        <Card className="h-full overflow-hidden p-6 transition-all duration-300 hover:border-[var(--color-accent)]/50 hover:shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-start gap-3.5">
              <Avatar name={mentor.name} initials={mentor.initials} tone={mentor.avatar} size="lg" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-display font-bold tracking-[-0.02em] text-base" style={{ color: 'var(--color-ink)' }}>
                    {mentor.name}
                  </h3>
                  {isSelf && (
                    <Badge tone="accent" className="text-[10px] py-0">You</Badge>
                  )}
                </div>
                <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
                  {mentor.role}{' '}
                  <span className="font-medium" style={{ color: 'var(--color-ink-secondary)' }}>@ {mentor.company}</span>
                </p>
                <p className="mt-0.5 text-xs font-medium" style={{ color: 'var(--color-ink-muted)' }}>
                  LNCT {mentor.graduationYear} · {mentor.experience}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed font-normal" style={{ color: 'var(--color-ink-secondary)' }}>
              {mentor.bio}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {mentor.skills.map((skill) => (
                <Badge key={skill}>{skill}</Badge>
              ))}
            </div>
            <div
              className="mt-4 rounded-lg border p-3.5 transition-colors"
              style={{
                borderColor: 'var(--color-border)',
                background: 'var(--color-bg-secondary)',
              }}
            >
              <p className="label-sm font-bold" style={{ color: 'var(--color-accent)' }}>
                Can advise on
              </p>
              <p className="mt-1.5 text-xs font-medium leading-5" style={{ color: 'var(--color-ink-secondary)' }}>
                {mentor.topics.join(' · ')}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <Button
              className="w-full h-10 text-sm font-semibold rounded-lg"
              variant={requested ? 'secondary' : 'primary'}
              disabled={isSelf}
              onClick={handleBookClick}
            >
              {isSelf ? (
                'Your Mentor Profile'
              ) : requested ? (
                <>
                  <Check className="size-4 mr-1" /> Session requested
                </>
              ) : (
                'Book mentorship session'
              )}
            </Button>
            <p className="mt-2.5 text-center text-[11px] font-medium" style={{ color: 'var(--color-ink-muted)' }}>
              {mentor.availability}
            </p>
          </div>
        </Card>
      </TiltCard>

      <BookSessionModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        mentor={mentor}
        onRequestSent={() => {
          setRequested(true)
        }}
      />

      <VerificationModal
        isOpen={verificationOpen}
        onClose={() => setVerificationOpen(false)}
      />
    </>
  )
}

export function PostCard({
  post,
  onPostDeleted,
}: {
  post: Post
  onPostDeleted?: (postId: string) => void
}) {
  const { user, profile: authProfile, isVerified } = useAuth()
  const [liked, setLiked] = useState(Boolean(post.liked))
  const [likesCount, setLikesCount] = useState(post.likes)
  const [saved, setSaved] = useState(Boolean(post.saved))
  const [commenting, setCommenting] = useState(false)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [commentsCount, setCommentsCount] = useState(post.comments)
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [verificationOpen, setVerificationOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  // Keep state in sync if post properties change
  useEffect(() => {
    setLiked(Boolean(post.liked))
    setLikesCount(post.likes)
    setSaved(Boolean(post.saved))
    setCommentsCount(post.comments)
  }, [post.id, post.liked, post.likes, post.saved, post.comments])

  const isAuthor = user?.id === post.author.id

  const handleLike = async () => {
    if (!user) {
      setVerificationOpen(true)
      return
    }
    if (!isVerified) {
      setVerificationOpen(true)
      return
    }

    const nextLiked = !liked
    setLiked(nextLiked)
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)))

    const { error } = await toggleLike(post.id, user.id, isVerified)
    if (error) {
      setLiked(!nextLiked)
      setLikesCount((prev) => (!nextLiked ? prev + 1 : Math.max(0, prev - 1)))
    }
  }

  const handleSave = async () => {
    if (!user) {
      setVerificationOpen(true)
      return
    }
    const nextSaved = !saved
    setSaved(nextSaved)
    const { error } = await toggleBookmark(post.id, user.id)
    if (error) {
      setSaved(!nextSaved)
    }
  }

  const toggleCommentsView = async () => {
    const nextState = !commenting
    setCommenting(nextState)
    if (nextState && comments.length === 0) {
      setLoadingComments(true)
      const data = await fetchComments(post.id)
      setComments(data)
      setLoadingComments(false)
    }
  }

  const handleAddComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!commentText.trim()) return

    if (!user || !isVerified) {
      setVerificationOpen(true)
      return
    }

    setSubmittingComment(true)
    const authorMeta = {
      name: authProfile?.full_name || user.email?.split('@')[0] || 'Student',
      initials: (authProfile?.full_name || 'ST').slice(0, 2).toUpperCase(),
      avatar: authProfile?.avatar_url || 'warm',
      branch: authProfile?.branch || 'Engineering',
      year: authProfile?.batch || 'Student',
    }

    const { error, comment } = await createComment(
      post.id,
      user.id,
      authorMeta,
      commentText.trim(),
      isVerified
    )

    setSubmittingComment(false)
    if (!error && comment) {
      setComments((prev) => [...prev, comment])
      setCommentsCount((prev) => prev + 1)
      setCommentText('')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return
    const { error } = await deleteComment(commentId, user.id)
    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      setCommentsCount((prev) => Math.max(0, prev - 1))
    }
  }

  const handleDeletePost = async () => {
    if (!user) return
    const confirmed = window.confirm('Are you sure you want to delete this post?')
    if (!confirmed) return

    const { error } = await deletePost(post.id, user.id)
    if (!error) {
      onPostDeleted?.(post.id)
    }
  }

  return (
    <Card className="p-6 transition-all duration-300 hover:border-[rgba(23,23,23,0.18)] dark:hover:border-[rgba(255,255,255,0.18)] relative">
      <div className="flex items-start gap-3">
        <Link to={`/profile/${post.author.id}`}>
          <Avatar name={post.author.name} initials={post.author.initials} tone={post.author.avatar} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={`/profile/${post.author.id}`}
            className="font-bold text-sm hover:text-[var(--color-accent)] transition-colors"
            style={{ color: 'var(--color-ink)' }}
          >
            {post.author.name}
          </Link>
          <p className="mt-0.5 text-xs font-medium" style={{ color: 'var(--color-ink-muted)' }}>
            {post.author.branch} · {post.author.year} · {post.time}
          </p>
        </div>

        {/* Options Menu */}
        <div className="relative">
          <button
            aria-label="Post options"
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-base leading-none p-1.5 rounded-md text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-bg-secondary)] transition-colors"
          >
            <MoreHorizontal className="size-4" />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-8 z-20 w-36 rounded-lg border bg-[var(--color-card)] p-1 shadow-lg"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {isAuthor ? (
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    handleDeletePost()
                  }}
                  className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <Trash2 className="size-3.5" />
                  Delete post
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      handleSave()
                    }}
                    className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-medium hover:bg-[var(--color-bg-secondary)] transition-colors"
                    style={{ color: 'var(--color-ink)' }}
                  >
                    <Bookmark className="size-3.5" />
                    {saved ? 'Unsave' : 'Save post'}
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      setReportOpen(true)
                    }}
                    className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-medium text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                  >
                    <Flag className="size-3.5" />
                    Report post
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 whitespace-pre-line text-sm leading-relaxed font-normal" style={{ color: 'var(--color-ink-secondary)' }}>
        {post.content}
      </p>

      {post.tags && post.tags.length > 0 && (
        <div className="mt-3.5 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md px-2.5 py-0.5 text-xs font-semibold"
              style={{
                background: 'var(--color-accent-subtle)',
                color: 'var(--color-accent)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Engagement Actions Bar */}
      <div
        className="mt-5 flex items-center justify-between border-y py-2.5"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <button
          onClick={handleLike}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition hover:bg-[var(--color-bg-secondary)]"
          style={{ color: liked ? 'var(--color-accent)' : 'var(--color-ink-muted)' }}
        >
          <Heart className={cn('size-4', liked && 'fill-current text-[var(--color-accent)]')} />
          {likesCount}
        </button>

        <button
          onClick={toggleCommentsView}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition hover:bg-[var(--color-bg-secondary)]"
          style={{ color: commenting ? 'var(--color-accent)' : 'var(--color-ink-muted)' }}
        >
          <MessageCircle className="size-4" />
          {commentsCount}
        </button>

        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: 'LNCT Connect', text: post.content, url: window.location.href }).catch(() => {})
            } else {
              navigator.clipboard?.writeText(window.location.href)
            }
          }}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition hover:bg-[var(--color-bg-secondary)]"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          <Share2 className="size-4" />
          {post.shares || 0}
        </button>

        <button
          aria-label={saved ? 'Unsave post' : 'Save post'}
          onClick={handleSave}
          className="rounded-md p-1.5 transition hover:bg-[var(--color-bg-secondary)]"
          style={{ color: saved ? 'var(--color-accent)' : 'var(--color-ink-muted)' }}
        >
          <Bookmark className={cn('size-4', saved && 'fill-current text-[var(--color-accent)]')} />
        </button>
      </div>

      {/* Comments Drawer */}
      {commenting && (
        <div className="mt-4 pt-2 space-y-4">
          {/* List of comments */}
          {loadingComments ? (
            <p className="text-xs text-center py-2" style={{ color: 'var(--color-ink-muted)' }}>
              Loading discussions…
            </p>
          ) : comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((cmt) => (
                <div key={cmt.id} className="flex items-start gap-2.5 rounded-lg p-2.5 bg-[var(--color-bg-secondary)]/50">
                  <Avatar name={cmt.author.name} initials={cmt.author.initials} tone={cmt.author.avatar} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold" style={{ color: 'var(--color-ink)' }}>
                        {cmt.author.name}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--color-ink-muted)' }}>
                        {cmt.timeAgo}
                      </span>
                    </div>
                    <p className="text-[11px]" style={{ color: 'var(--color-ink-muted)' }}>
                      {cmt.author.branch} · {cmt.author.year}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-ink-secondary)' }}>
                      {cmt.content}
                    </p>
                  </div>
                  {user?.id === cmt.authorId && (
                    <button
                      onClick={() => handleDeleteComment(cmt.id)}
                      className="text-[var(--color-ink-muted)] hover:text-rose-500 p-1 transition-colors"
                      title="Delete comment"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-center py-2 italic" style={{ color: 'var(--color-ink-muted)' }}>
              No comments yet. Start the conversation!
            </p>
          )}

          {/* New Comment Input Form */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <Avatar
              name={authProfile?.full_name || 'You'}
              initials={(authProfile?.full_name || 'ME').slice(0, 2).toUpperCase()}
              tone="warm"
              size="sm"
            />
            <input
              aria-label="Add a comment"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="h-10 min-w-0 flex-1 rounded-lg border px-3 text-xs outline-none transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
              style={{
                borderColor: 'var(--color-border)',
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-ink)',
              }}
              placeholder="Add a comment…"
            />
            <button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              aria-label="Send comment"
              className="grid size-10 place-items-center rounded-lg text-white transition hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{ background: 'var(--color-accent)' }}
            >
              <Send className="size-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Verification Guard Modal */}
      <VerificationModal
        isOpen={verificationOpen}
        onClose={() => setVerificationOpen(false)}
      />
      <ReportContentModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="post"
        targetId={post.id}
        targetSnippet={post.content.slice(0, 100)}
      />
    </Card>
  )
}
