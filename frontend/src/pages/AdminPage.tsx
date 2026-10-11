import { useState, useEffect } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Briefcase,
  Check,
  CheckCircle2,
  Clock3,
  Edit3,
  ExternalLink,
  Eye,
  FileCheck2,
  Flag,
  Lock,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import { AppShell } from '../components/layout'
import { Badge, Button, Card, EmptyState, SearchField } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import {
  fetchVerificationQueue,
  reviewVerification,
  fetchContentReports,
  resolveContentReport,
  fetchCampusAdminStats,
  fetchAdminOpportunities,
  createCampusOpportunity,
  updateCampusOpportunity,
  deleteCampusOpportunity,
  type VerificationQueueItem,
  type ContentReportItem,
  type CampusAdminStats,
} from '../services/admin'
import type { Opportunity } from '../types'

export function AdminPage() {
  const { user, profile } = useAuth()

  // Developer preview toggle: if user is logged in, allow toggling simulated admin for review
  const [devAdminOverride, setDevAdminOverride] = useState(false)
  const isAdmin = profile?.role === 'admin' || devAdminOverride

  const [activeTab, setActiveTab] = useState<'verifications' | 'moderation' | 'opportunities'>('verifications')

  // Opportunities state
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loadingOpportunities, setLoadingOpportunities] = useState(false)
  const [oppModalOpen, setOppModalOpen] = useState(false)
  const [editingOppId, setEditingOppId] = useState<string | null>(null)
  const [oppTitle, setOppTitle] = useState('')
  const [oppOrg, setOppOrg] = useState('')
  const [oppType, setOppType] = useState<Opportunity['type']>('Internship')
  const [oppLocation, setOppLocation] = useState('')
  const [oppDeadline, setOppDeadline] = useState('')
  const [oppSkills, setOppSkills] = useState('')
  const [oppDescription, setOppDescription] = useState('')
  const [oppFeatured, setOppFeatured] = useState(false)
  const [oppSaving, setOppSaving] = useState(false)
  const [oppError, setOppError] = useState<string | null>(null)

  // Verification state
  const [verifications, setVerifications] = useState<VerificationQueueItem[]>([])
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [loadingVerifications, setLoadingVerifications] = useState(true)
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  // Moderation state
  const [reports, setReports] = useState<ContentReportItem[]>([])
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('pending')
  const [loadingReports, setLoadingReports] = useState(true)
  const [moderationNotes, setModerationNotes] = useState<Record<string, string>>({})

  // Stats state
  const [stats, setStats] = useState<CampusAdminStats | null>(null)

  const loadVerificationData = async () => {
    if (!user) return
    setLoadingVerifications(true)
    const res = await fetchVerificationQueue(user.id, isAdmin)
    if (res.success && res.items) {
      setVerifications(res.items)
    }
    setLoadingVerifications(false)
  }

  const loadModerationData = async () => {
    if (!user) return
    setLoadingReports(true)
    const res = await fetchContentReports(user.id, isAdmin, reportFilter)
    if (res.success && res.reports) {
      setReports(res.reports)
    }
    setLoadingReports(false)
  }

  const loadStats = async () => {
    if (!user) return
    const res = await fetchCampusAdminStats(user.id, isAdmin)
    if (res.success && res.stats) {
      setStats(res.stats)
    }
  }

  const loadOpportunitiesData = async () => {
    if (!user) return
    setLoadingOpportunities(true)
    const res = await fetchAdminOpportunities(user.id, isAdmin)
    if (res.success && res.opportunities) {
      setOpportunities(res.opportunities)
    }
    setLoadingOpportunities(false)
  }

  useEffect(() => {
    if (user && isAdmin) {
      loadVerificationData()
      loadModerationData()
      loadStats()
      loadOpportunitiesData()
    }
  }, [user, isAdmin])

  const handleReviewVerification = async (requestId: string, decision: 'approved' | 'rejected') => {
    if (!user) return
    setActionInProgress(requestId)
    const notes = reviewNotes[requestId] || ''
    const res = await reviewVerification(user.id, isAdmin, requestId, decision, notes)
    setActionInProgress(null)

    if (res.success && res.item) {
      setVerifications((prev) =>
        prev.map((v) => (v.id === requestId ? res.item! : v))
      )
      loadStats()
    }
  }

  const handleResolveReport = async (reportId: string, resolution: 'resolved' | 'dismissed') => {
    if (!user) return
    setActionInProgress(reportId)
    const notes = moderationNotes[reportId] || ''
    const res = await resolveContentReport(user.id, isAdmin, reportId, resolution, notes)
    setActionInProgress(null)

    if (res.success) {
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, status: resolution, adminNotes: notes } : r
        )
      )
      loadStats()
    }
  }

  const handleDeleteOpportunity = async (oppId: string) => {
    if (!user) return
    const res = await deleteCampusOpportunity(user.id, isAdmin, oppId)
    if (res.success) {
      setOpportunities((prev) => prev.filter((o) => o.id !== oppId))
    }
  }

  const filteredVerifications = verifications.filter((v) => {
    if (verificationFilter === 'all') return true
    return v.status === verificationFilter
  })

  return (
    <AppShell wide>
      {/* Top Admin Banner */}
      <div
        className="relative overflow-hidden rounded-xl border p-8 sm:p-10 mb-8"
        style={{
          background: 'var(--color-dark-section)',
          borderColor: '#323330',
        }}
      >
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <Badge tone="accent">
              <Shield className="mr-1.5 size-3.5" />
              Administrative Governance & Security Desk
            </Badge>
            <h1 className="font-display mt-4 text-3xl font-bold tracking-[-0.04em] text-[#FAF9F6] sm:text-4xl">
              Campus Administration & Moderation
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#B0ADA8] sm:text-base">
              Audit student ID verification submissions, enforce community safety guidelines, and monitor network health metrics.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Developer Mode Toggle */}
            <div
              className="flex items-center gap-2.5 rounded-lg border px-3.5 py-2 text-xs"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(255, 255, 255, 0.12)',
                color: '#FAF9F6',
              }}
            >
              <span className="font-medium">Dev Admin Preview:</span>
              <button
                type="button"
                onClick={() => setDevAdminOverride(!devAdminOverride)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                  devAdminOverride ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {devAdminOverride ? 'ENABLED' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Access Guard Barrier */}
      {!isAdmin ? (
        <Card className="p-12 text-center max-w-xl mx-auto my-12 border-dashed">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mb-4">
            <Lock className="size-7" />
          </div>
          <h2 className="font-display text-xl font-bold" style={{ color: 'var(--color-ink)' }}>
            Admin Access Restricted
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">
            This dashboard is restricted to verified administrators of LNCT Connect. To inspect and test administrative workflows in local evaluation mode, activate the <strong>Dev Admin Preview</strong> toggle above.
          </p>
          <Button
            variant="primary"
            className="mt-6"
            onClick={() => setDevAdminOverride(true)}
          >
            Enable Admin Preview Mode
          </Button>
        </Card>
      ) : (
        <>
          {/* Quick Metrics Bar */}
          {stats && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 mb-8">
              <Card className="p-4 text-center">
                <p className="text-[11px] font-semibold text-zinc-400">Total Students</p>
                <p className="font-display mt-1 text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
                  {stats.totalStudents}
                </p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-[11px] font-semibold text-zinc-400">Verified Ratio</p>
                <p className="font-display mt-1 text-2xl font-bold text-emerald-500">
                  {Math.round((stats.verifiedStudents / stats.totalStudents) * 100)}%
                </p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-[11px] font-semibold text-zinc-400">Pending Review</p>
                <p className="font-display mt-1 text-2xl font-bold text-orange-500">
                  {stats.pendingVerifications}
                </p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-[11px] font-semibold text-zinc-400">Active Projects</p>
                <p className="font-display mt-1 text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
                  {stats.activeProjects}
                </p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-[11px] font-semibold text-zinc-400">Open Reports</p>
                <p className="font-display mt-1 text-2xl font-bold text-rose-500">
                  {stats.openReports}
                </p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-[11px] font-semibold text-zinc-400">Mentorships</p>
                <p className="font-display mt-1 text-2xl font-bold text-indigo-500">
                  {stats.mentorshipSessions}
                </p>
              </Card>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b mb-6" style={{ borderColor: 'var(--color-border)' }}>
            <button
              onClick={() => setActiveTab('verifications')}
              className="flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all"
              style={{
                borderColor: activeTab === 'verifications' ? 'var(--color-accent)' : 'transparent',
                color: activeTab === 'verifications' ? 'var(--color-accent)' : 'var(--color-ink-secondary)',
              }}
            >
              <FileCheck2 className="size-4" />
              Student Verifications
              {stats && stats.pendingVerifications > 0 && (
                <span className="ml-1 rounded-full bg-orange-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  {stats.pendingVerifications}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('moderation')}
              className="flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all"
              style={{
                borderColor: activeTab === 'moderation' ? 'var(--color-accent)' : 'transparent',
                color: activeTab === 'moderation' ? 'var(--color-accent)' : 'var(--color-ink-secondary)',
              }}
            >
              <ShieldAlert className="size-4" />
              Content Moderation
              {stats && stats.openReports > 0 && (
                <span className="ml-1 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  {stats.openReports}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('opportunities')
                loadOpportunitiesData()
              }}
              className="flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all"
              style={{
                borderColor: activeTab === 'opportunities' ? 'var(--color-accent)' : 'transparent',
                color: activeTab === 'opportunities' ? 'var(--color-accent)' : 'var(--color-ink-secondary)',
              }}
            >
              <Briefcase className="size-4" />
              Opportunities Management
              {opportunities.length > 0 && (
                <span className="ml-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  {opportunities.length}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: VERIFICATIONS QUEUE */}
          {activeTab === 'verifications' && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  {(['pending', 'all', 'approved', 'rejected'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setVerificationFilter(filter)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors"
                      style={{
                        background: verificationFilter === filter ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                        color: verificationFilter === filter ? '#FFFFFF' : 'var(--color-ink-secondary)',
                      }}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                <Button variant="ghost" size="sm" onClick={loadVerificationData}>
                  <RefreshCw className="size-3.5 mr-1.5" /> Refresh
                </Button>
              </div>

              {/* Items List */}
              {loadingVerifications ? (
                <div className="py-16 text-center text-xs text-zinc-400">Loading verification submissions...</div>
              ) : filteredVerifications.length === 0 ? (
                <EmptyState
                  title="No verification requests in this view"
                  description="When students upload their ID cards for institutional verification, they appear in this queue."
                />
              ) : (
                <div className="space-y-4">
                  {filteredVerifications.map((item) => (
                    <Card
                      key={item.id}
                      className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-5 transition-all"
                    >
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>
                            {item.fullName}
                          </h3>
                          <Badge
                            tone={
                              item.status === 'approved'
                                ? 'green'
                                : item.status === 'rejected'
                                ? 'default'
                                : 'amber'
                            }
                          >
                            {item.status}
                          </Badge>
                          <span className="text-xs text-zinc-400 font-mono">
                            Enrollment: {item.enrollmentNo}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-400">
                          {item.branch} · Batch of {item.graduationYear} · {item.email}
                        </p>

                        {/* ID Card link */}
                        {item.idCardUrl && (
                          <div className="pt-2">
                            <a
                              href={item.idCardUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors"
                            >
                              <Eye className="size-3.5" /> Inspect Uploaded ID Document <ExternalLink className="size-3" />
                            </a>
                          </div>
                        )}

                        {item.reviewNotes && (
                          <p className="text-xs text-zinc-400 italic pt-1">
                            Review notes: {item.reviewNotes}
                          </p>
                        )}
                      </div>

                      {/* Action Box */}
                      {item.status === 'pending' && (
                        <div className="w-full md:w-72 shrink-0 space-y-2 pt-2 md:pt-0 border-t md:border-t-0 md:border-l md:pl-5">
                          <input
                            type="text"
                            placeholder="Optional audit notes..."
                            value={reviewNotes[item.id] || ''}
                            onChange={(e) =>
                              setReviewNotes({ ...reviewNotes, [item.id]: e.target.value })
                            }
                            className="w-full rounded-lg border px-3 py-1.5 text-xs"
                            style={{
                              background: 'var(--color-bg)',
                              borderColor: 'var(--color-border)',
                              color: 'var(--color-ink)',
                            }}
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="primary"
                              className="h-8 flex-1 text-xs"
                              disabled={actionInProgress === item.id}
                              onClick={() => handleReviewVerification(item.id, 'approved')}
                            >
                              <CheckCircle2 className="size-3.5 mr-1" /> Approve
                            </Button>
                            <Button
                              variant="secondary"
                              className="h-8 flex-1 text-xs text-rose-500 hover:text-rose-400"
                              disabled={actionInProgress === item.id}
                              onClick={() => handleReviewVerification(item.id, 'rejected')}
                            >
                              <XCircle className="size-3.5 mr-1" /> Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONTENT MODERATION QUEUE */}
          {activeTab === 'moderation' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  {(['pending', 'all', 'resolved', 'dismissed'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setReportFilter(filter)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors"
                      style={{
                        background: reportFilter === filter ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                        color: reportFilter === filter ? '#FFFFFF' : 'var(--color-ink-secondary)',
                      }}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                <Button variant="ghost" size="sm" onClick={loadModerationData}>
                  <RefreshCw className="size-3.5 mr-1.5" /> Refresh
                </Button>
              </div>

              {loadingReports ? (
                <div className="py-16 text-center text-xs text-zinc-400">Loading moderation reports...</div>
              ) : reports.length === 0 ? (
                <EmptyState
                  title="No moderation reports"
                  description="When members flag inappropriate content or conduct, reports appear here for administrator intervention."
                />
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <Card
                      key={report.id}
                      className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-5 transition-all"
                    >
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-xs uppercase tracking-wider text-rose-500">
                            [{report.targetType}]
                          </span>
                          <Badge tone="dark">{report.reason}</Badge>
                          <Badge
                            tone={
                              report.status === 'resolved'
                                ? 'green'
                                : report.status === 'dismissed'
                                ? 'default'
                                : 'amber'
                            }
                          >
                            {report.status}
                          </Badge>
                          <span className="text-xs text-zinc-400">
                            Reported by {report.reporterName}
                          </span>
                        </div>

                        {report.targetSnippet && (
                          <div
                            className="rounded-lg border p-3 text-xs leading-relaxed italic"
                            style={{
                              background: 'var(--color-bg-secondary)',
                              borderColor: 'var(--color-border)',
                              color: 'var(--color-ink)',
                            }}
                          >
                            &ldquo;{report.targetSnippet}&rdquo;
                          </div>
                        )}

                        <p className="text-xs text-zinc-300">
                          <strong>Details:</strong> {report.details}
                        </p>

                        {report.adminNotes && (
                          <p className="text-xs text-zinc-400 italic pt-1">
                            Moderator response: {report.adminNotes}
                          </p>
                        )}
                      </div>

                      {/* Action Box */}
                      {report.status === 'pending' && (
                        <div className="w-full md:w-72 shrink-0 space-y-2 pt-2 md:pt-0 border-t md:border-t-0 md:border-l md:pl-5">
                          <input
                            type="text"
                            placeholder="Resolution notes..."
                            value={moderationNotes[report.id] || ''}
                            onChange={(e) =>
                              setModerationNotes({ ...moderationNotes, [report.id]: e.target.value })
                            }
                            className="w-full rounded-lg border px-3 py-1.5 text-xs"
                            style={{
                              background: 'var(--color-bg)',
                              borderColor: 'var(--color-border)',
                              color: 'var(--color-ink)',
                            }}
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="primary"
                              className="h-8 flex-1 text-xs"
                              disabled={actionInProgress === report.id}
                              onClick={() => handleResolveReport(report.id, 'resolved')}
                            >
                              <ShieldCheck className="size-3.5 mr-1" /> Resolve
                            </Button>
                            <Button
                              variant="secondary"
                              className="h-8 flex-1 text-xs"
                              disabled={actionInProgress === report.id}
                              onClick={() => handleResolveReport(report.id, 'dismissed')}
                            >
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OPPORTUNITIES MANAGEMENT */}
          {activeTab === 'opportunities' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-medium text-[var(--color-ink-secondary)]">
                  Total published listings: <strong className="text-[var(--color-ink)]">{opportunities.length}</strong>
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={loadOpportunitiesData}>
                    <RefreshCw className="size-3.5 mr-1.5" /> Refresh
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingOppId(null)
                      setOppTitle('')
                      setOppOrg('')
                      setOppType('Internship')
                      setOppLocation('LNCT Bhopal / Hybrid')
                      setOppDeadline('Apply in 14 days')
                      setOppSkills('React, TypeScript')
                      setOppDescription('')
                      setOppFeatured(false)
                      setOppError(null)
                      setOppModalOpen(true)
                    }}
                  >
                    <Plus className="size-4 mr-1.5" /> Post Opportunity
                  </Button>
                </div>
              </div>

              {loadingOpportunities ? (
                <div className="py-16 text-center text-xs text-zinc-400">Loading campus opportunities...</div>
              ) : opportunities.length === 0 ? (
                <EmptyState
                  title="No opportunities found"
                  description="Use the Post Opportunity button to add internships, hackathons, or roles."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {opportunities.map((opp) => (
                    <Card key={opp.id} className="p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <span className="text-[11px] font-semibold text-[var(--color-ink-muted)]">
                              {opp.organization}
                            </span>
                            <h4 className="font-display text-base font-bold text-[var(--color-ink)]">
                              {opp.title}
                            </h4>
                          </div>
                          <Badge tone="accent">{opp.type}</Badge>
                        </div>

                        <p className="text-xs text-[var(--color-ink-secondary)] line-clamp-2 mb-3">
                          {opp.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {opp.skills.map((skill) => (
                            <Badge key={skill}>{skill}</Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t pt-3 border-[var(--color-border)] text-xs text-[var(--color-ink-muted)]">
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" /> {opp.location}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingOppId(opp.id)
                              setOppTitle(opp.title)
                              setOppOrg(opp.organization)
                              setOppType(opp.type)
                              setOppLocation(opp.location)
                              setOppDeadline(opp.deadline)
                              setOppSkills(opp.skills.join(', '))
                              setOppDescription(opp.description)
                              setOppFeatured(opp.featured || false)
                              setOppError(null)
                              setOppModalOpen(true)
                            }}
                            className="p-1.5 rounded-md hover:bg-[var(--color-surface-hover)] text-zinc-400 hover:text-zinc-200 transition-colors"
                            title="Edit Opportunity"
                          >
                            <Edit3 className="size-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteOpportunity(opp.id)}
                            className="p-1.5 rounded-md hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition-colors"
                            title="Delete Opportunity"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* OPPORTUNITY MODAL (CREATE / EDIT) */}
          {oppModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div
                className="relative w-full max-w-lg rounded-2xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
                style={{
                  background: 'var(--color-card)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-ink)',
                }}
              >
                <button
                  onClick={() => setOppModalOpen(false)}
                  className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:text-zinc-200"
                >
                  <X className="size-5" />
                </button>

                <h3 className="font-display text-lg font-bold mb-1">
                  {editingOppId ? 'Edit Opportunity' : 'Post New Opportunity'}
                </h3>
                <p className="text-xs text-[var(--color-ink-muted)] mb-5">
                  Publish campus roles, internships, or hackathons
                </p>

                {oppError && (
                  <div className="mb-4 rounded-lg p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-500 font-medium">
                    {oppError}
                  </div>
                )}

                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (!user) return
                    setOppSaving(true)
                    setOppError(null)
                    const skillsArray = oppSkills
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)

                    if (editingOppId) {
                      const res = await updateCampusOpportunity(user.id, isAdmin, editingOppId, {
                        title: oppTitle,
                        organization: oppOrg,
                        type: oppType,
                        location: oppLocation,
                        deadline: oppDeadline,
                        skills: skillsArray,
                        description: oppDescription,
                        featured: oppFeatured,
                      })
                      setOppSaving(false)
                      if (res.success && res.opportunity) {
                        setOpportunities((prev) =>
                          prev.map((o) => (o.id === editingOppId ? res.opportunity! : o))
                        )
                        setOppModalOpen(false)
                      } else {
                        setOppError(res.error || 'Failed to update opportunity.')
                      }
                    } else {
                      const res = await createCampusOpportunity(user.id, isAdmin, {
                        title: oppTitle,
                        organization: oppOrg,
                        type: oppType,
                        location: oppLocation,
                        deadline: oppDeadline,
                        skills: skillsArray,
                        description: oppDescription,
                        featured: oppFeatured,
                      })
                      setOppSaving(false)
                      if (res.success && res.opportunity) {
                        setOpportunities((prev) => [res.opportunity!, ...prev])
                        setOppModalOpen(false)
                      } else {
                        setOppError(res.error || 'Failed to create opportunity.')
                      }
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Role Title *</label>
                      <input
                        required
                        type="text"
                        value={oppTitle}
                        onChange={(e) => setOppTitle(e.target.value)}
                        placeholder="Frontend Engineer Intern"
                        className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
                        style={{
                          background: 'var(--color-bg)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-ink)',
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Organization *</label>
                      <input
                        required
                        type="text"
                        value={oppOrg}
                        onChange={(e) => setOppOrg(e.target.value)}
                        placeholder="LNCT Tech Cell"
                        className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
                        style={{
                          background: 'var(--color-bg)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-ink)',
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Type *</label>
                      <select
                        value={oppType}
                        onChange={(e) => setOppType(e.target.value as Opportunity['type'])}
                        className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
                        style={{
                          background: 'var(--color-bg)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-ink)',
                        }}
                      >
                        <option value="Internship">Internship</option>
                        <option value="Job">Job</option>
                        <option value="Hackathon">Hackathon</option>
                        <option value="Competition">Competition</option>
                        <option value="Campus Event">Campus Event</option>
                        <option value="Freelance">Freelance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Location *</label>
                      <input
                        required
                        type="text"
                        value={oppLocation}
                        onChange={(e) => setOppLocation(e.target.value)}
                        placeholder="Bhopal / Remote"
                        className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
                        style={{
                          background: 'var(--color-bg)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-ink)',
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Deadline *</label>
                      <input
                        required
                        type="text"
                        value={oppDeadline}
                        onChange={(e) => setOppDeadline(e.target.value)}
                        placeholder="Oct 31, 2026"
                        className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
                        style={{
                          background: 'var(--color-bg)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-ink)',
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Skills (comma-separated)</label>
                      <input
                        type="text"
                        value={oppSkills}
                        onChange={(e) => setOppSkills(e.target.value)}
                        placeholder="React, Node.js, Python"
                        className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
                        style={{
                          background: 'var(--color-bg)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-ink)',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Description *</label>
                    <textarea
                      required
                      rows={3}
                      value={oppDescription}
                      onChange={(e) => setOppDescription(e.target.value)}
                      placeholder="Details about the opportunity, requirements, and candidate expectations..."
                      className="w-full rounded-lg border p-3 text-sm outline-none resize-none"
                      style={{
                        background: 'var(--color-bg)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-ink)',
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="oppFeatured"
                      checked={oppFeatured}
                      onChange={(e) => setOppFeatured(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="oppFeatured" className="text-xs font-medium cursor-pointer">
                      Feature on campus home & highlighted listings
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
                    <Button type="button" variant="secondary" size="sm" onClick={() => setOppModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={oppSaving}>
                      {oppSaving ? 'Saving...' : editingOppId ? 'Save Changes' : 'Publish Opportunity'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </AppShell>
  )
}

