import { useState } from 'react'
import { AlertCircle, Plus, Sparkles, X } from 'lucide-react'
import { Button, Card } from './ui'
import { useAuth } from '../context/AuthContext'
import { createProject } from '../services/projects'
import { VerificationModal } from './VerificationModal'
import type { Project } from '../types'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onProjectCreated: (project: Project) => void
}

const categories = ['Campus Tech', 'AI & Education', 'Community', 'Career', 'Social Impact']
const presetTech = ['React', 'Python', 'Node.js', 'Flutter', 'Figma', 'Supabase', 'Next.js', 'FastAPI']
const presetRoles = ['Frontend Developer', 'Backend Developer', 'ML Engineer', 'UI Designer', 'Mobile Developer', 'QA Tester']

export function CreateProjectModal({
  isOpen,
  onClose,
  onProjectCreated,
}: CreateProjectModalProps) {
  const { user, profile: authProfile, isVerified } = useAuth()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(categories[0])
  const [status, setStatus] = useState<'Ideation' | 'Building' | 'Launched'>('Building')
  const [progress, setProgress] = useState(25)

  const [techStack, setTechStack] = useState<string[]>(['React', 'TypeScript'])
  const [customTech, setCustomTech] = useState('')

  const [lookingFor, setLookingFor] = useState<string[]>(['Frontend Developer'])
  const [customRole, setCustomRole] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [verificationOpen, setVerificationOpen] = useState(false)

  if (!isOpen) return null

  const toggleTech = (t: string) => {
    setTechStack((prev) => (prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]))
  }

  const addCustomTech = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTech.trim()) {
      e.preventDefault()
      const trimmed = customTech.trim()
      if (!techStack.includes(trimmed)) {
        setTechStack([...techStack, trimmed])
      }
      setCustomTech('')
    }
  }

  const toggleRole = (r: string) => {
    setLookingFor((prev) => (prev.includes(r) ? prev.filter((item) => item !== r) : [...prev, r]))
  }

  const addCustomRole = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customRole.trim()) {
      e.preventDefault()
      const trimmed = customRole.trim()
      if (!lookingFor.includes(trimmed)) {
        setLookingFor([...lookingFor, trimmed])
      }
      setCustomRole('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !description.trim()) {
      setErrorMessage('Project name and description are required.')
      return
    }

    if (!user || !isVerified) {
      setVerificationOpen(true)
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    const creatorMeta = {
      name: authProfile?.full_name || user.email?.split('@')[0] || 'Builder',
      initials: (authProfile?.full_name || 'B').slice(0, 2).toUpperCase(),
      avatar: authProfile?.avatar_url || 'warm',
    }

    const { error, project } = await createProject(
      user.id,
      creatorMeta,
      {
        name: name.trim(),
        description: description.trim(),
        category,
        tech: techStack,
        lookingFor,
        status,
        progress,
      },
      isVerified
    )

    setSubmitting(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    if (project) {
      onProjectCreated(project)
      onClose()
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <Card className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-2.5">
              <div
                className="grid size-9 place-items-center rounded-lg"
                style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}
              >
                <Sparkles className="size-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
                  Launch Campus Project
                </h2>
                <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                  Recruit builders, share your tech stack, and collaborate.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--color-ink-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-ink)] transition"
            >
              <X className="size-5" />
            </button>
          </div>

          {errorMessage && (
            <div className="mt-4 flex items-center gap-2 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 p-3 rounded-lg border border-rose-200 dark:border-rose-900/50">
              <AlertCircle className="size-4 shrink-0" />
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Project Name & Category */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-sm mb-1.5 block" style={{ color: 'var(--color-ink)' }}>
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. LNCT Notes Hub"
                  className="h-10 w-full rounded-lg border px-3 text-xs outline-none transition focus:border-[var(--color-accent)]"
                  style={{
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-bg-secondary)',
                    color: 'var(--color-ink)',
                  }}
                />
              </div>

              <div>
                <label className="label-sm mb-1.5 block" style={{ color: 'var(--color-ink)' }}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-10 w-full rounded-lg border px-3 text-xs outline-none transition focus:border-[var(--color-accent)]"
                  style={{
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-bg-secondary)',
                    color: 'var(--color-ink)',
                  }}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="label-sm mb-1.5 block" style={{ color: 'var(--color-ink)' }}>
                Description & Vision *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What problem does this project solve? What are you building?"
                className="w-full rounded-lg border p-3 text-xs outline-none transition focus:border-[var(--color-accent)]"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-ink)',
                }}
              />
            </div>

            {/* Status & Progress */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-sm mb-1.5 block" style={{ color: 'var(--color-ink)' }}>
                  Current Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="h-10 w-full rounded-lg border px-3 text-xs outline-none transition focus:border-[var(--color-accent)]"
                  style={{
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-bg-secondary)',
                    color: 'var(--color-ink)',
                  }}
                >
                  <option value="Ideation">Ideation</option>
                  <option value="Building">Building</option>
                  <option value="Launched">Launched</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label-sm" style={{ color: 'var(--color-ink)' }}>
                    Progress Stage
                  </label>
                  <span className="text-xs font-bold" style={{ color: 'var(--color-accent)' }}>
                    {progress}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full accent-[var(--color-accent)]"
                />
              </div>
            </div>

            {/* Tech Stack */}
            <div>
              <label className="label-sm mb-1.5 block" style={{ color: 'var(--color-ink)' }}>
                Tech Stack
              </label>
              <div className="flex flex-wrap gap-1.5">
                {presetTech.map((t) => {
                  const active = techStack.includes(t)
                  return (
                    <button
                      type="button"
                      key={t}
                      onClick={() => toggleTech(t)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition border ${
                        active
                          ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                          : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-ink-secondary)]'
                      }`}
                    >
                      {t}
                    </button>
                  )
                })}
                {techStack
                  .filter((t) => !presetTech.includes(t))
                  .map((t) => (
                    <span
                      key={t}
                      className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-[var(--color-accent)] text-white border border-[var(--color-accent)]"
                    >
                      {t}
                      <X className="size-3 cursor-pointer" onClick={() => toggleTech(t)} />
                    </span>
                  ))}
              </div>
              <input
                type="text"
                value={customTech}
                onChange={(e) => setCustomTech(e.target.value)}
                onKeyDown={addCustomTech}
                placeholder="Type additional tech & press Enter…"
                className="mt-2 h-8 w-full sm:w-64 rounded border px-3 text-xs outline-none transition focus:border-[var(--color-accent)]"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-ink)',
                }}
              />
            </div>

            {/* Looking For Roles */}
            <div>
              <label className="label-sm mb-1.5 block" style={{ color: 'var(--color-ink)' }}>
                Teammates Needed (Looking For)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {presetRoles.map((r) => {
                  const active = lookingFor.includes(r)
                  return (
                    <button
                      type="button"
                      key={r}
                      onClick={() => toggleRole(r)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition border ${
                        active
                          ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                          : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-ink-secondary)]'
                      }`}
                    >
                      {r}
                    </button>
                  )
                })}
                {lookingFor
                  .filter((r) => !presetRoles.includes(r))
                  .map((r) => (
                    <span
                      key={r}
                      className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-[var(--color-accent)] text-white border border-[var(--color-accent)]"
                    >
                      {r}
                      <X className="size-3 cursor-pointer" onClick={() => toggleRole(r)} />
                    </span>
                  ))}
              </div>
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                onKeyDown={addCustomRole}
                placeholder="Type additional role & press Enter…"
                className="mt-2 h-8 w-full sm:w-64 rounded border px-3 text-xs outline-none transition focus:border-[var(--color-accent)]"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-ink)',
                }}
              />
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                <Plus className="size-4" />
                {submitting ? 'Publishing…' : 'Publish Project'}
              </Button>
            </div>
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
