import { useState, type FormEvent } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  X,
  Loader2,
} from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button, Logo } from '../components/ui'
import { MagneticButton } from '../components/Interactive'
import { useAuth } from '../context/AuthContext'

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { signInWithEmail, signUpWithEmail, resetPassword, isConfigured, isMockEnabled, mockSignIn } = useAuth()

  const signup = mode === 'signup'
  const from = (location.state as any)?.from?.pathname || '/home'

  // Form Fields
  const [fullName, setFullName] = useState('')
  const [branch, setBranch] = useState('')
  const [batch, setBatch] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Status & Feedback
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Forgot Password Modal State
  const [forgotModalOpen, setForgotModalOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSubmitting, setForgotSubmitting] = useState(false)
  const [forgotFeedback, setForgotFeedback] = useState<string | null>(null)

  const isLnctDomain = email.toLowerCase().trim().endsWith('@lnct.ac.in')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setSubmitting(true)

    if (signup) {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name.')
        setSubmitting(false)
        return
      }

      const { error, needsEmailConfirmation } = await signUpWithEmail(email, password, {
        fullName: fullName.trim(),
        branch: branch.trim() || 'Engineering',
        batch: batch.trim() || 'Student',
      })

      setSubmitting(false)

      if (error) {
        setErrorMsg(error.message || 'Registration failed. Please check your details.')
        return
      }

      if (needsEmailConfirmation) {
        setSuccessMsg(
          `Confirmation email sent to ${email}. Please check your inbox and confirm your email to complete registration.`
        )
      } else {
        navigate(from, { replace: true })
      }
    } else {
      const { error } = await signInWithEmail(email, password)
      setSubmitting(false)

      if (error) {
        setErrorMsg(error.message || 'Invalid email or password.')
        return
      }

      navigate(from, { replace: true })
    }
  }

  const handleForgotSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = forgotEmail.trim()
    if (!trimmed || !trimmed.includes('@')) {
      setForgotFeedback('Please enter a valid email address.')
      return
    }

    setForgotSubmitting(true)
    setForgotFeedback(null)

    const { error } = await resetPassword(trimmed)
    setForgotSubmitting(false)

    if (error) {
      setForgotFeedback(error.message)
    } else {
      // Privacy safeguard: Never reveal whether the account exists
      setForgotFeedback(
        'If an account is associated with this email address, password recovery instructions have been sent. Please check your inbox and spam folder.'
      )
    }
  }

  return (
    <div
      className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Left editorial brand panel (Dark section #20211F) */}
      <div
        className="relative hidden flex-col justify-between border-r p-12 lg:flex"
        style={{
          background: 'var(--color-dark-section)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <div>
          <Link to="/" className="inline-block">
            <Logo />
          </Link>

          <div className="mt-28 max-w-md">
            <p className="label-sm mb-4" style={{ color: 'var(--color-accent)' }}>
              LNCT Campus Network 2.0
            </p>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-[#FAF9F6] xl:text-5xl">
              Build the people side of your potential.
            </h1>
            <p className="mt-6 text-base leading-relaxed text-[#B0ADA8]">
              From a first project collaborator to an alumnus who has been there, meaningful opportunity begins with a warmer network.
            </p>

            <div className="mt-12 space-y-4">
              {[
                'Verified student, senior, and alumni community',
                'Peer project recruitment and team formation',
                'Mentorship and curated campus opportunities',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-[#FAF9F6]">
                  <CheckCircle2 className="size-4 shrink-0 text-[var(--color-accent)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-[#8E8D88]">
          © 2026 LNCT Connect. A private professional network for LNCT students & alumni.
        </p>
      </div>

      {/* Right form panel */}
      <main className="flex items-center justify-center px-6 py-12 sm:px-10 md:px-12 lg:px-14 xl:px-16">
        <div className="w-full max-w-[420px]">
          <Link to="/" className="mb-10 inline-block lg:hidden">
            <Logo />
          </Link>

          {!isConfigured && (
            <div
              className="mb-6 rounded-xl border p-4 text-xs"
              style={{
                background: 'rgba(231, 111, 53, 0.08)',
                borderColor: 'rgba(231, 111, 53, 0.25)',
                color: 'var(--color-ink)',
              }}
            >
              <div className="flex items-start gap-2.5">
                <Sparkles className="size-4 shrink-0 text-[var(--color-accent)] mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-[var(--color-ink)]">
                    Local Development Configuration
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--color-ink-muted)] leading-relaxed">
                    Live Supabase credentials are not set. Configure <code className="font-mono text-[10px] bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and <code className="font-mono text-[10px] bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">VITE_SUPABASE_PUBLISHABLE_KEY</code> in <code className="font-mono text-[10px] bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">.env.local</code>.
                  </p>
                  {isMockEnabled && (
                    <div className="mt-2.5 pt-2 border-t border-[rgba(231,111,53,0.15)] flex items-center justify-between gap-2">
                      <span className="text-[10px] text-[var(--color-ink-muted)]">
                        Mock auth enabled via VITE_ENABLE_MOCK_AUTH
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          mockSignIn()
                          navigate(from, { replace: true })
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity"
                      >
                        Quick Demo Login
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <p className="label-sm mb-3" style={{ color: 'var(--color-accent)' }}>
            {signup ? 'Student Registration' : 'Account Login'}
          </p>

          <h2
            className="font-display text-3xl font-bold tracking-[-0.03em] sm:text-4xl"
            style={{ color: 'var(--color-ink)' }}
          >
            {signup ? 'Join the network.' : 'Welcome back.'}
          </h2>

          <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
            {signup
              ? 'Create your verified student profile in less than two minutes.'
              : 'Sign in to access your connections, projects, and messages.'}
          </p>

          {errorMsg && (
            <div className="mt-6 rounded-lg p-3.5 text-xs bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 font-medium flex items-start gap-2.5">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mt-6 rounded-lg p-3.5 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-medium flex items-start gap-2.5">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {signup && (
              <label className="block">
                <span
                  className="mb-2.5 block text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-ink-secondary)' }}
                >
                  Full name *
                </span>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Aanya Mehta"
                  className="h-12 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                  style={{
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-card)',
                    color: 'var(--color-ink)',
                  }}
                />
                <span
                  className="mt-1.5 block text-[11px] leading-tight"
                  style={{ color: 'var(--color-ink-muted)' }}
                >
                  Use your official LNCT student directory name
                </span>
              </label>
            )}

            {signup && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <label className="block">
                  <span
                    className="mb-2.5 block text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--color-ink-secondary)' }}
                  >
                    Branch
                  </span>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="Computer Science"
                    className="h-12 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                    style={{
                      borderColor: 'var(--color-border)',
                      background: 'var(--color-card)',
                      color: 'var(--color-ink)',
                    }}
                  />
                </label>

                <label className="block">
                  <span
                    className="mb-2.5 block text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--color-ink-secondary)' }}
                  >
                    Year
                  </span>
                  <input
                    type="text"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    placeholder="3rd year"
                    className="h-12 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                    style={{
                      borderColor: 'var(--color-border)',
                      background: 'var(--color-card)',
                      color: 'var(--color-ink)',
                    }}
                  />
                </label>
              </div>
            )}

            <label className="block">
              <span
                className="mb-2.5 block text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-ink-secondary)' }}
              >
                Email address *
              </span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@lnct.ac.in"
                className="h-12 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-card)',
                  color: 'var(--color-ink)',
                }}
              />
              {signup && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  {isLnctDomain ? (
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Official LNCT domain — Instant Verification enabled
                    </span>
                  ) : (
                    <span
                      className="block text-[11px] leading-tight"
                      style={{ color: 'var(--color-ink-muted)' }}
                    >
                      Use @lnct.ac.in for instant verification, or personal email for review
                    </span>
                  )}
                </div>
              )}
            </label>

            <label className="block">
              <span
                className="mb-2.5 block text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-ink-secondary)' }}
              >
                Password *
              </span>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 w-full rounded-lg border px-4 pr-12 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                  style={{
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-card)',
                    color: 'var(--color-ink)',
                  }}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                </button>
              </div>
            </label>

            {!signup && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email)
                    setForgotFeedback(null)
                    setForgotModalOpen(true)
                  }}
                  className="text-xs font-medium transition hover:underline"
                  style={{ color: 'var(--color-accent)' }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <div className="pt-3">
              <MagneticButton className="w-full">
                <Button
                  className="w-full h-12 text-sm font-semibold rounded-lg"
                  size="lg"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      {signup ? 'Creating account…' : 'Signing you in…'}
                    </span>
                  ) : (
                    <>
                      {signup ? 'Create profile' : 'Sign in'} <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </MagneticButton>
            </div>
          </form>

          <p
            className="mt-9 text-center text-xs"
            style={{ color: 'var(--color-ink-muted)' }}
          >
            {signup ? 'Already have an account?' : 'New to LNCT Connect?'}{' '}
            <Link
              className="font-semibold underline underline-offset-4"
              style={{ color: 'var(--color-accent)' }}
              to={signup ? '/login' : '/signup'}
            >
              {signup ? 'Log in' : 'Create an account'}
            </Link>
          </p>

          <p
            className="mt-8 flex items-center justify-center gap-2 text-center text-[11px]"
            style={{ color: 'var(--color-ink-muted)' }}
          >
            <ShieldCheck className="size-3.5 shrink-0" style={{ color: 'var(--color-accent)' }} />
            <span>LNCT verified credentials required for network access.</span>
          </p>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="relative w-full max-w-md rounded-2xl border p-6 sm:p-7 shadow-2xl transition-all"
            style={{
              background: 'var(--color-card)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-ink)',
            }}
          >
            <button
              onClick={() => setForgotModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
            >
              <X className="size-5" />
            </button>

            <h3 className="font-display text-xl font-bold tracking-tight mb-2">
              Recover Password
            </h3>
            <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed mb-5">
              Enter your registered student email address and we'll send you a password recovery link.
            </p>

            {forgotFeedback && (
              <div
                className={`mb-5 rounded-lg p-3 text-xs border font-medium ${
                  forgotFeedback.includes('sent')
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                }`}
              >
                {forgotFeedback}
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-[var(--color-ink-secondary)]">
                  Registered Email
                </label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@lnct.ac.in"
                  className="h-11 w-full rounded-lg border px-3.5 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                  style={{
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-ink)',
                  }}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setForgotModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="md" disabled={forgotSubmitting}>
                  {forgotSubmitting ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="size-4 animate-spin" /> Sending…
                    </span>
                  ) : (
                    'Send Recovery Link'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
