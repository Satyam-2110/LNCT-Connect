import { useState, useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, ChevronDown, Compass, Home, LogOut, Menu, MessageCircle, Search, Settings, Shield, Sparkles, Users, X } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { currentUser } from '../data/students'
import { Avatar, Button, IconButton, Logo, SearchField, ThemeToggle } from './ui'
import { cn } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { VerificationBanner } from './VerificationModal'
import { NotificationsDrawer } from './NotificationsDrawer'
import { fetchNotifications } from '../services/notifications'

const navLinks = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/people', label: 'People', icon: Users },
  { to: '/projects', label: 'Projects', icon: Compass },
  { to: '/opportunities', label: 'Opportunities', icon: Sparkles },
  { to: '/mentorship', label: 'Mentorship', icon: MessageCircle },
]

export function Navbar({ landing = false }: { landing?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const location = useLocation()
  const { user, profile, signOut } = useAuth()
  const close = () => setMobileOpen(false)

  useEffect(() => {
    if (user) {
      fetchNotifications(user.id).then((notifs) => {
        setUnreadNotifs(notifs.filter((n) => !n.isRead).length)
      })
    }
  }, [user])

  const displayName = profile?.full_name || currentUser.name
  const displayInitials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : currentUser.initials

  return (
    <header
      className="sticky top-0 z-50 border-b transition-colors duration-400"
      style={{
        borderColor: landing ? 'transparent' : 'var(--color-border)',
        background: landing ? 'transparent' : 'var(--color-header-bg)',
        backdropFilter: landing ? 'none' : 'blur(16px)',
      }}
    >
      <nav
        className="mx-auto flex h-[70px] max-w-[1440px] items-center justify-between px-5 sm:px-6 lg:px-10"
        aria-label="Main navigation"
      >
        <Link to={landing ? '/' : '/home'} className="shrink-0" aria-label="LNCT Connect home">
          <Logo />
        </Link>

        {!landing && (
          <div className="ml-8 hidden items-center gap-1 lg:flex">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3.5 py-2 text-sm transition-all',
                    isActive ? 'font-semibold' : 'hover:bg-[var(--color-bg-secondary)]'
                  )
                }
                style={({ isActive }) => ({
                  color: isActive ? 'var(--color-accent)' : 'var(--color-ink-secondary)',
                  background: isActive ? 'var(--color-accent-subtle)' : 'transparent',
                })}
              >
                {label}
              </NavLink>
            ))}
            {profile?.role === 'admin' && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3.5 py-2 text-sm transition-all flex items-center gap-1.5',
                    isActive ? 'font-semibold' : 'hover:bg-[var(--color-bg-secondary)]'
                  )
                }
                style={({ isActive }) => ({
                  color: isActive ? 'var(--color-accent)' : 'var(--color-ink-secondary)',
                  background: isActive ? 'var(--color-accent-subtle)' : 'transparent',
                })}
              >
                <Shield className="size-3.5" />
                Admin
              </NavLink>
            )}
          </div>
        )}

        {landing && (
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#community"
              className="text-sm font-medium transition-colors hover:text-[var(--color-accent)]"
              style={{ color: 'var(--color-ink-secondary)' }}
            >
              Campus Network
            </a>
            <a
              href="#opportunities"
              className="text-sm font-medium transition-colors hover:text-[var(--color-accent)]"
              style={{ color: 'var(--color-ink-secondary)' }}
            >
              Opportunities
            </a>
            <a
              href="#mentors"
              className="text-sm font-medium transition-colors hover:text-[var(--color-accent)]"
              style={{ color: 'var(--color-ink-secondary)' }}
            >
              Mentorship
            </a>
          </div>
        )}

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {!landing && (
            <>
              <div className="hidden w-52 xl:block">
                <SearchField value="" onChange={() => undefined} placeholder="Search network..." />
              </div>
              <IconButton label="Search" className="xl:hidden" onClick={() => setSearchOpen(true)}>
                <Search className="size-4" />
              </IconButton>
              <IconButton
                label="Notifications"
                className="relative"
                onClick={() => setNotificationsOpen(true)}
              >
                <Bell className="size-4" />
                {unreadNotifs > 0 && (
                  <span
                    className="absolute right-2 top-2 size-2 rounded-full"
                    style={{ background: 'var(--color-accent)' }}
                  />
                )}
              </IconButton>
              <Link to="/messages">
                <IconButton label="Messages">
                  <MessageCircle className="size-4" />
                </IconButton>
              </Link>
              <Link to="/profile/aanya-mehta" className="hidden sm:block">
                <Avatar name={displayName} initials={displayInitials} tone={currentUser.avatar} size="sm" />
              </Link>
              <IconButton label="Sign out" onClick={() => signOut()} title="Sign Out">
                <LogOut className="size-4" />
              </IconButton>
            </>
          )}

          {landing ? (
            user ? (
              <div className="flex items-center gap-2">
                <Link to="/home" className="hidden sm:block">
                  <Button size="sm">Go to Campus</Button>
                </Link>
                <IconButton label="Sign out" onClick={() => signOut()} title="Sign Out">
                  <LogOut className="size-4" />
                </IconButton>
              </div>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block">
                  <Button variant="secondary" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Join Network</Button>
                </Link>
              </>
            )
          ) : (
            <Link to="/profile/aanya-mehta" className="sm:hidden">
              <Avatar name={displayName} initials={displayInitials} tone={currentUser.avatar} size="sm" />
            </Link>
          )}

          <IconButton
            label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </IconButton>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t lg:hidden"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-card)',
            }}
          >
            <div className="space-y-1 p-4">
              {landing ? (
                <>
                  <a
                    onClick={close}
                    href="#community"
                    className="block rounded-md px-3 py-2.5 text-sm font-medium"
                    style={{ color: 'var(--color-ink)' }}
                  >
                    Campus Network
                  </a>
                  <a
                    onClick={close}
                    href="#opportunities"
                    className="block rounded-md px-3 py-2.5 text-sm font-medium"
                    style={{ color: 'var(--color-ink)' }}
                  >
                    Opportunities
                  </a>
                  <a
                    onClick={close}
                    href="#mentors"
                    className="block rounded-md px-3 py-2.5 text-sm font-medium"
                    style={{ color: 'var(--color-ink)' }}
                  >
                    Mentorship
                  </a>
                  <div className="border-t pt-2" style={{ borderColor: 'var(--color-border)' }}>
                    <Link
                      onClick={close}
                      to="/login"
                      className="block rounded-md px-3 py-2.5 text-sm font-medium"
                      style={{ color: 'var(--color-ink)' }}
                    >
                      Log in
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  {navLinks.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      onClick={close}
                      to={to}
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition"
                      style={({ isActive }) => ({
                        color: isActive ? 'var(--color-accent)' : 'var(--color-ink)',
                        background: isActive ? 'var(--color-accent-subtle)' : 'transparent',
                      })}
                    >
                      <Icon className="size-4" />
                      {label}
                    </NavLink>
                  ))}
                  <NavLink
                    onClick={close}
                    to="/settings"
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium"
                    style={{ color: 'var(--color-ink)' }}
                  >
                    <Settings className="size-4" />
                    Settings
                  </NavLink>
                  {profile?.role === 'admin' && (
                    <NavLink
                      onClick={close}
                      to="/admin"
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium"
                      style={{ color: 'var(--color-ink)' }}
                    >
                      <Shield className="size-4 text-orange-500" />
                      Admin Desk
                    </NavLink>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 top-[70px] border-b p-4 xl:hidden shadow-lg"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-card)',
            }}
          >
            <SearchField
              autoFocus
              value=""
              onChange={() => undefined}
              onClear={() => setSearchOpen(false)}
              placeholder="Search people, projects, opportunities..."
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!landing && location.pathname !== '/messages' && <MobileDock />}

      <NotificationsDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onUnreadCountChange={setUnreadNotifs}
      />
    </header>
  )
}

function MobileDock() {
  return (
    <div
      className="fixed inset-x-3 bottom-3 z-50 flex justify-around rounded-xl border p-1.5 shadow-lg backdrop-blur-md md:hidden"
      style={{
        borderColor: 'var(--color-border)',
        background: 'color-mix(in srgb, var(--color-card) 92%, transparent)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      {navLinks.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          aria-label={label}
          className="grid size-10 place-items-center rounded-lg transition"
          style={({ isActive }) => ({
            background: isActive ? 'var(--color-accent)' : 'transparent',
            color: isActive ? '#FFFFFF' : 'var(--color-ink-muted)',
          })}
        >
          <Icon className="size-4" />
        </NavLink>
      ))}
    </div>
  )
}

export function Footer() {
  return (
    <footer
      className="mt-20 border-t py-10 transition-colors duration-400"
      style={{
        borderColor: 'var(--color-border)',
        background: 'var(--color-bg)',
      }}
    >
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-6 px-5 sm:flex-row sm:px-6 lg:px-10">
        <div className="flex flex-col items-center gap-1.5 sm:items-start">
          <Logo />
          <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
            © 2026 LNCT Connect 2.0 · Private professional network for Lakshmi Narain College of Technology.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-5 text-xs font-semibold" style={{ color: 'var(--color-ink-secondary)' }}>
          <Link to="/home" className="transition-colors hover:text-[var(--color-accent)]">Home</Link>
          <Link to="/people" className="transition-colors hover:text-[var(--color-accent)]">People</Link>
          <Link to="/projects" className="transition-colors hover:text-[var(--color-accent)]">Projects</Link>
          <Link to="/opportunities" className="transition-colors hover:text-[var(--color-accent)]">Opportunities</Link>
          <Link to="/mentorship" className="transition-colors hover:text-[var(--color-accent)]">Mentorship</Link>
          <Link to="/settings" className="transition-colors hover:text-[var(--color-accent)]">Settings</Link>
        </div>
      </div>
    </footer>
  )
}

export function AppShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="grain min-h-screen flex flex-col justify-between transition-colors duration-400" style={{ background: 'var(--color-bg)' }}>
      <div>
        <Navbar />
        <VerificationBanner />
        <main className={cn('mx-auto px-5 pb-16 pt-8 sm:px-6 lg:px-10', wide ? 'max-w-[1440px]' : 'max-w-5xl')}>
          {children}
        </main>
      </div>
      <Footer />
    </div>
  )
}

export function PageIntro({
  eyebrow,
  title,
  detail,
  action,
}: {
  eyebrow?: string
  title: string
  detail: string
  action?: ReactNode
}) {
  return (
    <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="label-sm mb-2" style={{ color: 'var(--color-accent)' }}>
            {eyebrow}
          </p>
        )}
        <h1
          className="heading-subsection"
          style={{ color: 'var(--color-ink)' }}
        >
          {title}
        </h1>
        <p className="mt-3 text-base leading-relaxed" style={{ color: 'var(--color-ink-secondary)' }}>
          {detail}
        </p>
      </div>
      {action}
    </div>
  )
}

export function ProfileMenu() {
  return (
    <button
      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-[var(--color-bg-secondary)]"
    >
      <Avatar name={currentUser.name} initials={currentUser.initials} tone={currentUser.avatar} size="sm" />
      <ChevronDown className="size-3.5" style={{ color: 'var(--color-ink-muted)' }} />
    </button>
  )
}
