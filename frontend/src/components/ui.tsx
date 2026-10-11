import { useRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react'
import { Search, X, Moon, Sun } from 'lucide-react'
import { cn } from '../lib/utils'
import { useTheme } from '../lib/theme'

/* ─── LOGO (LNCT CONNECT 2.0) ─── */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="font-display grid size-8 place-items-center text-sm font-bold tracking-tight shadow-sm transition-transform hover:scale-105"
        style={{
          background: 'var(--color-accent)',
          color: '#FFFFFF',
          borderRadius: '4px',
        }}
      >
        L
      </div>
      {!compact && (
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-base font-bold tracking-[-0.03em]" style={{ color: 'var(--color-ink)' }}>
            LNCT
          </span>
          <span className="font-display text-base font-semibold tracking-[-0.03em]" style={{ color: 'var(--color-accent)' }}>
            Connect
          </span>
          <span
            className="rounded px-1 py-0.2 text-[9px] font-semibold tracking-wider uppercase"
            style={{
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-ink-muted)',
              border: '1px solid var(--color-border)',
            }}
          >
            2.0
          </span>
        </div>
      )}
    </div>
  )
}

/* ─── THEME TOGGLE ─── */
export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className="grid size-9 place-items-center rounded-md border transition-all hover:bg-[var(--color-bg-secondary)]"
      style={{
        borderColor: 'var(--color-border)',
        color: 'var(--color-ink)',
      }}
    >
      {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  )
}

/* ─── BUTTON ─── */
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'dark' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  liquid?: boolean
  children: ReactNode
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  liquid = true,
  disabled,
  children,
  onMouseMove,
  onMouseLeave,
  style,
  ...props
}: ButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    onMouseMove?.(e)
    if (!btnRef.current || disabled) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(pointer: fine)').matches) return

    const rect = btnRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    btnRef.current.style.setProperty('--liquid-x', `${x.toFixed(1)}px`)
    btnRef.current.style.setProperty('--liquid-y', `${y.toFixed(1)}px`)
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    onMouseLeave?.(e)
    if (!btnRef.current) return
    btnRef.current.style.removeProperty('--liquid-x')
    btnRef.current.style.removeProperty('--liquid-y')
  }

  const sizes = {
    sm: 'h-8 px-3.5 text-xs rounded-md',
    md: 'h-10 px-4 text-sm rounded-lg',
    lg: 'h-11 px-6 text-sm rounded-lg',
  }

  const isLiquid = liquid && (variant === 'primary' || variant === 'dark' || variant === 'secondary')

  const variantClass = isLiquid
    ? variant === 'primary'
      ? 'liquid-btn liquid-btn-primary'
      : variant === 'dark'
      ? 'liquid-btn liquid-btn-dark'
      : 'liquid-btn liquid-btn-secondary'
    : variant === 'ghost'
    ? 'hover:bg-[var(--color-bg-secondary)] text-[var(--color-ink)]'
    : variant === 'danger'
    ? 'bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20'
    : 'hover:opacity-90'

  return (
    <button
      ref={btnRef}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium tracking-[-0.01em] transition-all disabled:cursor-not-allowed disabled:opacity-40',
        sizes[size],
        variantClass,
        className
      )}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {isLiquid && (
        <>
          <span className="liquid-spotlight" aria-hidden="true" />
          <span className="liquid-sheen" aria-hidden="true" />
        </>
      )}
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
      </span>
    </button>
  )
}

export { LiquidButton, type LiquidButtonProps } from './Interactive'


/* ─── ICON BUTTON ─── */
export function IconButton({
  label,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        'grid size-9 place-items-center rounded-md border transition-all hover:bg-[var(--color-bg-secondary)]',
        className
      )}
      style={{
        borderColor: 'var(--color-border)',
        color: 'var(--color-ink)',
      }}
      {...props}
    >
      {children}
    </button>
  )
}

/* ─── AVATAR ─── */
export function Avatar({
  name,
  initials,
  tone,
  size = 'md',
  online = false,
}: {
  name: string
  initials: string
  tone?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  online?: boolean
}) {
  const sizes = {
    xs: 'size-6 text-[9px]',
    sm: 'size-8 text-[10px]',
    md: 'size-10 text-xs',
    lg: 'size-12 text-sm',
    xl: 'size-20 text-xl',
  }

  // Refined palette tones replacing generic neon gradients
  const toneMap: Record<string, string> = {
    'from-indigo-400 to-violet-500': 'bg-[#E76F35] text-white',
    'from-cyan-400 to-blue-500': 'bg-[#20211F] text-[#FAF9F6]',
    'from-rose-400 to-pink-500': 'bg-[#7A3E26] text-white',
    'from-amber-400 to-orange-500': 'bg-[#D35C24] text-white',
    'from-emerald-400 to-teal-500': 'bg-[#2C3E35] text-white',
    'from-blue-500 to-indigo-600': 'bg-[#20211F] text-[#FAF9F6]',
    'from-fuchsia-400 to-purple-500': 'bg-[#4A3B32] text-white',
    'from-sky-400 to-indigo-500': 'bg-[#373834] text-white',
    'from-orange-300 to-rose-400': 'bg-[#C25828] text-white',
  }

  const resolvedTone = (tone && toneMap[tone]) || 'bg-[#20211F] text-white'

  return (
    <div className="relative shrink-0">
      <div
        aria-label={name}
        className={cn(
          'grid place-items-center font-semibold tracking-wider font-display border',
          resolvedTone,
          sizes[size]
        )}
        style={{
          borderRadius: size === 'xs' || size === 'sm' ? '4px' : '6px',
          borderColor: 'rgba(23, 23, 23, 0.08)',
        }}
      >
        {initials}
      </div>
      {online && (
        <span
          className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2"
          style={{
            borderColor: 'var(--color-card)',
            background: 'var(--color-accent)',
          }}
        />
      )}
    </div>
  )
}

/* ─── BADGE ─── */
export function Badge({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode
  tone?: 'default' | 'accent' | 'dark' | 'green' | 'amber' | 'purple' | 'blue'
  className?: string
}) {
  const tones: Record<string, React.CSSProperties> = {
    default: {
      border: '1px solid var(--color-border)',
      color: 'var(--color-ink-secondary)',
      background: 'var(--color-bg-secondary)',
    },
    accent: {
      border: '1px solid rgba(231, 111, 53, 0.35)',
      color: 'var(--color-accent)',
      background: 'var(--color-accent-subtle)',
    },
    dark: {
      border: '1px solid rgba(255, 255, 255, 0.12)',
      color: '#FAF9F6',
      background: 'var(--color-dark-section)',
    },
    green: {
      border: '1px solid rgba(46, 125, 80, 0.3)',
      color: '#2E7D50',
      background: 'rgba(46, 125, 80, 0.08)',
    },
    amber: {
      border: '1px solid rgba(217, 119, 6, 0.3)',
      color: '#B45309',
      background: 'rgba(217, 119, 6, 0.08)',
    },
    purple: {
      border: '1px solid rgba(124, 77, 255, 0.25)',
      color: 'var(--color-accent)',
      background: 'var(--color-accent-subtle)',
    },
    blue: {
      border: '1px solid var(--color-border)',
      color: 'var(--color-ink-secondary)',
      background: 'var(--color-bg-secondary)',
    },
  }

  return (
    <span
      className={cn('inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-medium tracking-tight', className)}
      style={tones[tone] || tones.default}
    >
      {children}
    </span>
  )
}

/* ─── CARD ─── */
export function Card({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('panel rounded-xl', className)} {...props}>
      {children}
    </div>
  )
}

/* ─── SECTION TITLE ─── */
export function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string
  title: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <p className="label-sm mb-1.5" style={{ color: 'var(--color-accent)' }}>
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-2xl font-bold tracking-[-0.03em]" style={{ color: 'var(--color-ink)' }}>
          {title}
        </h2>
      </div>
      {action}
    </div>
  )
}

/* ─── SEARCH FIELD ─── */
export function SearchField({
  value,
  onChange,
  placeholder = 'Search',
  className,
  onClear,
  autoFocus = false,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  onClear?: () => void
  autoFocus?: boolean
}) {
  return (
    <div
      className={cn(
        'flex h-11 items-center gap-2.5 rounded-lg border px-3.5 transition focus-within:border-[var(--color-accent)] focus-within:ring-1 focus-within:ring-[var(--color-accent)]',
        className
      )}
      style={{
        borderColor: 'var(--color-border)',
        background: 'var(--color-card)',
        color: 'var(--color-ink-muted)',
      }}
    >
      <Search className="size-4 shrink-0" />
      <input
        autoFocus={autoFocus}
        aria-label={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-ink-muted)]"
        style={{ color: 'var(--color-ink)' }}
      />
      {value && (
        <button aria-label="Clear search" onClick={onClear ?? (() => onChange(''))}>
          <X className="size-3.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]" />
        </button>
      )}
    </div>
  )
}

/* ─── TOGGLE ─── */
export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
          {label}
        </p>
        {description && (
          <p className="mt-1 text-xs leading-5" style={{ color: 'var(--color-ink-muted)' }}>
            {description}
          </p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
        style={{ background: checked ? 'var(--color-accent)' : 'var(--color-border)' }}
      >
        <span
          className={cn(
            'absolute top-1 size-4 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  )
}

/* ─── EMPTY STATE ─── */
export function EmptyState({
  title,
  detail,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  detail?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}) {
  const text = detail ?? description ?? ''
  return (
    <div
      className="rounded-lg border border-dashed px-6 py-14 text-center"
      style={{
        borderColor: 'var(--color-border)',
        background: 'var(--color-bg-secondary)',
      }}
    >
      <p className="font-display font-semibold" style={{ color: 'var(--color-ink)' }}>
        {title}
      </p>
      {text && (
        <p className="mt-2 text-sm max-w-md mx-auto" style={{ color: 'var(--color-ink-muted)' }}>
          {text}
        </p>
      )}
      {actionLabel && onAction && (
        <div className="mt-4 flex justify-center">
          <Button size="sm" variant="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
