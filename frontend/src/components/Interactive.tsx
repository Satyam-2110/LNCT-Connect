import { useRef, type HTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { cn } from '../lib/utils'

/* ─── 3D PERSPECTIVE TILT CARD ─── */
export function TiltCard({
  children,
  className,
  maxTilt = 5,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; maxTilt?: number }) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(pointer: fine)').matches) return

    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5

    const rotateX = -y * maxTilt
    const rotateY = x * maxTilt

    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(
      2
    )}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(4px)`
  }

  const handleMouseLeave = () => {
    if (!cardRef.current) return
    cardRef.current.style.transform =
      'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
  }

  return (
    <div
      ref={cardRef}
      className={cn('tilt-card will-change-transform transition-transform duration-300 ease-out', className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  )
}

/* ─── APPLE-INSPIRED LIQUID GLASS BUTTON ─── */
export interface LiquidButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'dark' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  magnetic?: boolean
  magneticStrength?: number
  children: ReactNode
}

export function LiquidButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  magnetic = false,
  magneticStrength = 10,
  disabled,
  type = 'button',
  onMouseMove,
  onMouseLeave,
  style,
  ...props
}: LiquidButtonProps) {
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

    if (magnetic) {
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const deltaX = (e.clientX - centerX) / (rect.width / 2)
      const deltaY = (e.clientY - centerY) / (rect.height / 2)
      const moveX = deltaX * magneticStrength
      const moveY = deltaY * magneticStrength
      btnRef.current.style.transform = `translate3d(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px, 0)`
    }
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    onMouseLeave?.(e)
    if (!btnRef.current) return
    btnRef.current.style.removeProperty('--liquid-x')
    btnRef.current.style.removeProperty('--liquid-y')
    if (magnetic) {
      btnRef.current.style.transform = 'translate3d(0px, 0px, 0)'
    }
  }

  const sizeClasses = {
    sm: 'h-8 px-3.5 text-xs rounded-md',
    md: 'h-10 px-4 text-sm rounded-lg',
    lg: 'h-11 px-6 text-sm rounded-lg',
  }

  const variantClass =
    variant === 'primary'
      ? 'liquid-btn-primary'
      : variant === 'dark'
      ? 'liquid-btn-dark'
      : variant === 'secondary'
      ? 'liquid-btn-secondary'
      : 'hover:bg-[var(--color-bg-secondary)] text-[var(--color-ink)]'

  return (
    <button
      ref={btnRef}
      type={type}
      disabled={disabled}
      className={cn(
        'liquid-btn',
        sizeClasses[size],
        variantClass,
        disabled && 'opacity-40 cursor-not-allowed',
        className
      )}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {variant !== 'ghost' && (
        <>
          <span className="liquid-spotlight" aria-hidden="true" />
          <span className="liquid-sheen" aria-hidden="true" />
        </>
      )}
      <span className="relative z-10 inline-flex items-center gap-2 font-medium tracking-[-0.01em]">
        {children}
      </span>
    </button>
  )
}

/* ─── MAGNETIC BUTTON ─── */
export function MagneticButton({
  children,
  className,
  strength = 12,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; strength?: number }) {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(pointer: fine)').matches) return

    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const deltaX = (e.clientX - centerX) / (rect.width / 2)
    const deltaY = (e.clientY - centerY) / (rect.height / 2)

    const moveX = deltaX * strength
    const moveY = deltaY * strength

    containerRef.current.style.transform = `translate3d(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px, 0)`
  }

  const handleMouseLeave = () => {
    if (!containerRef.current) return
    containerRef.current.style.transform = 'translate3d(0px, 0px, 0)'
  }

  return (
    <div
      ref={containerRef}
      className={cn('magnetic-wrap inline-block will-change-transform transition-transform duration-200 ease-out', className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  )
}

/* ─── 3D SPATIAL CARD REVEAL & SCROLL-DRIVEN DEPTH RECEDING ─── */
export function SpatialCard({
  children,
  className,
  delay = 0,
  direction = 'up',
  maxTilt = 5,
  recedeOnScroll = true,
}: {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  maxTilt?: number
  recedeOnScroll?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: false, amount: 0.15, margin: '-20px' })

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  // Dynamic scroll-driven depth transformation
  // As card scrolls past, it smoothly recedes into depth (-55px) and scales down (0.95),
  // creating the natural visual sequence where active cards shine and preceding cards yield to the next chapter.
  const scrollZ = useTransform(scrollYProgress, [0, 0.28, 0.65, 1], [-60, 0, 0, -55])
  const scrollScale = useTransform(scrollYProgress, [0, 0.28, 0.65, 1], [0.94, 1, 1, 0.95])
  const scrollOpacity = useTransform(scrollYProgress, [0, 0.18, 0.72, 1], [0.4, 1, 1, 0.7])

  const initialRotateX = direction === 'up' ? 10 : direction === 'down' ? -10 : 0
  const initialRotateY = direction === 'left' ? -8 : direction === 'right' ? 8 : 0
  const initialY = direction === 'up' ? 36 : direction === 'down' ? -36 : 0
  const initialX = direction === 'left' ? -30 : direction === 'right' ? 30 : 0

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        x: initialX,
        y: initialY,
        rotateX: initialRotateX,
        rotateY: initialRotateY,
      }}
      animate={
        isInView
          ? {
              opacity: 1,
              x: 0,
              y: 0,
              rotateX: 0,
              rotateY: 0,
            }
          : {
              opacity: 0.2,
              x: initialX * 0.35,
              y: initialY * 0.35,
              rotateX: initialRotateX * 0.5,
              rotateY: initialRotateY * 0.5,
            }
      }
      transition={{
        duration: 0.7,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{
        transformPerspective: 1200,
        transformStyle: 'preserve-3d',
        ...(recedeOnScroll ? { z: scrollZ, scale: scrollScale, opacity: scrollOpacity } : {}),
      }}
      className={cn('will-change-transform h-full', className)}
    >
      <TiltCard maxTilt={maxTilt} className="h-full">
        {children}
      </TiltCard>
    </motion.div>
  )
}
