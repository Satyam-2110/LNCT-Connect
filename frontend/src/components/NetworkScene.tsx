import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

// ─── NETWORK NODE CATEGORIES (LNCT CONNECT 2.0 PALETTE) ───
export const NODE_CATEGORIES = [
  { label: 'Students', color: '#E76F35', count: 14, stageIndex: 1 },
  { label: 'Alumni', color: '#20211F', count: 8, stageIndex: 4 },
  { label: 'Mentors', color: '#C25828', count: 8, stageIndex: 4 },
  { label: 'Projects', color: '#4A3B32', count: 10, stageIndex: 2 },
  { label: 'Skills', color: '#737068', count: 12, stageIndex: 3 },
  { label: 'Opportunities', color: '#D97706', count: 8, stageIndex: 3 },
] as const

type NodeData = {
  id: number
  category: number
  basePos: THREE.Vector3
  currentPos: THREE.Vector3
  size: number
  speed: number
  phase: number
  featuredLabel?: string
}

const FEATURED_NODES: Record<number, string> = {
  0: 'Student: Aanya M.',
  14: 'Alumni: Rahul S.',
  22: 'Mentor: Ishita G.',
  30: 'Project: Event Hub',
  40: 'Skill: System Design',
  52: 'Opportunity: HackVerse',
}

function generateNodes(): NodeData[] {
  const nodes: NodeData[] = []
  let globalIndex = 0

  NODE_CATEGORIES.forEach((cat, catIdx) => {
    for (let i = 0; i < cat.count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 2.0 + Math.random() * 2.6

      const pos = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta) * 0.85,
        r * Math.cos(phi)
      )

      nodes.push({
        id: globalIndex,
        category: catIdx,
        basePos: pos.clone(),
        currentPos: pos.clone(),
        size: catIdx === 0 || catIdx === 2 ? 0.05 + Math.random() * 0.05 : 0.035 + Math.random() * 0.04,
        speed: 0.2 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
        featuredLabel: FEATURED_NODES[globalIndex],
      })

      globalIndex++
    }
  })

  return nodes
}

function generateConnections(nodes: NodeData[]): [number, number][] {
  const connections: [number, number][] = []
  const maxDistance = 2.6
  const maxConnections = 75

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dist = nodes[i].basePos.distanceTo(nodes[j].basePos)
      if (dist < maxDistance && connections.length < maxConnections) {
        connections.push([i, j])
      }
    }
  }
  return connections
}

// ─── 6-WAYPOINT SMOOTHSTEP CINEMATIC CAMERA INTERPOLATION ───
// Sequence: Hero Overview -> Students -> Skills Bridge -> Projects Core -> Opportunities Ascent -> Alumni & Mentors Horizon
function getCameraWaypoint(p: number) {
  const waypoints = [
    { p: 0.00, x: 0.00,  y: 0.00,  z: 7.4, lx: 0.00,  ly: 0.00 }, // Hero Overview
    { p: 0.24, x: -0.75, y: 0.20,  z: 5.4, lx: 0.35,  ly: 0.05 }, // Students Section
    { p: 0.38, x: -0.25, y: 0.10,  z: 4.8, lx: 0.15,  ly: 0.02 }, // Skills Bridge
    { p: 0.54, x: 0.65,  y: -0.15, z: 4.5, lx: -0.30, ly: -0.05 }, // Projects Core
    { p: 0.74, x: -0.40, y: 0.40,  z: 4.9, lx: 0.20,  ly: 0.10 }, // Opportunities Ascent
    { p: 0.95, x: 0.00,  y: 0.25,  z: 6.8, lx: 0.00,  ly: 0.00 }, // Alumni & Mentorship Horizon
  ]

  const clampedP = Math.max(0, Math.min(1, p))
  if (clampedP <= waypoints[0].p) return waypoints[0]
  if (clampedP >= waypoints[waypoints.length - 1].p) return waypoints[waypoints.length - 1]

  for (let i = 0; i < waypoints.length - 1; i++) {
    const w1 = waypoints[i]
    const w2 = waypoints[i + 1]
    if (clampedP >= w1.p && clampedP <= w2.p) {
      const linearT = (clampedP - w1.p) / (w2.p - w1.p)
      // Smoothstep Hermite polynomial easing
      const t = linearT * linearT * (3 - 2 * linearT)
      return {
        p: clampedP,
        x: THREE.MathUtils.lerp(w1.x, w2.x, t),
        y: THREE.MathUtils.lerp(w1.y, w2.y, t),
        z: THREE.MathUtils.lerp(w1.z, w2.z, t),
        lx: THREE.MathUtils.lerp(w1.lx, w2.lx, t),
        ly: THREE.MathUtils.lerp(w1.ly, w2.ly, t),
      }
    }
  }
  return waypoints[0]
}

// ─── SCROLL-DRIVEN CAMERA CONTROLLER ───
function CameraController({
  scrollProgress,
  smoothMouse,
  reducedMotion,
}: {
  scrollProgress: number
  smoothMouse: { x: number; y: number }
  reducedMotion: boolean
}) {
  const { camera } = useThree()
  const lookAtRef = useRef(new THREE.Vector3(0, 0, 0))

  useFrame((_, delta) => {
    const wp = getCameraWaypoint(scrollProgress)
    const dt = Math.min(delta, 0.05)
    const damp = 1 - Math.exp(-5.0 * dt)

    // Blend gently smoothed mouse coordinate parallax into camera target
    const parallaxX = reducedMotion ? 0 : smoothMouse.x * 0.22
    const parallaxY = reducedMotion ? 0 : smoothMouse.y * 0.14
    const targetX = wp.x + parallaxX
    const targetY = wp.y + parallaxY
    const targetZ = wp.z

    camera.position.x += (targetX - camera.position.x) * damp
    camera.position.y += (targetY - camera.position.y) * damp
    camera.position.z += (targetZ - camera.position.z) * damp

    // Smoothly orient camera without snapping
    lookAtRef.current.x += (wp.lx - lookAtRef.current.x) * damp
    lookAtRef.current.y += (wp.ly - lookAtRef.current.y) * damp
    camera.lookAt(lookAtRef.current.x, lookAtRef.current.y, 0)
  })

  return null
}

// ─── INSTANCED NODES WITH SCROLL MORPHING ───
function NetworkNodes({
  nodes,
  scrollProgress,
  hoveredIndex,
  onHover,
  reducedMotion,
}: {
  nodes: NodeData[]
  scrollProgress: number
  hoveredIndex: number | null
  onHover: (id: number | null) => void
  reducedMotion: boolean
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const targetPos = useMemo(() => new THREE.Vector3(), [])
  const scaleRef = useRef<Float32Array>(new Float32Array(nodes.length).fill(13))
  const colorLerpRef = useMemo(() => new THREE.Color(), [])

  useFrame(({ clock }, delta) => {
    if (!meshRef.current) return
    const dt = Math.min(delta, 0.05)
    const t = clock.getElapsedTime()
    const p = scrollProgress

    // Continuous narrative stage weights across the full sequence:
    // Students ↔ Skills ↔ Projects ↔ Opportunities ↔ Alumni/Mentors
    const studentStage = Math.max(0, 1 - Math.abs(p - 0.24) / 0.18)
    const skillsStage = Math.max(0, 1 - Math.abs(p - 0.38) / 0.18)
    const projectStage = Math.max(0, 1 - Math.abs(p - 0.54) / 0.18)
    const oppStage = Math.max(0, 1 - Math.abs(p - 0.74) / 0.18)
    const mentorStage = Math.max(0, 1 - Math.abs(p - 0.92) / 0.18)

    const posLerp = 1 - Math.exp(-5.5 * dt)
    const scaleLerp = 1 - Math.exp(-7.5 * dt)

    nodes.forEach((node, i) => {
      // Calm, organic floating sine wave without rapid oscillation
      const float = reducedMotion ? 0 : Math.sin(t * (node.speed * 0.45) + node.phase) * 0.038

      // Compute scroll-driven target offsets per category
      let offsetX = 0
      let offsetY = float
      let offsetZ = 0

      if (node.category === 0) {
        // Students: push forward into camera plane, recede as projects enter
        offsetX += studentStage * 0.85
        offsetZ += studentStage * 1.55 - projectStage * 0.85
      } else if (node.category === 4) {
        // Skills: dynamic bridge between students and projects
        offsetX += (skillsStage - projectStage) * 0.45
        offsetY += skillsStage * 0.65
        offsetZ += skillsStage * 1.4
      } else if (node.category === 3) {
        // Projects: advance into focal center, recede as opportunities take over
        offsetX -= projectStage * 1.15
        offsetZ += projectStage * 1.65 - oppStage * 0.75
      } else if (node.category === 5) {
        // Opportunities: elevate forward and upward
        offsetY += oppStage * 1.25
        offsetZ += oppStage * 1.5
      } else if (node.category === 1 || node.category === 2) {
        // Alumni & Mentors: bridge forward in the mentorship horizon
        offsetZ += mentorStage * 1.65
      }

      targetPos.set(
        node.basePos.x + offsetX,
        node.basePos.y + offsetY,
        node.basePos.z + offsetZ
      )

      // Smooth damped position update eliminates scroll jump
      node.currentPos.lerp(targetPos, posLerp)

      dummy.position.copy(node.currentPos)

      const isHovered = hoveredIndex === i

      // Continuous smooth stage scaling multiplier
      let stageWeight = 0
      if (node.category === 0) stageWeight = studentStage
      else if (node.category === 4) stageWeight = skillsStage
      else if (node.category === 3) stageWeight = projectStage
      else if (node.category === 5) stageWeight = oppStage
      else if (node.category === 1 || node.category === 2) stageWeight = mentorStage

      const smoothStage = stageWeight * stageWeight * (3 - 2 * stageWeight)
      const targetScaleMult = (isHovered ? 20 : 13) * (1 + smoothStage * 0.38)

      // Smooth scale interpolation prevents popping
      scaleRef.current[i] += (targetScaleMult - scaleRef.current[i]) * scaleLerp
      dummy.scale.setScalar(node.size * scaleRef.current[i])
      dummy.updateMatrix()

      meshRef.current!.setMatrixAt(i, dummy.matrix)

      // Color mapping with dynamic luminous tint for active stage
      const catColor = NODE_CATEGORIES[node.category].color
      if (isHovered) {
        colorLerpRef.set('#FFFFFF')
      } else if (smoothStage > 0.25) {
        colorLerpRef.set(catColor).lerp(new THREE.Color('#FFFFFF'), smoothStage * 0.22)
      } else {
        colorLerpRef.set(catColor)
      }
      meshRef.current!.setColorAt(i, colorLerpRef)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, nodes.length]}
      onPointerOver={(e) => {
        e.stopPropagation()
        if (e.instanceId !== undefined) {
          onHover(e.instanceId)
        }
      }}
      onPointerOut={() => onHover(null)}
    >
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial
        roughness={0.35}
        metalness={0.25}
        emissive="#FAF9F6"
        emissiveIntensity={0.22}
      />
    </instancedMesh>
  )
}

// ─── DYNAMIC CONNECTION LINES (TRANSFORM WITH NODES) ───
function DynamicConnectionLines({
  nodes,
  connections,
}: {
  nodes: NodeData[]
  connections: [number, number][]
}) {
  const lineRef = useRef<THREE.LineSegments>(null)
  const positions = useMemo(() => new Float32Array(connections.length * 6), [connections])

  useFrame(() => {
    if (!lineRef.current) return
    const geo = lineRef.current.geometry
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute

    connections.forEach(([i, j], idx) => {
      const nodeA = nodes[i]
      const nodeB = nodes[j]

      posAttr.setXYZ(idx * 2, nodeA.currentPos.x, nodeA.currentPos.y, nodeA.currentPos.z)
      posAttr.setXYZ(idx * 2 + 1, nodeB.currentPos.x, nodeB.currentPos.y, nodeB.currentPos.z)
    })

    posAttr.needsUpdate = true
  })

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        color="#E76F35"
        transparent
        opacity={0.14}
        linewidth={1}
      />
    </lineSegments>
  )
}

// ─── FEATURED LABELS ───
function DynamicFeaturedLabel({
  node,
  scrollProgress,
  isHovered,
}: {
  node: NodeData
  scrollProgress: number
  isHovered: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(node.currentPos)
    }
  })

  // Contextual relevance based on narrative sequence
  const p = scrollProgress
  const isRelevant =
    (node.category === 0 && Math.abs(p - 0.24) < 0.16) ||
    (node.category === 4 && Math.abs(p - 0.38) < 0.16) ||
    (node.category === 3 && Math.abs(p - 0.54) < 0.16) ||
    (node.category === 5 && Math.abs(p - 0.74) < 0.16) ||
    ((node.category === 1 || node.category === 2) && Math.abs(p - 0.92) < 0.16) ||
    p < 0.12 // Hero overview

  return (
    <group ref={groupRef} position={[node.basePos.x, node.basePos.y, node.basePos.z]}>
      <Html
        center
        distanceFactor={10}
        className="pointer-events-none select-none"
        style={{
          opacity: isHovered ? 1 : isRelevant ? 0.95 : 0.25,
          transform: isHovered ? 'scale(1.15)' : isRelevant ? 'scale(1.05)' : 'scale(0.92)',
          transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        <div
          className="rounded px-2.5 py-1 text-[9px] font-bold tracking-tight whitespace-nowrap shadow-sm transition-all duration-300"
          style={{
            background: isHovered ? '#171717' : isRelevant ? '#FAF9F6' : 'rgba(250, 249, 246, 0.85)',
            color: isHovered ? '#FAF9F6' : '#171717',
            border: isHovered || isRelevant ? '1px solid #E76F35' : '1px solid #E7E5E0',
            boxShadow: isHovered || isRelevant
              ? '0 4px 14px rgba(231, 111, 53, 0.28)'
              : '0 2px 8px rgba(23, 23, 23, 0.08)',
          }}
        >
          <span
            className="mr-1.5 inline-block size-1.5 rounded-full"
            style={{
              background: NODE_CATEGORIES[node.category].color,
            }}
          />
          {node.featuredLabel}
        </div>
      </Html>
    </group>
  )
}

function DynamicFeaturedLabels({
  nodes,
  scrollProgress,
  hoveredIndex,
}: {
  nodes: NodeData[]
  scrollProgress: number
  hoveredIndex: number | null
}) {
  const featured = useMemo(() => nodes.filter((n) => Boolean(n.featuredLabel)), [nodes])

  return (
    <>
      {featured.map((node) => (
        <DynamicFeaturedLabel
          key={node.id}
          node={node}
          scrollProgress={scrollProgress}
          isHovered={hoveredIndex === node.id}
        />
      ))}
    </>
  )
}

// ─── PARTICLES FIELD ───
function BackgroundParticles({ count = 60 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 16
      arr[i * 3 + 1] = (Math.random() - 0.5) * 16
      arr[i * 3 + 2] = (Math.random() - 0.5) * 16
    }
    return arr
  }, [count])

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.getElapsedTime() * 0.012
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.022}
        color="#E76F35"
        transparent
        opacity={0.22}
        sizeAttenuation
      />
    </points>
  )
}

// ─── MAIN 3D SCENE ───
function Scene({
  targetScrollRef,
  mouseTargetRef,
  reducedMotion,
}: {
  targetScrollRef: React.MutableRefObject<number>
  mouseTargetRef: React.MutableRefObject<{ x: number; y: number }>
  reducedMotion: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const currentScrollRef = useRef(0)
  const smoothMouseRef = useRef({ x: 0, y: 0 })
  const [activeScrollP, setActiveScrollP] = useState(0)

  const nodes = useMemo(() => generateNodes(), [])
  const connections = useMemo(() => generateConnections(nodes), [nodes])
  const projected = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock, camera }, delta) => {
    // Delta-based exponential smoothing for scroll interpolation
    const dt = Math.min(delta, 0.05)
    const scrollDamp = 1 - Math.exp(-6.0 * dt)
    currentScrollRef.current += (targetScrollRef.current - currentScrollRef.current) * scrollDamp
    const p = currentScrollRef.current

    // Smooth cursor coordinate interpolation (continuous damped tracking, zero re-render overhead)
    const mouseDamp = 1 - Math.exp(-6.5 * dt)
    smoothMouseRef.current.x += (mouseTargetRef.current.x - smoothMouseRef.current.x) * mouseDamp
    smoothMouseRef.current.y += (mouseTargetRef.current.y - smoothMouseRef.current.y) * mouseDamp

    if (groupRef.current) {
      const rotationSpeed = reducedMotion ? 0 : 0.014
      groupRef.current.rotation.y =
        (reducedMotion ? 0 : clock.getElapsedTime() * rotationSpeed) + p * 0.22
      groupRef.current.rotation.x =
        (reducedMotion ? 0 : Math.sin(clock.getElapsedTime() * 0.012) * 0.02) + p * 0.06
    }

    // Screen-space proximity hover detection with hysteresis to eliminate flicker
    let closestId: number | null = null
    let minDist = 0.075

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]
      projected.copy(n.currentPos).project(camera)
      if (projected.z < 1 && projected.z > -1) {
        const dx = projected.x - smoothMouseRef.current.x
        const dy = projected.y - smoothMouseRef.current.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        // Hysteresis: retain current hovered node unless candidate is distinctly closer
        const effectiveDist = n.id === hoveredIndex ? dist * 0.8 : dist
        if (effectiveDist < minDist) {
          minDist = effectiveDist
          closestId = n.id
        }
      }
    }

    if (closestId !== hoveredIndex) {
      setHoveredIndex(closestId)
    }

    // Update activeScrollP for label fade checks only on notable scroll movement
    if (Math.abs(p - activeScrollP) > 0.06) {
      setActiveScrollP(p)
    }
  })

  return (
    <>
      <CameraController
        scrollProgress={currentScrollRef.current}
        smoothMouse={smoothMouseRef.current}
        reducedMotion={reducedMotion}
      />

      <ambientLight intensity={0.65} color="#FAF9F6" />
      <pointLight position={[6, 6, 6]} intensity={1.2} color="#E76F35" />
      <pointLight position={[-6, -4, 4]} intensity={0.5} color="#F0EEE8" />

      <group ref={groupRef}>
        <NetworkNodes
          nodes={nodes}
          scrollProgress={currentScrollRef.current}
          hoveredIndex={hoveredIndex}
          onHover={setHoveredIndex}
          reducedMotion={reducedMotion}
        />
        <DynamicConnectionLines
          nodes={nodes}
          connections={connections}
        />
        <DynamicFeaturedLabels
          nodes={nodes}
          scrollProgress={activeScrollP}
          hoveredIndex={hoveredIndex}
        />
        <BackgroundParticles count={50} />
      </group>
    </>
  )
}

// ─── EXPORTED NETWORK CANVAS ───
export function NetworkCanvas({
  scrollProgress: externalScrollProgress,
  className,
  style,
}: {
  scrollProgress?: number
  className?: string
  style?: React.CSSProperties
}) {
  const targetScrollRef = useRef(0)
  const mouseTargetRef = useRef({ x: 0, y: 0 })
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setReducedMotion(prefersReduced)

    const handleScroll = () => {
      if (externalScrollProgress === undefined) {
        const total = document.documentElement.scrollHeight - window.innerHeight
        targetScrollRef.current = total > 0 ? Math.min(Math.max(window.scrollY / total, 0), 1) : 0
      }
    }

    const handleMouse = (e: MouseEvent) => {
      mouseTargetRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouseTargetRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('mousemove', handleMouse, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouse)
    }
  }, [externalScrollProgress])

  if (externalScrollProgress !== undefined) {
    targetScrollRef.current = externalScrollProgress
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const dpr: [number, number] = isMobile ? [1, 1] : [1, 1.5]

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        opacity: 0.95,
        ...style,
      }}
    >
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 0, 7.2], fov: 46 }}
        gl={{
          antialias: !isMobile,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        <Scene
          targetScrollRef={targetScrollRef}
          mouseTargetRef={mouseTargetRef}
          reducedMotion={reducedMotion}
        />
      </Canvas>
    </div>
  )
}

