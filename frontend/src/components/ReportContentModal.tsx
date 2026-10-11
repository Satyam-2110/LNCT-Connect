import { useState } from 'react'
import { AlertCircle, Check, Flag, ShieldAlert, X } from 'lucide-react'
import { Button, Card } from './ui'
import { useAuth } from '../context/AuthContext'
import { reportContent, type ContentReportItem } from '../services/admin'

interface ReportContentModalProps {
  isOpen: boolean
  onClose: () => void
  targetType: ContentReportItem['targetType']
  targetId: string
  targetSnippet?: string
  onReportSubmitted?: () => void
}

const reasonOptions: { id: ContentReportItem['reason']; label: string; desc: string }[] = [
  { id: 'spam', label: 'Spam or Promotional', desc: 'Unsolicited links, commercial ads, or repetitive text.' },
  { id: 'harassment', label: 'Harassment or Bullying', desc: 'Personal attacks, threats, or hostile comments towards peers.' },
  { id: 'inappropriate', label: 'Inappropriate Content', desc: 'Content violating campus policies or academic integrity.' },
  { id: 'impersonation', label: 'Impersonation or False Identity', desc: 'Pretending to be another student, alumni, or faculty.' },
  { id: 'other', label: 'Other Concern', desc: 'Other issue requiring administrator investigation.' },
]

export function ReportContentModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetSnippet,
  onReportSubmitted,
}: ReportContentModalProps) {
  const { user, profile } = useAuth()

  const [selectedReason, setSelectedReason] = useState<ContentReportItem['reason']>('spam')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!user) {
      setErrorMessage('Please sign in to report content.')
      return
    }

    setSubmitting(true)
    const res = await reportContent(
      user.id,
      {
        targetType,
        targetId,
        targetSnippet,
        reason: selectedReason,
        details: details.trim(),
      },
      profile?.full_name || 'Community Member'
    )
    setSubmitting(false)

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to submit report.')
      return
    }

    setSuccess(true)
    onReportSubmitted?.()

    setTimeout(() => {
      onClose()
      setSuccess(false)
    }, 1400)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <Card
        className="relative z-10 w-full max-w-lg overflow-hidden border p-0 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: 'var(--color-bg)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-5"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-bg-secondary)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex size-10 items-center justify-center rounded-xl"
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
              }}
            >
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
                Report {targetType}
              </h3>
              <p className="text-xs font-medium" style={{ color: 'var(--color-ink-muted)' }}>
                Help keep the LNCT campus community safe and constructive.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {targetSnippet && (
            <div
              className="rounded-lg border p-3 text-xs leading-relaxed italic"
              style={{
                background: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-ink-secondary)',
              }}
            >
              &ldquo;{targetSnippet}&rdquo;
            </div>
          )}

          {success ? (
            <div className="py-8 text-center space-y-3">
              <div
                className="mx-auto flex size-12 items-center justify-center rounded-full"
                style={{
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#22c55e',
                }}
              >
                <Check className="size-6" />
              </div>
              <h4 className="font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>
                Report Submitted
              </h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Thank you for notifying the campus administrative desk. Our moderation team will investigate promptly.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-ink-secondary)' }}>
                  Reason for reporting
                </label>
                <div className="space-y-2">
                  {reasonOptions.map((opt) => (
                    <label
                      key={opt.id}
                      onClick={() => setSelectedReason(opt.id)}
                      className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                      style={{
                        background: selectedReason === opt.id ? 'rgba(239, 68, 68, 0.05)' : 'var(--color-bg-secondary)',
                        borderColor: selectedReason === opt.id ? 'rgba(239, 68, 68, 0.4)' : 'var(--color-border)',
                      }}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        checked={selectedReason === opt.id}
                        onChange={() => setSelectedReason(opt.id)}
                        className="mt-0.5 accent-red-500"
                      />
                      <div>
                        <p className="text-xs font-bold" style={{ color: 'var(--color-ink)' }}>
                          {opt.label}
                        </p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {opt.desc}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-ink-secondary)' }}>
                  Additional Details (Optional)
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide any context that will help moderators understand the issue..."
                  className="w-full rounded-lg border p-3 text-xs leading-relaxed"
                  style={{
                    background: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-ink)',
                  }}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <Button variant="ghost" type="button" onClick={onClose} disabled={submitting}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={submitting}
                  style={{ background: '#ef4444', borderColor: '#ef4444' }}
                >
                  <Flag className="size-3.5 mr-1" />
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </Button>
              </div>
            </>
          )}
        </form>
      </Card>
    </div>
  )
}
