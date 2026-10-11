import { useEffect, useRef, useState, lazy, Suspense, type ReactNode } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { ArrowRight, ArrowDown, Users, Briefcase, BookOpen, Lightbulb, GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/layout'
import { Button, Badge, Avatar, Card } from '../components/ui'
import { LiquidButton, MagneticButton, SpatialCard } from '../components/Interactive'
import { projects } from '../data/projects'
import { students } from '../data/students'
import { opportunities } from '../data/opportunities'
import { mentors } from '../data/mentors'

const NetworkCanvas = lazy(() =>
  import('../components/NetworkScene').then((m) => ({ default: m.NetworkCanvas }))
)

/* ─── SECTION REVEAL ANIMATION ─── */
function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─── LANDING PAGE ─── */
export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()

  return (
    <div
      ref={containerRef}
      className="grain min-h-screen overflow-hidden transition-colors duration-500 relative"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* ─── PERSISTENT 3D CAMPUS CONSTELLATION ─── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Suspense fallback={null}>
          <NetworkCanvas />
        </Suspense>
      </div>

      <Navbar landing />

      <main className="relative z-10">
        {/* ─── HERO ─── */}
        <HeroSection scrollYProgress={scrollYProgress} />

        {/* ─── STATS ─── */}
        <StatsSection />

        {/* ─── STUDENTS ─── */}
        <StudentsSection />

        {/* ─── PROJECTS ─── */}
        <ProjectsSection />

        {/* ─── OPPORTUNITIES ─── */}
        <OpportunitiesSection />

        {/* ─── MENTORSHIP ─── */}
        <MentorshipSection />

        {/* ─── FINAL CTA ─── */}
        <FinalCTA />
      </main>
    </div>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  HERO                                         */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function HeroSection({ scrollYProgress }: { scrollYProgress: any }) {
  const heroOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.12], [0, -80])

  return (
    <section className="relative min-h-[100vh] flex flex-col justify-center overflow-hidden">
      {/* Content */}
      <motion.div
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative z-10 mx-auto w-full max-w-[1440px] px-5 sm:px-6 lg:px-10"
      >
        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left: Typography */}
          <div className="max-w-2xl pt-12 lg:pt-0">
            <div
              className="rounded-2xl p-6 sm:p-10 border shadow-md transition-colors duration-400 relative overflow-hidden"
              style={{
                background: 'color-mix(in srgb, var(--color-card) 90%, transparent)',
                borderColor: 'var(--color-border)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow: '0 10px 40px -10px rgba(23, 23, 23, 0.08)',
              }}
            >
              {/* Subtle accent highlight behind title for depth */}
              <div
                className="pointer-events-none absolute -top-24 -left-24 size-64 rounded-full opacity-20 blur-3xl"
                style={{ background: 'var(--color-accent)' }}
              />

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="label-sm mb-6 relative z-10 font-bold"
                style={{ color: 'var(--color-accent)' }}
              >
                For LNCT students, seniors & alumni
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="heading-hero relative z-10"
                style={{ color: 'var(--color-ink)' }}
              >
                YOUR
                <br />
                CAMPUS.
                <br />
                <span style={{ color: 'var(--color-accent)' }}>YOUR NETWORK.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-6 max-w-lg text-lg leading-8 relative z-10 font-medium"
                style={{ color: 'var(--color-ink-secondary)' }}
              >
                One professional network connecting LNCT students, seniors, alumni, projects and opportunities.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-8 flex flex-wrap items-center gap-4 relative z-10"
              >
                <Link to="/signup">
                  <LiquidButton
                    size="lg"
                    variant="primary"
                    magnetic
                    className="gap-2 px-7 py-3.5 shadow-sm"
                  >
                    Join LNCT Connect
                    <ArrowRight className="size-4" />
                  </LiquidButton>
                </Link>
                <a
                  href="#community"
                  className="text-sm font-semibold transition-colors hover:text-[var(--color-accent)]"
                  style={{ color: 'var(--color-ink-secondary)' }}
                >
                  Explore community ↓
                </a>
              </motion.div>
            </div>
          </div>

          {/* Right: Interactive 3D Network Legend */}
          <div className="hidden lg:flex flex-col items-end justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="rounded-xl border p-4 shadow-md max-w-[280px] pointer-events-auto"
              style={{
                borderColor: 'var(--color-border)',
                background: 'color-mix(in srgb, var(--color-card) 92%, transparent)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
              }}
            >
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-ink-muted)' }}>
                  Spatial Campus Graph
                </span>
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: 'var(--color-accent)' }} />
                  <span className="relative inline-flex size-2 rounded-full" style={{ background: 'var(--color-accent)' }} />
                </span>
              </div>
              <p className="text-xs mb-3 font-medium" style={{ color: 'var(--color-ink-secondary)' }}>
                Move cursor to explore real-time constellations across LNCT nodes.
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold" style={{ color: 'var(--color-ink)' }}>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#E76F35]" />
                  Students
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#20211F]" />
                  Alumni
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#C25828]" />
                  Mentors
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#4A3B32]" />
                  Projects
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#737068]" />
                  Skills
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#D97706]" />
                  Opportunities
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ArrowDown className="size-5" style={{ color: 'var(--color-ink-muted)' }} />
        </motion.div>
      </motion.div>
    </section>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  STATS                                        */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function StatsSection() {
  return (
    <section
      id="community"
      className="section-line"
      style={{
        background: 'color-mix(in srgb, var(--color-bg-secondary) 55%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="mx-auto max-w-[1440px] px-5 sm:px-6 lg:px-10 py-20 lg:py-28">
        <Reveal>
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-16">
            <StatItem number="2,400+" label="Students & Alumni" />
            <StatItem number="120+" label="Projects in motion" />
            <StatItem number="56" label="Active mentors" />
            <StatItem number="18" label="New roles this week" />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function StatItem({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <p className="stat-number text-4xl sm:text-5xl lg:text-6xl">{number}</p>
      <p className="mt-3 text-sm font-medium" style={{ color: 'var(--color-ink-muted)' }}>
        {label}
      </p>
    </div>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  STUDENTS                                     */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function StudentsSection() {
  return (
    <section
      className="section-line"
      style={{
        background: 'color-mix(in srgb, var(--color-bg) 50%, transparent)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div className="mx-auto max-w-[1440px] px-5 sm:px-6 lg:px-10 py-20 lg:py-32">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          {/* Left: editorial text with subtle surface separation */}
          <Reveal>
            <div
              className="rounded-2xl p-6 sm:p-8 border shadow-xs max-w-lg"
              style={{
                background: 'color-mix(in srgb, var(--color-card) 85%, transparent)',
                borderColor: 'var(--color-border)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <p className="label-sm mb-4 font-bold" style={{ color: 'var(--color-accent)' }}>
                People
              </p>
              <h2 className="heading-section" style={{ color: 'var(--color-ink)' }}>
                Meet the
                <br />
                people
                <br />
                around you.
              </h2>
              <p className="mt-6 text-lg leading-8 font-medium" style={{ color: 'var(--color-ink-secondary)' }}>
                Find peers who care about the same problems, ideas, and next steps you do.
              </p>
              <Link
                to="/people"
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold hover:underline"
                style={{ color: 'var(--color-accent)' }}
              >
                Browse people <ArrowRight className="size-4" />
              </Link>
            </div>
          </Reveal>

          {/* Right: staggered student cards emerging in 3D */}
          <div className="grid grid-cols-2 gap-4">
            {students.slice(0, 4).map((student, i) => (
              <div key={student.id} className={i % 2 === 1 ? 'mt-8' : ''}>
                <SpatialCard
                  delay={i * 0.12}
                  direction={i % 2 === 0 ? 'left' : 'right'}
                >
                  <Card
                    className="p-4 transition-all hover:shadow-lg border"
                    style={{
                      background: 'var(--color-card)',
                      borderColor: 'var(--color-border)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                    }}
                  >
                    <Avatar name={student.name} initials={student.initials} tone={student.avatar} size="lg" />
                    <h3
                      className="font-display mt-3 text-sm font-semibold"
                      style={{ color: 'var(--color-ink)' }}
                    >
                      {student.name}
                    </h3>
                    <p className="mt-1 text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                      {student.branch} · {student.year}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {student.skills.slice(0, 2).map((skill) => (
                        <Badge key={skill}>{skill}</Badge>
                      ))}
                    </div>
                  </Card>
                </SpatialCard>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  PROJECTS                                     */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function ProjectsSection() {
  return (
    <section
      className="section-line section-dark"
      style={{
        background: 'linear-gradient(180deg, rgba(32, 33, 31, 0.74) 0%, rgba(22, 23, 21, 0.84) 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="mx-auto max-w-[1440px] px-5 sm:px-6 lg:px-10 py-20 lg:py-32">
        <Reveal>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="label-sm mb-4 font-bold" style={{ color: 'var(--color-accent)' }}>
                Projects
              </p>
              <h2 className="heading-section text-[#FAF9F6]">
                Ideas become
                <br />
                real when the right
                <br />
                people find
                <br />
                each other.
              </h2>
            </div>
            <Link to="/projects">
              <Button variant="dark">
                Browse all projects <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </Reveal>

        {/* Horizontal scroll project cards emerging in 3D */}
        <div className="h-scroll mt-12 -mx-5 px-5 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 py-4">
          {projects.map((project, i) => (
            <div key={project.id} className="w-[320px] shrink-0">
              <SpatialCard delay={i * 0.08} direction="up">
                <Card className="p-5 transition-all hover:shadow-lg bg-[#272825] border-[#363834] text-[#FAF9F6]">
                  <div className="flex items-center justify-between">
                    <Badge tone={project.status === 'Launched' ? 'green' : project.status === 'Building' ? 'accent' : 'amber'}>
                      {project.status}
                    </Badge>
                    <span className="text-xs text-[#A3A099]">
                      {project.members} builders
                    </span>
                  </div>
                  <h3 className="font-display mt-4 text-lg font-semibold tracking-[-0.02em] text-[#FAF9F6]">
                    {project.name}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#D5D3CC]">
                    {project.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {project.tech.slice(0, 3).map((t) => (
                      <Badge key={t} tone="dark">{t}</Badge>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center gap-2">
                    <Avatar
                      name={project.creator.name}
                      initials={project.creator.initials}
                      tone={project.creator.avatar}
                      size="xs"
                    />
                    <span className="text-xs text-[#A3A099]">
                      {project.creator.name}
                    </span>
                  </div>
                </Card>
              </SpatialCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  OPPORTUNITIES                                */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function OpportunitiesSection() {
  return (
    <section
      id="opportunities"
      className="section-line"
      style={{
        background: 'color-mix(in srgb, var(--color-bg) 50%, transparent)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div className="mx-auto max-w-[1440px] px-5 sm:px-6 lg:px-10 py-20 lg:py-32">
        <div className="grid gap-16 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          {/* Left: opportunity cards grid emerging in 3D */}
          <div className="order-2 lg:order-1 grid gap-4 sm:grid-cols-2">
            {opportunities.slice(0, 4).map((opp, i) => (
              <SpatialCard
                key={opp.id}
                delay={i * 0.1}
                direction={i % 2 === 0 ? 'left' : 'right'}
              >
                <Card
                  className="p-4 transition-all hover:shadow-lg border"
                  style={{
                    background: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="grid size-10 place-items-center rounded-md font-display font-bold text-white text-sm"
                      style={{ background: 'var(--color-accent)' }}
                    >
                      {opp.logo}
                    </div>
                    <Badge tone="blue">{opp.type}</Badge>
                  </div>
                  <h3
                    className="font-display mt-3 text-sm font-semibold"
                    style={{ color: 'var(--color-ink)' }}
                  >
                    {opp.title}
                  </h3>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                    {opp.organization} · {opp.location}
                  </p>
                  <p className="mt-2 text-xs font-semibold" style={{ color: 'var(--color-accent)' }}>
                    Ends {opp.deadline}
                  </p>
                </Card>
              </SpatialCard>
            ))}
          </div>

          {/* Right: editorial text */}
          <Reveal className="order-1 lg:order-2">
            <div
              className="rounded-2xl p-6 sm:p-8 border shadow-xs max-w-lg"
              style={{
                background: 'color-mix(in srgb, var(--color-card) 85%, transparent)',
                borderColor: 'var(--color-border)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <p className="label-sm mb-4 font-bold" style={{ color: 'var(--color-accent)' }}>
                Opportunities
              </p>
              <h2 className="heading-section" style={{ color: 'var(--color-ink)' }}>
                The next
                <br />
                opportunity is
                <br />
                closer than
                <br />
                you think.
              </h2>
              <p className="mt-6 text-lg leading-8 font-medium" style={{ color: 'var(--color-ink-secondary)' }}>
                Internships, roles, competitions, and campus moments curated for people who are ready to move.
              </p>
              <Link
                to="/opportunities"
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold hover:underline"
                style={{ color: 'var(--color-accent)' }}
              >
                View all opportunities <ArrowRight className="size-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  MENTORSHIP                                   */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function MentorshipSection() {
  return (
    <section
      id="mentors"
      className="section-line"
      style={{
        background: 'color-mix(in srgb, var(--color-bg-secondary) 55%, transparent)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div className="mx-auto max-w-[1440px] px-5 sm:px-6 lg:px-10 py-20 lg:py-32">
        <Reveal>
          <div
            className="text-center max-w-3xl mx-auto mb-16 rounded-2xl p-6 sm:p-8 border shadow-xs"
            style={{
              background: 'color-mix(in srgb, var(--color-card) 85%, transparent)',
              borderColor: 'var(--color-border)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <p className="label-sm mb-4 font-bold" style={{ color: 'var(--color-accent)' }}>
              Mentorship
            </p>
            <h2 className="heading-section" style={{ color: 'var(--color-ink)' }}>
              Learn from those
              <br />
              who've been here.
            </h2>
            <p className="mt-6 text-lg leading-8 mx-auto max-w-xl font-medium" style={{ color: 'var(--color-ink-secondary)' }}>
              A little lived experience can save a lot of guesswork. Find an alumnus who remembers the questions you have now.
            </p>
          </div>
        </Reveal>

        {/* Mentorship pathway visualization */}
        <div className="relative">
          {/* Connection line */}
          <div
            className="hidden lg:block absolute top-1/2 left-0 right-0 h-px -translate-y-1/2"
            style={{ background: 'var(--color-border)' }}
          />

          <div className="grid gap-8 md:grid-cols-3">
            {/* Student */}
            <SpatialCard delay={0} direction="up">
              <div className="text-center relative z-10 p-4">
                <div
                  className="mx-auto grid size-20 place-items-center rounded-full border-2"
                  style={{
                    borderColor: 'var(--color-accent)',
                    background: 'var(--color-surface)',
                  }}
                >
                  <Users className="size-8" style={{ color: 'var(--color-accent)' }} />
                </div>
                <h3 className="font-display mt-4 text-xl font-semibold" style={{ color: 'var(--color-ink)' }}>
                  Student
                </h3>
                <p className="mt-2 text-sm font-medium" style={{ color: 'var(--color-ink-muted)' }}>
                  Ask the question
                  <br />
                  you're avoiding.
                </p>
              </div>
            </SpatialCard>

            {/* Senior */}
            <SpatialCard delay={0.15} direction="up">
              <div className="text-center relative z-10 p-4">
                <div
                  className="mx-auto grid size-20 place-items-center rounded-full border-2"
                  style={{
                    borderColor: 'var(--color-accent)',
                    background: 'var(--color-surface)',
                  }}
                >
                  <BookOpen className="size-8" style={{ color: 'var(--color-accent)' }} />
                </div>
                <h3 className="font-display mt-4 text-xl font-semibold" style={{ color: 'var(--color-ink)' }}>
                  Senior
                </h3>
                <p className="mt-2 text-sm font-medium" style={{ color: 'var(--color-ink-muted)' }}>
                  Share what you've
                  <br />
                  learned along the way.
                </p>
              </div>
            </SpatialCard>

            {/* Alumni */}
            <SpatialCard delay={0.3} direction="up">
              <div className="text-center relative z-10 p-4">
                <div
                  className="mx-auto grid size-20 place-items-center rounded-full border-2"
                  style={{
                    borderColor: 'var(--color-accent)',
                    background: 'var(--color-surface)',
                  }}
                >
                  <GraduationCap className="size-8" style={{ color: 'var(--color-accent)' }} />
                </div>
                <h3 className="font-display mt-4 text-xl font-semibold" style={{ color: 'var(--color-ink)' }}>
                  Alumni
                </h3>
                <p className="mt-2 text-sm font-medium" style={{ color: 'var(--color-ink-muted)' }}>
                  Give back to the
                  <br />
                  community that built you.
                </p>
              </div>
            </SpatialCard>
          </div>
        </div>

        {/* Mentor cards emerging in 3D */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {mentors.slice(0, 4).map((mentor, i) => (
            <SpatialCard key={mentor.id} delay={i * 0.08} direction="up">
              <Card
                className="p-4 transition-all hover:shadow-lg border"
                style={{
                  background: 'var(--color-card)',
                  borderColor: 'var(--color-border)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                <Avatar name={mentor.name} initials={mentor.initials} tone={mentor.avatar} size="lg" />
                <h3
                  className="font-display mt-3 text-sm font-semibold"
                  style={{ color: 'var(--color-ink)' }}
                >
                  {mentor.name}
                </h3>
                <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--color-accent)' }}>
                  {mentor.role} @ {mentor.company}
                </p>
                <p className="mt-1 text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                  {mentor.experience}
                </p>
                <p className="mt-3 text-xs" style={{ color: 'var(--color-ink-secondary)' }}>
                  {mentor.topics.join(' · ')}
                </p>
              </Card>
            </SpatialCard>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  FINAL CTA                                    */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function FinalCTA() {
  return (
    <section
      className="section-line"
      style={{
        background: 'color-mix(in srgb, var(--color-bg) 55%, transparent)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div className="mx-auto max-w-[1440px] px-5 sm:px-6 lg:px-10 py-24 lg:py-40">
        <Reveal>
          <div className="text-center">
            <h2 className="heading-hero mx-auto" style={{ color: 'var(--color-ink)' }}>
              LNCT
              <br />
              <span style={{ color: 'var(--color-accent)' }}>CONNECT</span>
            </h2>
            <p
              className="mx-auto mt-8 max-w-lg text-xl leading-8 font-medium"
              style={{ color: 'var(--color-ink-secondary)' }}
            >
              Your campus is bigger than your classroom.
            </p>
            <div className="mt-10">
              <Link to="/signup">
                <LiquidButton
                  size="lg"
                  variant="primary"
                  magnetic
                  className="h-14 px-8 text-base font-semibold shadow-md gap-2"
                >
                  Join LNCT Connect
                  <ArrowRight className="size-5" />
                </LiquidButton>
              </Link>
            </div>
          </div>
        </Reveal>

        {/* Footer */}
        <div
          className="mt-24 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row"
          style={{ borderColor: 'var(--color-line)' }}
        >
          <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
            © 2026 LNCT Connect. A private professional network for LNCT.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs transition-colors hover:text-[var(--color-accent)]" style={{ color: 'var(--color-ink-muted)' }}>
              Privacy
            </a>
            <a href="#" className="text-xs transition-colors hover:text-[var(--color-accent)]" style={{ color: 'var(--color-ink-muted)' }}>
              Terms
            </a>
            <a href="#" className="text-xs transition-colors hover:text-[var(--color-accent)]" style={{ color: 'var(--color-ink-muted)' }}>
              Contact
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
