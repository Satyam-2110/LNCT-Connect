import { useState, useEffect } from 'react'
import { Check, UserCheck, Users, X } from 'lucide-react'
import { Avatar, Button, Card, EmptyState } from './ui'
import { fetchProjectApplications, respondToApplication, type ProjectApplication } from '../services/projects'

interface ProjectApplicationsModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
  onMemberCountChanged?: () => void
}

export function ProjectApplicationsModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  onMemberCountChanged,
}: ProjectApplicationsModalProps) {
  const [applications, setApplications] = useState<ProjectApplication[]>([])
  const [loading, setLoading] = useState(true)

  const loadApplications = async () => {
    setLoading(true)
    const data = await fetchProjectApplications(projectId)
    setApplications(data)
    setLoading(false)
  }

  useEffect(() => {
    if (isOpen) {
      loadApplications()
    }
  }, [isOpen, projectId])

  if (!isOpen) return null

  const handleRespond = async (appId: string, applicantId: string, accept: boolean) => {
    const { error } = await respondToApplication(appId, accept, projectId, applicantId)
    if (!error) {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === appId ? { ...app, status: accept ? 'accepted' : 'rejected' } : app
        )
      )
      if (accept) {
        onMemberCountChanged?.()
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <Card className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="grid size-9 place-items-center rounded-lg"
              style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}
            >
              <Users className="size-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>
                Candidate Applications
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                Review students applying to join <strong style={{ color: 'var(--color-ink)' }}>{projectName}</strong>
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

        <div className="mt-5 space-y-3">
          {loading ? (
            <p className="text-xs text-center py-8" style={{ color: 'var(--color-ink-muted)' }}>
              Loading candidate applications…
            </p>
          ) : applications.length > 0 ? (
            applications.map((app) => (
              <div
                key={app.id}
                className="rounded-lg border p-4 transition-all"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg-secondary)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={app.applicant.name}
                      initials={app.applicant.initials}
                      tone={app.applicant.avatar}
                      size="sm"
                    />
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'var(--color-ink)' }}>
                        {app.applicant.name}
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--color-ink-muted)' }}>
                        {app.applicant.branch} · {app.applicant.year}
                      </p>
                    </div>
                  </div>

                  {app.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRespond(app.id, app.applicantId, false)}
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleRespond(app.id, app.applicantId, true)}
                      >
                        <UserCheck className="size-3.5" /> Accept
                      </Button>
                    </div>
                  ) : (
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        app.status === 'accepted'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {app.status === 'accepted' ? '✓ Accepted' : 'Declined'}
                    </span>
                  )}
                </div>

                {app.message && (
                  <p className="mt-3 text-xs leading-relaxed italic border-t pt-2" style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink-secondary)' }}>
                    "{app.message}"
                  </p>
                )}
              </div>
            ))
          ) : (
            <EmptyState
              title="No applications yet"
              detail="When peers apply to collaborate on your project, their applications will appear here for your review."
            />
          )}
        </div>

        <div className="mt-6 flex justify-end border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </Card>
    </div>
  )
}
