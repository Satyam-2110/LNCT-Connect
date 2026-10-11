import { useState } from 'react'
import { Bell, ChevronRight, Eye, Lock, Palette, ShieldCheck, UserRound } from 'lucide-react'
import { AppShell, PageIntro } from '../components/layout'
import { Button, Card, Toggle } from '../components/ui'
import { MagneticButton } from '../components/Interactive'
import { currentUser } from '../data/students'
import { useTheme } from '../lib/theme'

const sections = [
  { id: 'account', label: 'Account', icon: UserRound },
  { id: 'profile', label: 'Profile', icon: Eye },
  { id: 'privacy', label: 'Privacy', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
]

export function SettingsPage() {
  const [active, setActive] = useState('account')
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [discoverable, setDiscoverable] = useState(true)
  const [showActivity, setShowActivity] = useState(true)
  const [push, setPush] = useState(false)
  const [saved, setSaved] = useState(false)
  const { theme, toggle } = useTheme()

  const save = () => {
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  return (
    <AppShell>
      <PageIntro
        eyebrow="Preferences"
        title="Settings & Privacy"
        detail="Manage your personal information, networking privacy, and interface theme."
      />

      <div className="grid items-start gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
        {/* Navigation Tabs */}
        <aside className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 pb-2 md:mx-0 md:block md:space-y-1 md:overflow-visible md:p-0">
          {sections.map((section) => {
            const Icon = section.icon
            const isCurrent = active === section.id
            return (
              <button
                key={section.id}
                onClick={() => setActive(section.id)}
                className="flex shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-xs font-semibold transition md:w-full"
                style={{
                  background: isCurrent ? 'var(--color-accent-subtle)' : 'transparent',
                  color: isCurrent ? 'var(--color-accent)' : 'var(--color-ink-secondary)',
                  border: `1px solid ${isCurrent ? 'rgba(231, 111, 53, 0.25)' : 'transparent'}`,
                }}
              >
                <Icon className="size-4" />
                {section.label}
              </button>
            )
          })}
        </aside>

        {/* Content Pane */}
        <section>
          <Card className="p-6">
            {active === 'account' && (
              <>
                <SettingsHeader
                  title="Account Credentials"
                  detail="Your verified LNCT student email and profile access credentials."
                />
                <div className="space-y-4">
                  <Field label="Full Name" value={currentUser.name} />
                  <Field label="Campus Email" value="aanya.mehta@lnct.ac.in" type="email" />
                  <div
                    className="flex items-center justify-between rounded-lg border p-4"
                    style={{
                      borderColor: 'var(--color-border)',
                      background: 'var(--color-bg-secondary)',
                    }}
                  >
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'var(--color-ink)' }}>
                        Password
                      </p>
                      <p className="mt-0.5 text-[11px]" style={{ color: 'var(--color-ink-muted)' }}>
                        Last updated 3 months ago
                      </p>
                    </div>
                    <Button size="sm" variant="secondary">
                      Update Password
                    </Button>
                  </div>
                </div>
              </>
            )}

            {active === 'profile' && (
              <>
                <SettingsHeader
                  title="Profile Discovery"
                  detail="Manage who can discover and connect with your LNCT profile."
                />
                <div className="space-y-5">
                  <Toggle
                    checked={discoverable}
                    onChange={setDiscoverable}
                    label="Visible in Campus Search"
                    description="Allow other students and alumni to find your profile in the People directory."
                  />
                  <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />
                  <Toggle
                    checked={showActivity}
                    onChange={setShowActivity}
                    label="Show Active Status"
                    description="Display online indicator when you are browsing the platform."
                  />
                  <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />
                  <button className="flex w-full items-center justify-between text-left">
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'var(--color-ink)' }}>
                        Network Scope
                      </p>
                      <p className="mt-0.5 text-[11px]" style={{ color: 'var(--color-ink-muted)' }}>
                        LNCT students and verified alumni only
                      </p>
                    </div>
                    <ChevronRight className="size-4 text-[var(--color-ink-muted)]" />
                  </button>
                </div>
              </>
            )}

            {active === 'privacy' && (
              <>
                <SettingsHeader
                  title="Privacy & Safety"
                  detail="Configure boundaries for messaging and connection requests."
                />
                <div className="space-y-5">
                  <Toggle
                    checked={true}
                    onChange={() => undefined}
                    label="Require Connection Before Messaging"
                    description="Students must send a mutual connection request before sending direct messages."
                  />
                  <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />
                  <Toggle
                    checked={false}
                    onChange={() => undefined}
                    label="Share Profile View Receipts"
                    description="Notify other members when you view their public campus profile."
                  />
                  <div
                    className="mt-6 rounded-md border p-4 text-xs font-medium"
                    style={{
                      borderColor: 'rgba(46, 125, 80, 0.3)',
                      background: 'rgba(46, 125, 80, 0.08)',
                      color: '#2E7D50',
                    }}
                  >
                    <p className="flex items-center gap-2 font-bold">
                      <ShieldCheck className="size-4" />
                      LNCT Network Verified Protection
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed">
                      Only verified LNCT college domain credentials can join and browse profiles. External bots and scrapers are strictly prevented.
                    </p>
                  </div>
                </div>
              </>
            )}

            {active === 'notifications' && (
              <>
                <SettingsHeader
                  title="Notification Frequency"
                  detail="Choose what alerts and campus announcements you receive."
                />
                <div className="space-y-5">
                  <Toggle
                    checked={emailAlerts}
                    onChange={setEmailAlerts}
                    label="Weekly Campus Digest"
                    description="Weekly email of new hackathons, project recruitments, and alumni openings."
                  />
                  <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />
                  <Toggle
                    checked={push}
                    onChange={setPush}
                    label="Connection & Chat Alerts"
                    description="Notifications for direct messages and mentor booking requests."
                  />
                </div>
              </>
            )}

            {active === 'appearance' && (
              <>
                <SettingsHeader
                  title="Visual Theme"
                  detail="Switch between the light editorial alabaster theme and dark charcoal mode."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => {
                      if (theme !== 'light') toggle()
                    }}
                    className="rounded-md border-2 p-4 text-left transition"
                    style={{
                      borderColor: theme === 'light' ? 'var(--color-accent)' : 'var(--color-border)',
                      background: '#FAF9F6',
                    }}
                  >
                    <div
                      className="h-16 rounded border p-2"
                      style={{
                        background: '#FAF9F6',
                        borderColor: '#E7E5E0',
                      }}
                    >
                      <div className="h-2 w-10 rounded bg-[#E76F35]" />
                      <div className="mt-2.5 h-1.5 w-full rounded bg-[#E7E5E0]" />
                      <div className="mt-1.5 h-1.5 w-3/4 rounded bg-[#F0EEE8]" />
                    </div>
                    <p className="mt-3 text-xs font-bold text-[#171717]">Alabaster Light</p>
                    <p className="mt-0.5 text-[11px] text-[#737373]">
                      {theme === 'light' ? 'Active' : 'Click to activate'}
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      if (theme !== 'dark') toggle()
                    }}
                    className="rounded-md border-2 p-4 text-left transition"
                    style={{
                      borderColor: theme === 'dark' ? 'var(--color-accent)' : 'var(--color-border)',
                      background: '#20211F',
                    }}
                  >
                    <div
                      className="h-16 rounded border p-2"
                      style={{
                        background: '#141514',
                        borderColor: '#323330',
                      }}
                    >
                      <div className="h-2 w-10 rounded bg-[#E76F35]" />
                      <div className="mt-2.5 h-1.5 w-full rounded bg-[#323330]" />
                      <div className="mt-1.5 h-1.5 w-3/4 rounded bg-[#20211F]" />
                    </div>
                    <p className="mt-3 text-xs font-bold text-[#FAF9F6]">Charcoal Dark</p>
                    <p className="mt-0.5 text-[11px] text-[#8E8D88]">
                      {theme === 'dark' ? 'Active' : 'Click to activate'}
                    </p>
                  </button>
                </div>
              </>
            )}
          </Card>

          <div className="mt-5 flex items-center justify-end gap-3">
            <span
              className={`text-xs font-semibold text-emerald-600 transition ${
                saved ? 'opacity-100' : 'opacity-0'
              }`}
            >
              ✓ Preferences saved
            </span>
            <MagneticButton>
              <Button onClick={save}>Save Changes</Button>
            </MagneticButton>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

function SettingsHeader({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="mb-6 border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
      <h2
        className="font-display text-lg font-bold tracking-tight"
        style={{ color: 'var(--color-ink)' }}
      >
        {title}
      </h2>
      <p className="mt-1 text-xs" style={{ color: 'var(--color-ink-muted)' }}>
        {detail}
      </p>
    </div>
  )
}

function Field({
  label,
  value,
  type = 'text',
}: {
  label: string
  value: string
  type?: string
}) {
  return (
    <label className="block">
      <span
        className="mb-2.5 block text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--color-ink-secondary)' }}
      >
        {label}
      </span>
      <input
        type={type}
        defaultValue={value}
        className="h-11 w-full rounded-lg border px-3.5 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
        style={{
          borderColor: 'var(--color-border)',
          background: 'var(--color-card)',
          color: 'var(--color-ink)',
        }}
      />
    </label>
  )
}
