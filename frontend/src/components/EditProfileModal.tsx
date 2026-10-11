import { useState, type FormEvent, useEffect } from 'react'
import { X, Loader2, User, Building, MapPin, Globe, Check } from 'lucide-react'
import { updateUserProfile } from '../services/profiles'
import { useAuth } from '../context/AuthContext'
import { Button } from './ui'

export function EditProfileModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
}) {
  const { user, profile, refreshProfile } = useAuth()

  const [fullName, setFullName] = useState('')
  const [branch, setBranch] = useState('')
  const [batch, setBatch] = useState('')
  const [graduationYear, setGraduationYear] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [company, setCompany] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setBranch(profile.branch || '')
      setBatch(profile.batch || '')
      setGraduationYear(profile.graduation_year || '')
      setBio(profile.bio || '')
      setLocation(profile.location || 'Bhopal, MP')
      setCompany(profile.company || '')
      setGithubUrl(profile.github_url || '')
      setLinkedinUrl(profile.linkedin_url || '')
      setPortfolioUrl(profile.portfolio_url || '')
    }
  }, [profile, isOpen])

  if (!isOpen || !user) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const { error: updateErr } = await updateUserProfile(user.id, {
      fullName,
      branch,
      batch,
      graduationYear,
      bio,
      location,
      company,
      githubUrl,
      linkedinUrl,
      portfolioUrl,
    })

    setSaving(false)

    if (updateErr) {
      setError(updateErr.message || 'Failed to update profile.')
    } else {
      setSuccess(true)
      await refreshProfile()
      if (onSave) onSave()
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 700)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="relative w-full max-w-xl my-8 rounded-2xl border p-6 sm:p-8 shadow-2xl transition-all"
        style={{
          background: 'var(--color-card)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-ink)',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-full p-2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div
            className="flex size-11 items-center justify-center rounded-xl"
            style={{
              background: 'rgba(231, 111, 53, 0.12)',
              color: 'var(--color-accent)',
            }}
          >
            <User className="size-5" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold tracking-tight">Edit Profile</h3>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Update your campus profile information & social links
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg p-3 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-2">
            <Check className="size-4" /> Profile saved successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-[var(--color-ink-secondary)]">
                Full Name *
              </label>
              <input
                required
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Aanya Mehta"
                className="h-10 w-full rounded-lg border px-3 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-ink)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-[var(--color-ink-secondary)]">
                Branch / Major
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="Computer Science & Engineering"
                className="h-10 w-full rounded-lg border px-3 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-ink)',
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-[var(--color-ink-secondary)]">
                Batch / Year
              </label>
              <input
                type="text"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                placeholder="3rd Year (2022-2026)"
                className="h-10 w-full rounded-lg border px-3 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-ink)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-[var(--color-ink-secondary)]">
                Graduation Year
              </label>
              <input
                type="text"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                placeholder="2026"
                className="h-10 w-full rounded-lg border px-3 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-ink)',
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-[var(--color-ink-secondary)]">
              Bio / About You
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell fellow students about your interests, projects, and goals..."
              className="w-full rounded-lg border p-3 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] resize-none"
              style={{
                borderColor: 'var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-ink)',
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-[var(--color-ink-secondary)]">
                Campus Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="LNCT Bhopal Campus"
                  className="h-10 w-full rounded-lg border pl-9 pr-3 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                  style={{
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-ink)',
                  }}
                />
                <MapPin className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-[var(--color-ink-secondary)]">
                Company / Role
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Intern @ Google or Student"
                  className="h-10 w-full rounded-lg border pl-9 pr-3 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                  style={{
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-ink)',
                  }}
                />
                <Building className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-secondary)]">
              Social & Portfolio Links
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="GitHub URL"
                className="h-10 rounded-lg border px-3 text-xs outline-none transition focus:border-[var(--color-accent)]"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-ink)',
                }}
              />

              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="LinkedIn URL"
                className="h-10 rounded-lg border px-3 text-xs outline-none transition focus:border-[var(--color-accent)]"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-ink)',
                }}
              />

              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="Portfolio URL"
                className="h-10 rounded-lg border px-3 text-xs outline-none transition focus:border-[var(--color-accent)]"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-ink)',
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="md" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" /> Saving Changes…
                </>
              ) : (
                'Save Profile'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
