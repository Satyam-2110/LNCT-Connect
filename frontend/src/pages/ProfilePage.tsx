import { useEffect, useState, type ReactNode } from 'react'
import {
  BriefcaseBusiness,
  Check,
  Clock,
  ExternalLink,
  GitFork as Github,
  GraduationCap,
  Link as LinkIcon,
  MapPin,
  MessageCircle,
  Pencil,
  ShieldCheck,
  UserCheck,
  UserPlus,
} from 'lucide-react'
import { useParams, Link } from 'react-router-dom'
import { AppShell } from '../components/layout'
import { ProjectCard } from '../components/cards'
import { Avatar, Badge, Button, Card, SectionTitle } from '../components/ui'
import { MagneticButton } from '../components/Interactive'
import { projects } from '../data/projects'
import { currentUser } from '../data/students'
import { useAuth } from '../context/AuthContext'
import { fetchProfileById } from '../services/profiles'
import {
  getConnectionStatus,
  sendConnectionRequest,
  type ConnectionState,
} from '../services/connections'
import { EditProfileModal } from '../components/EditProfileModal'
import { VerificationModal } from '../components/VerificationModal'
import type { Student } from '../types'

export function ProfilePage() {
  const { id } = useParams()
  const { user, profile: authProfile, isVerified } = useAuth()

  const [student, setStudent] = useState<Student>(currentUser)
  const [connState, setConnState] = useState<ConnectionState>('none')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [verificationOpen, setVerificationOpen] = useState(false)
  const [loadingConn, setLoadingConn] = useState(false)

  // Determine if viewing own profile
  const targetId = id || user?.id || currentUser.id
  const mine = targetId === user?.id || targetId === 'me' || targetId === currentUser.id

  const loadProfile = async () => {
    if (mine && authProfile) {
      // Use live authenticated profile
      const nameParts = (authProfile.full_name || 'Student').trim().split(' ')
      const initials =
        nameParts.length > 1
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
          : nameParts[0].slice(0, 2).toUpperCase()

      setStudent({
        id: authProfile.id,
        name: authProfile.full_name || 'Student',
        initials,
        avatar: authProfile.avatar_url || 'warm',
        branch: authProfile.branch || 'Computer Science',
        year: authProfile.batch || '3rd Year (2022-2026)',
        graduationYear: authProfile.graduation_year || '2026',
        bio: authProfile.bio || 'Full-stack builder passionate about campus collaboration.',
        skills: ['React', 'TypeScript', 'PostgreSQL', 'Tailwind CSS'],
        interests: ['Collaboration', 'Campus Projects', 'AI Systems'],
        connections: 12,
        location: authProfile.location || 'LNCT Bhopal Campus',
        company: authProfile.company || 'LNCT Student',
        role: authProfile.role || 'student',
        isAlumni: authProfile.is_alumni || false,
        online: true,
      })
    } else {
      const fetched = await fetchProfileById(targetId)
      if (fetched) {
        setStudent(fetched)
      }
    }

    if (!mine && user) {
      const status = await getConnectionStatus(user.id, targetId)
      setConnState(status)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [targetId, user?.id, authProfile])

  const handleConnect = async () => {
    if (!user) return

    if (connState === 'none') {
      if (!isVerified) {
        setVerificationOpen(true)
        return
      }

      setLoadingConn(true)
      const res = await sendConnectionRequest(user.id, targetId, isVerified)
      setLoadingConn(false)
      if (res.success) {
        setConnState('pending_sent')
      }
    }
  }

  return (
    <AppShell>
      {/* Profile Header Card */}
      <Card className="overflow-hidden">
        {/* Editorial Cover Banner */}
        <div
          className="relative h-44 sm:h-52 border-b"
          style={{
            background: 'var(--color-dark-section)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{ background: 'var(--color-accent)' }}
          />
        </div>

        <div className="relative px-6 pb-6 sm:px-8">
          <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
            <Avatar
              name={student.name}
              initials={student.initials}
              tone={student.avatar}
              size="xl"
              online={student.online}
            />
            <div className="flex gap-2.5">
              {mine ? (
                <MagneticButton>
                  <Button variant="secondary" onClick={() => setEditModalOpen(true)}>
                    <Pencil className="size-4" />
                    Edit Profile
                  </Button>
                </MagneticButton>
              ) : (
                <>
                  <MagneticButton>
                    {connState === 'accepted' ? (
                      <Button variant="secondary" className="text-emerald-600 dark:text-emerald-400">
                        <Check className="size-4" />
                        Connected
                      </Button>
                    ) : connState === 'pending_sent' ? (
                      <Button variant="secondary" disabled className="opacity-80">
                        <Clock className="size-4" />
                        Requested
                      </Button>
                    ) : (
                      <Button variant="primary" onClick={handleConnect} disabled={loadingConn}>
                        <UserPlus className="size-4" />
                        Connect
                      </Button>
                    )}
                  </MagneticButton>
                  <Link to="/messages">
                    <Button variant="secondary">
                      <MessageCircle className="size-4" />
                      Message
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="mt-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1
                className="font-display text-3xl font-bold tracking-[-0.04em]"
                style={{ color: 'var(--color-ink)' }}
              >
                {student.name}
              </h1>
              {student.isAlumni && <Badge tone="accent">LNCT Alumni</Badge>}
              {(mine ? authProfile?.verification_status === 'verified' : isVerified) && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="size-3.5" /> Verified
                </span>
              )}
            </div>

            <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
              {student.role ? `${student.role} @ ${student.company}` : `${student.branch} · ${student.year}`}
            </p>

            <div
              className="mt-3.5 flex flex-wrap gap-x-5 gap-y-2 text-xs"
              style={{ color: 'var(--color-ink-muted)' }}
            >
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-[var(--color-accent)]" />
                {student.location}
              </span>
              <span>
                <strong style={{ color: 'var(--color-ink)' }}>{student.connections}</strong> connections
              </span>
              {student.isAlumni && <span>Class of {student.graduationYear}</span>}
            </div>
          </div>
        </div>
      </Card>

      {/* Main Profile Grid */}
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <ProfileSection title="About">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-secondary)' }}>
              {student.bio}
            </p>
          </ProfileSection>

          <ProfileSection title="Featured Projects" action="View all">
            <div className="grid gap-4 sm:grid-cols-2">
              {projects
                .filter(
                  (project) =>
                    project.creator.name === student.name || (mine && project.id === 'event-hub')
                )
                .slice(0, 2)
                .map((project) => (
                  <ProjectCard key={project.id} project={project} compact />
                ))}
              {!projects.some((project) => project.creator.name === student.name) && (
                <div
                  className="flex min-h-40 items-center justify-center rounded-md border border-dashed p-6 text-center text-xs"
                  style={{
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-ink-muted)',
                  }}
                >
                  No published projects yet.
                </div>
              )}
            </div>
          </ProfileSection>

          <ProfileSection title="Experience & Campus Roles">
            <div className="space-y-4">
              <Timeline
                icon={<BriefcaseBusiness className="size-4" />}
                title={student.company || 'LNCT Student'}
                meta={student.isAlumni ? 'Alumni' : 'Active Contributor · 2023 - Present'}
                detail="Building collaborative technology and peer networks for Lakshmi Narain College of Technology."
              />
              <Timeline
                icon={<GraduationCap className="size-4" />}
                title="Lakshmi Narain College of Technology (LNCT)"
                meta={`B.Tech, ${student.branch} · Batch of ${student.graduationYear || '2026'}`}
                detail="Coursework in Data Structures, Algorithms, Distributed Systems, Database Management, and Full-Stack Engineering."
              />
            </div>
          </ProfileSection>
        </div>

        {/* Profile Sidebar */}
        <aside className="space-y-6">
          <ProfileSection title="Skills & Tools">
            <div className="flex flex-wrap gap-2">
              {student.skills.map((skill: string) => (
                <Badge key={skill} tone="accent">
                  {skill}
                </Badge>
              ))}
              {['Communication', 'System Design'].map((skill: string) => (
                <Badge key={skill}>{skill}</Badge>
              ))}
            </div>
          </ProfileSection>

          <ProfileSection title="Education">
            <p className="font-display text-sm font-bold" style={{ color: 'var(--color-ink)' }}>
              Lakshmi Narain College of Technology
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-ink-muted)' }}>
              {student.branch} · {student.year}
            </p>
          </ProfileSection>

          <ProfileSection title="Portfolio & Profiles">
            <div className="space-y-3">
              <a
                href={authProfile?.portfolio_url || '#portfolio'}
                target={authProfile?.portfolio_url ? '_blank' : undefined}
                rel="noreferrer"
                className="flex items-center gap-2 text-xs font-semibold transition hover:text-[var(--color-accent)]"
                style={{ color: 'var(--color-ink-secondary)' }}
              >
                <LinkIcon className="size-3.5 text-[var(--color-accent)]" />
                Portfolio Website
                <ExternalLink className="ml-auto size-3 text-[var(--color-ink-muted)]" />
              </a>
              <a
                href={authProfile?.github_url || '#github'}
                target={authProfile?.github_url ? '_blank' : undefined}
                rel="noreferrer"
                className="flex items-center gap-2 text-xs font-semibold transition hover:text-[var(--color-accent)]"
                style={{ color: 'var(--color-ink-secondary)' }}
              >
                <Github className="size-3.5 text-[var(--color-accent)]" />
                GitHub Profile
                <ExternalLink className="ml-auto size-3 text-[var(--color-ink-muted)]" />
              </a>
              {authProfile?.linkedin_url && (
                <a
                  href={authProfile.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-xs font-semibold transition hover:text-[var(--color-accent)]"
                  style={{ color: 'var(--color-ink-secondary)' }}
                >
                  <LinkedinIcon className="size-3.5 text-[var(--color-accent)]" />
                  LinkedIn Profile
                  <ExternalLink className="ml-auto size-3 text-[var(--color-ink-muted)]" />
                </a>
              )}
            </div>
          </ProfileSection>
        </aside>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={loadProfile}
      />

      {/* Verification Prompt Modal */}
      <VerificationModal
        isOpen={verificationOpen}
        onClose={() => setVerificationOpen(false)}
      />
    </AppShell>
  )
}

function ProfileSection({
  title,
  children,
  action,
}: {
  title: string
  children: ReactNode
  action?: string
}) {
  return (
    <Card className="p-6">
      <SectionTitle
        title={title}
        action={
          action && (
            <button
              className="text-xs font-semibold hover:underline"
              style={{ color: 'var(--color-accent)' }}
            >
              {action} →
            </button>
          )
        }
      />
      {children}
    </Card>
  )
}

function Timeline({
  icon,
  title,
  meta,
  detail,
}: {
  icon: ReactNode
  title: string
  meta: string
  detail: string
}) {
  return (
    <div className="flex gap-3.5">
      <div
        className="grid size-9 shrink-0 place-items-center rounded-lg border"
        style={{
          borderColor: 'rgba(231, 111, 53, 0.25)',
          background: 'var(--color-accent-subtle)',
          color: 'var(--color-accent)',
        }}
      >
        {icon}
      </div>
      <div>
        <p className="font-display text-sm font-bold" style={{ color: 'var(--color-ink)' }}>
          {title}
        </p>
        <p className="mt-0.5 text-xs font-semibold" style={{ color: 'var(--color-ink-muted)' }}>
          {meta}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--color-ink-secondary)' }}>
          {detail}
        </p>
      </div>
    </div>
  )
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}
