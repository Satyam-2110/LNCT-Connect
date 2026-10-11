# Phase 7 Plan: Visual & Interaction Refinements

**Milestone**: LNCT Connect 2.0 — Visual Interaction Polish  
**Status**: Completed & Verified  
**Dependencies**: Completed Phases 0–6  
**Scope**: 
1. Apple-Inspired Liquid Button Architecture (Sub-phase 7.1)
2. Cinematic Depth-Orchestrated 3D Campus Constellation (Sub-phase 7.2)

---

## Sub-phase 7.1: Apple-Inspired Liquid Button Effect

### 1. Objective & Scope
Implement a reusable, highly polished liquid-glass button interaction across all primary actions in LNCT Connect:
- Hero CTA (`Join LNCT Connect`)
- Navbar actions (`Join Network`, `Log in`)
- Auth actions (`Sign in`, `Create profile`, `Continue with Google`)
- Section & Interior CTAs (`Browse all projects`, `Book session`, `Create project`, `Explore community`)

### 2. Design Specification
- **Color System**: Strictly adhere to LNCT Connect 2.0 tokens:
  - Burnt Orange Primary: `#E76F35` with liquid specular highlight (`rgba(255, 255, 255, 0.35)`) and deep ambient refraction (`rgba(231, 111, 53, 0.4)`).
  - Charcoal Dark Primary: `#20211F` with subtle metallic glass highlight (`rgba(255, 255, 255, 0.15)`) and crisp border rim.
  - Light Glass Secondary: `#FAF9F6` with 1px `#E7E5E0` border and soft refractive lens highlight.
- **Surface Layering**:
  1. Base surface with subtle linear depth gradient.
  2. Dynamic specular sheen tracking cursor coordinates (`--liquid-x`, `--liquid-y`) via radial gradient.
  3. Curvature border reflection: 1px inner bevel glow simulating curved physical glass.
  4. Interactive feedback: tactile spring press (`scale(0.97)`), smooth release.
- **Accessibility & Compatibility**:
  - Full keyboard focus ring (`:focus-visible` with 2px offset).
  - Native `<button>` semantics, preserving `type="submit"`, `disabled`, and click handling.
  - Touch device safety: disables cursor hover tracking on touch, triggers tactile press only.
  - `prefers-reduced-motion`: disables spring transforms and specular animation.

### 3. Acceptance Criteria
- [x] AC-7.1.1: Reusable `LiquidButton` (and enhanced `Button` / `MagneticButton`) component created without duplicating styles across views.
- [x] AC-7.1.2: Liquid specular highlight dynamically tracks mouse position on hover across primary buttons.
- [x] AC-7.1.3: Tactile press physics applied on active click without disrupting button click handlers or route navigation.
- [x] AC-7.1.4: Form submissions on Login and Signup pages work seamlessly with liquid submit buttons.
- [x] AC-7.1.5: Keyboard navigation (Tab + Enter/Space) displays visible focus rings and activates actions correctly.
- [x] AC-7.1.6: Touch interactions on mobile devices provide tactile feedback without broken hover artifacts.
- [x] AC-7.1.7: Zero neon glow or out-of-palette blue/purple artifacts. Exceeds WCAG AA contrast standards.

---

## Sub-phase 7.2: Cinematic Depth-Orchestrated 3D Campus Constellation

### 1. Objective & Scope
Refine the Three.js / React Three Fiber campus network into a cinematic, fluid, depth-driven experience during natural scrolling. Orchestrate the narrative sequence:
$$\text{Students} \longleftrightarrow \text{Skills} \longleftrightarrow \text{Projects} \longleftrightarrow \text{Alumni} \longleftrightarrow \text{Opportunities}$$

### 2. Technical Specification
- **3D Node & Stage Coordination (`NetworkScene.tsx`)**:
  - Incorporated Skills (Category 4) in the sequence: `Students ↔ Skills ↔ Projects ↔ Opportunities ↔ Alumni & Mentors`.
  - Smooth stage weighting calculation using continuous Hermite polynomial smoothstep curves for all 5 narrative phases.
  - Coordinated node cluster expansions along $(X, Y, Z)$ so nodes advance toward the camera plane during their respective story moments and recede into depth as the next stage arrives.
- **Camera Choreography (`CameraController`)**:
  - 6 cinematic waypoints guiding natural forward depth navigation ($Z$ camera travel: $7.4 \to 5.4 \to 4.8 \to 4.5 \to 4.9 \to 6.8$) rather than abrupt lateral shifts.
  - Smooth exponential damping (`1 - Math.exp(-k * dt)`) on camera position and lookAt target.
  - Calmed mouse parallax so camera movement remains gentle and stable.
- **Card-to-Node Depth Synchronization (`LandingPage.tsx` & `SpatialCard`)**:
  - Reduced section backdrop opacity to 50%–55% with subtle blur, creating open spatial corridors so the 3D constellation remains visible as a continuous depth layer behind DOM elements.
  - Synchronized DOM cards via `SpatialCard`: student cards recede into depth (-55px, scale 0.95) as user transitions to Projects, project cards take focal prominence and recede as user leads into Opportunities and Mentorship.
- **Performance & Constraints**:
  - Zero scroll hijacking: native scroll behavior remains 100% intact.
  - 60fps/120fps smooth scrolling with zero React re-render churn during scroll frames.
  - Full `prefers-reduced-motion` compliance.
  - Mobile optimizations: simplified DPR, reduced node counts, disabled heavy mouse tracking.

### 3. Acceptance Criteria
- [x] AC-7.2.1: 3D scene smoothly traverses depth across the full narrative sequence: Students ↔ Skills ↔ Projects ↔ Alumni ↔ Opportunities.
- [x] AC-7.2.2: Camera movement is fluid with zero abrupt jumps, zero camera popping, and zero scroll hijacking.
- [x] AC-7.2.3: Skills (category 4) nodes are fully integrated into stage morphing and scale transitions alongside other categories.
- [x] AC-7.2.4: Landing page sections allow the 3D network to be perceived as an interconnected depth backdrop rather than isolated disconnected glimpses.
- [x] AC-7.2.5: Student profile cards visually recede into depth as project cards emerge, leading smoothly into opportunities and mentorship.
- [x] AC-7.2.6: Normal browser scrolling remains completely unaltered and responsive.
- [x] AC-7.2.7: Production build compiles cleanly with zero TypeScript errors (1.85s, 0 errors).
