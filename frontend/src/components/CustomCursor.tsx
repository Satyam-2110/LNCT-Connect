import { useEffect, useRef, useState } from 'react'

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [clicking, setClicking] = useState(false)
  const [visible, setVisible] = useState(false)

  const mouse = useRef({ x: -100, y: -100 })
  const ringPos = useRef({ x: -100, y: -100 })
  const rafRef = useRef<number>(0)
  const hoveringRef = useRef(false)
  const clickingRef = useRef(false)

  useEffect(() => {
    // Only enable on devices with a fine pointer (mouse / precision trackpad)
    // and when user does NOT prefer reduced motion
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!hasFinePointer || prefersReduced) {
      setEnabled(false)
      return
    }

    setEnabled(true)

    // Hide default cursor via dedicated stylesheet to avoid inline style collisions
    const style = document.createElement('style')
    style.id = 'lnct-cursor-override'
    style.textContent = `
      @media (pointer: fine) and (prefers-reduced-motion: no-preference) {
        body, a, button, input, textarea, select, [role="button"], .tilt-card, .interactive {
          cursor: none !important;
        }
      }
    `
    document.head.appendChild(style)

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY }
      if (!visible) setVisible(true)

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX - 4}px, ${e.clientY - 4}px, 0)`
      }
    }

    const handleMouseDown = () => {
      setClicking(true)
      clickingRef.current = true
    }

    const handleMouseUp = () => {
      setClicking(false)
      clickingRef.current = false
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return

      const isInteractive = Boolean(
        target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('select') ||
        target.closest('[role="button"]') ||
        target.closest('.tilt-card') ||
        target.closest('.panel') ||
        target.closest('[data-interactive]')
      )

      if (isInteractive !== hoveringRef.current) {
        hoveringRef.current = isInteractive
        setHovering(isInteractive)
      }
    }

    const handleMouseLeave = () => setVisible(false)
    const handleMouseEnter = () => setVisible(true)

    // Smooth spring physics for trailing outer ring
    const render = () => {
      const lerp = 0.18
      const dx = mouse.current.x - ringPos.current.x
      const dy = mouse.current.y - ringPos.current.y

      ringPos.current.x += dx * lerp
      ringPos.current.y += dy * lerp

      if (ringRef.current) {
        const size = hoveringRef.current ? 48 : 32
        ringRef.current.style.transform = `translate3d(${ringPos.current.x - size / 2}px, ${
          ringPos.current.y - size / 2
        }px, 0)`
      }

      rafRef.current = requestAnimationFrame(render)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mouseover', handleMouseOver, { passive: true })
    document.documentElement.addEventListener('mouseleave', handleMouseLeave)
    document.documentElement.addEventListener('mouseenter', handleMouseEnter)

    rafRef.current = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mouseover', handleMouseOver)
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave)
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter)
      cancelAnimationFrame(rafRef.current)
      style.remove()
    }
  }, [visible])

  if (!enabled) return null

  return (
    <>
      {/* Precision inner center dot */}
      <div
        ref={dotRef}
        className="cursor-dot pointer-events-none fixed top-0 left-0 z-[10001] rounded-full transition-opacity duration-150"
        style={{
          width: clicking ? 5 : 8,
          height: clicking ? 5 : 8,
          background: 'var(--color-ink)',
          opacity: visible ? 1 : 0,
        }}
      />

      {/* Smooth trailing ring with burnt-orange expansion on hover */}
      <div
        ref={ringRef}
        className="cursor-ring pointer-events-none fixed top-0 left-0 z-[10000] rounded-full transition-[width,height,border-color,background-color] duration-200 ease-out"
        style={{
          width: hovering ? 48 : 32,
          height: hovering ? 48 : 32,
          borderColor: hovering ? 'var(--color-accent)' : 'rgba(23, 23, 23, 0.28)',
          backgroundColor: hovering ? 'var(--color-accent-subtle)' : 'transparent',
          borderWidth: 1.5,
          borderStyle: 'solid',
          opacity: visible ? 1 : 0,
        }}
      />
    </>
  )
}
