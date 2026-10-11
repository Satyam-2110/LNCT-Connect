import { useState, type FormEvent } from 'react'
import { CheckCircle2, Clock, ShieldAlert, ShieldCheck, X, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from './ui'

export function VerificationModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { profile, submitVerification } = useAuth()
  const [enrollmentNumber, setEnrollmentNumber] = useState('')
  const [idCardUrl, setIdCardUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const status = profile?.verification_status || 'unverified'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    if (!enrollmentNumber.trim()) {
      setError('Enrollment number is required.')
      setSubmitting(false)
      return
    }

    const { error: submitErr } = await submitVerification(enrollmentNumber, idCardUrl)
    setSubmitting(false)

    if (submitErr) {
      setError(submitErr.message || 'Failed to submit verification request.')
    } else {
      setSuccess(true)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg rounded-2xl border p-6 sm:p-8 shadow-2xl transition-all"
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

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="flex size-11 items-center justify-center rounded-xl"
            style={{
              background: 'rgba(231, 111, 53, 0.12)',
              color: 'var(--color-accent)',
            }}
          >
            {status === 'verified' ? (
              <ShieldCheck className="size-6" />
            ) : status === 'pending' || success ? (
              <Clock className="size-6" />
            ) : (
              <ShieldAlert className="size-6" />
            )}
          </div>
          <div>
            <h3 className="font-display text-xl font-bold tracking-tight">
              {status === 'verified'
                ? 'Verified Student'
                : status === 'pending' || success
                ? 'Verification in Progress'
                : 'LNCT Student Verification'}
            </h3>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Official institutional credential validation
            </p>
          </div>
        </div>

        {/* Content based on status */}
        {status === 'verified' ? (
          <div className="space-y-4">
            <div className="rounded-xl border p-4 bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>Your LNCT student profile is officially verified.</span>
              </div>
              <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                You have full access to campus posting, project collaboration, direct messaging, and peer connections.
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <Button size="md" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        ) : status === 'pending' || success ? (
          <div className="space-y-4">
            <div className="rounded-xl border p-4 bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Clock className="size-4 shrink-0" />
                <span>Verification request submitted for admin review.</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                An administrator will review your enrollment credentials against official batch records. In the meantime, you have read-only access to explore discovery, feeds, and project listings.
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <Button size="md" onClick={onClose}>
                Got it
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
              To prevent non-campus accounts and protect peer collaboration, please provide your university enrollment number to unlock full network privileges.
            </p>

            {error && (
              <div className="rounded-lg p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-[var(--color-ink-secondary)]">
                LNCT Enrollment Number *
              </label>
              <input
                type="text"
                required
                value={enrollmentNumber}
                onChange={(e) => setEnrollmentNumber(e.target.value.toUpperCase())}
                placeholder="e.g. 0103CS221045"
                className="h-11 w-full rounded-lg border px-3.5 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] font-mono"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-ink)',
                }}
              />
              <span className="mt-1 block text-[11px] text-[var(--color-ink-muted)]">
                Matches your official RGPV / LNCT enrollment record.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-[var(--color-ink-secondary)]">
                ID Card Photo / Proof URL (Optional)
              </label>
              <input
                type="url"
                value={idCardUrl}
                onChange={(e) => setIdCardUrl(e.target.value)}
                placeholder="https://drive.google.com/your-id-card-or-doc"
                className="h-11 w-full rounded-lg border px-3.5 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-ink)',
                }}
              />
              <span className="mt-1 block text-[11px] text-[var(--color-ink-muted)]">
                Optional link to your digital student ID or library card photo.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button type="button" variant="secondary" size="md" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" size="md" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-1.5" /> Submitting…
                  </>
                ) : (
                  'Submit Verification'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export function VerificationBanner() {
  const { user, profile } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)

  if (!user || profile?.verification_status === 'verified') {
    return null
  }

  const isPending = profile?.verification_status === 'pending'

  return (
    <>
      <div
        className="border-b px-4 py-2.5 text-xs transition-colors"
        style={{
          background: isPending ? 'rgba(231, 111, 53, 0.08)' : 'rgba(231, 111, 53, 0.12)',
          borderColor: 'rgba(231, 111, 53, 0.25)',
          color: 'var(--color-ink)',
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {isPending ? (
              <Clock className="size-4 shrink-0 text-[var(--color-accent)]" />
            ) : (
              <ShieldAlert className="size-4 shrink-0 text-[var(--color-accent)]" />
            )}
            <span>
              {isPending
                ? 'Your student verification request is currently under review by campus administrators.'
                : 'Limited access mode: Verify your LNCT student credentials to unlock posting, project creation, and messaging.'}
            </span>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="shrink-0 font-semibold underline underline-offset-4 hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-accent)' }}
          >
            {isPending ? 'View Request Status' : 'Verify Student ID →'}
          </button>
        </div>
      </div>

      <VerificationModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
