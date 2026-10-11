import { useEffect, useState } from 'react'
import { Plus, SlidersHorizontal } from 'lucide-react'
import { AppShell, PageIntro } from '../components/layout'
import { ProjectCard } from '../components/cards'
import { Button, EmptyState, SearchField } from '../components/ui'
import { MagneticButton } from '../components/Interactive'
import { fetchProjects } from '../services/projects'
import { CreateProjectModal } from '../components/CreateProjectModal'
import { useAuth } from '../context/AuthContext'
import { VerificationModal } from '../components/VerificationModal'
import type { Project } from '../types'

const techOptions = ['All technology', 'React', 'Python', 'Node.js', 'Flutter', 'Figma', 'Supabase', 'Next.js']
const statusOptions = ['All status', 'Ideation', 'Building', 'Launched']

export function ProjectsPage() {
  const { user, isVerified } = useAuth()

  const [query, setQuery] = useState('')
  const [tech, setTech] = useState(techOptions[0])
  const [status, setStatus] = useState(statusOptions[0])

  const [projectsList, setProjectsList] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [verificationOpen, setVerificationOpen] = useState(false)
  const [createdNotice, setCreatedNotice] = useState(false)

  const loadProjects = async () => {
    setLoading(true)
    const data = await fetchProjects({ query, tech, status })
    setProjectsList(data)
    setLoading(false)
  }

  useEffect(() => {
    loadProjects()
  }, [query, tech, status])

  const handleOpenCreate = () => {
    if (!user) {
      setVerificationOpen(true)
      return
    }
    if (!isVerified) {
      setVerificationOpen(true)
      return
    }
    setCreateModalOpen(true)
  }

  const handleProjectCreated = (newProject: Project) => {
    setProjectsList((prev) => [newProject, ...prev])
    setCreatedNotice(true)
    setTimeout(() => setCreatedNotice(false), 5000)
  }

  return (
    <AppShell wide>
      <PageIntro
        eyebrow="Campus Project Hub"
        title="Collaborate on student projects"
        detail="Discover ambitious products being built across campus, join a cross-disciplinary team, and turn your portfolio into collaborative proof."
        action={
          <MagneticButton>
            <Button onClick={handleOpenCreate}>
              <Plus className="size-4" />
              Create Project
            </Button>
          </MagneticButton>
        }
      />

      {createdNotice && (
        <div
          className="mb-6 rounded-md border p-4 text-xs font-semibold animate-fade-in"
          style={{
            borderColor: 'rgba(46, 125, 80, 0.3)',
            background: 'rgba(46, 125, 80, 0.08)',
            color: '#2E7D50',
          }}
        >
          ✓ Project workspace published to the LNCT Campus Network. Students can now submit join requests!
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search by project name, tech stack, or required role…"
          className="flex-1"
        />
        <div className="flex gap-2.5">
          <select
            value={tech}
            onChange={(e) => setTech(e.target.value)}
            className="h-11 min-w-0 rounded-lg border px-3.5 text-sm font-medium outline-none transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-card)',
              color: 'var(--color-ink)',
            }}
          >
            {techOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-11 min-w-0 rounded-lg border px-3.5 text-sm font-medium outline-none transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-card)',
              color: 'var(--color-ink)',
            }}
          >
            {statusOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs font-medium" style={{ color: 'var(--color-ink-muted)' }}>
          Showing{' '}
          <span className="font-bold" style={{ color: 'var(--color-ink)' }}>
            {projectsList.length}
          </span>{' '}
          active campus teams
        </p>
        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--color-ink-muted)' }}>
          <SlidersHorizontal className="size-3.5" />
          Active Builders
        </span>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm" style={{ color: 'var(--color-ink-muted)' }}>
          Loading campus teams…
        </div>
      ) : projectsList.length > 0 ? (
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projectsList.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onApplicationSent={loadProjects}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            title="No projects match criteria"
            detail="Try clearing your technology filter or searching for another keyword."
            actionLabel="Reset Filters"
            onAction={() => {
              setQuery('')
              setTech(techOptions[0])
              setStatus(statusOptions[0])
            }}
          />
        </div>
      )}

      <CreateProjectModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />

      <VerificationModal
        isOpen={verificationOpen}
        onClose={() => setVerificationOpen(false)}
      />
    </AppShell>
  )
}
