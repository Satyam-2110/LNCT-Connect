# Requirements & Acceptance Criteria — LNCT Connect 2.0

## Phase 0: Codebase Audit & Tooling Verification
- [x] **REQ-0.1 (Architecture & Dependencies Audit)**: Verify `package.json`, React 18, Vite 8, TypeScript 5, Tailwind CSS v4 (`@tailwindcss/vite`), Three.js/R3F, Framer Motion, GSAP, and Lucide React.
- [x] **REQ-0.2 (Build Verification)**: Confirm clean TypeScript compilation (`tsc -b`) and Vite production bundling (`vite build`) without runtime errors or blocking warnings.
- [x] **REQ-0.3 (Route Audit)**: Map and document existing routes (`/`, `/login`, `/signup`, `/home`, `/people`, `/profile/:id`, `/projects`, `/opportunities`, `/mentorship`, `/messages`, `/settings`).

## Phase 1: Theme & Shared UI Redesign (Completed)
- [x] **REQ-1.1 (Color System Implementation)**: Implement CSS variables in `src/index.css`:
  - `--color-bg: #FAF9F6`
  - `--color-bg-secondary: #F0EEE8`
  - `--color-ink: #171717`
  - `--color-accent: #E76F35`
  - `--color-card: #FFFFFF`
  - `--color-border: #E7E5E0`
  - `--color-dark-section: #20211F`
- [x] **REQ-1.2 (Remove AI Blue/Purple Artifacts)**: Eliminate generic SaaS blue/purple gradients, excessive glow effects, and redundant glassmorphism filters across components and utilities.
- [x] **REQ-1.3 (Shared Component Refresh)**:
  - `Navbar`: Solid/translucent warm header with thin 1px `#E7E5E0` border and burnt-orange active indicators.
  - `Button`: Burnt orange primary (`#E76F35`), crisp monochrome secondary with `#E7E5E0` border, ghost button with `#171717` ink.
  - `Badge`: Crisp flat badges with subtle tinting and thin borders replacing generic pill tags.
  - `Card`: Crisp white background (`#FFFFFF`), subtle hover elevation, 1px border (`#E7E5E0`), and asymmetric spacing support.
  - `SectionTitle` & `PageIntro`: Strong editorial typography with `Space Grotesk` and clean burnt-orange eyebrow tags.
- [x] **REQ-1.4 (Theme Dark Section Component)**: Introduce dedicated dark container (`#20211F`) with crisp inverted text (`#FAF9F6`) and burnt-orange accents across Landing Page and Auth Pages.
- [x] **REQ-1.5 (Full View Consistency)**: Updated Home, People, Profile, Projects, Opportunities, Mentorship, Messages, Settings, and Auth pages to consistently honor the white, black, and burnt-orange design language.

## Phase 2: Custom Cursor & Micro-Interactions (Completed)
- [x] **REQ-2.1 (Custom Black Cursor)**: Minimal black dot (`#171717`) with smooth trailing ring, expanding with burnt-orange accent (`#E76F35`) on interactive target hover. Mounted and globally active in `src/App.tsx`.
- [x] **REQ-2.2 (Magnetic Buttons)**: Spring physics tracking cursor coordinates in `src/components/Interactive.tsx` on primary CTA buttons.
- [x] **REQ-2.3 (Subtle 3D Card Tilting)**: Multi-axis 3D perspective tilt on hover with clamped rotation angles (<= 5deg) across `StudentCard`, `ProjectCard`, `OpportunityCard`, and `MentorCard`.
- [x] **REQ-2.4 (Accessibility & Touch Fallbacks)**: Clean fallback to default cursor and static layouts when `prefers-reduced-motion: reduce` is active or fine pointer is not available.
- [x] **REQ-2.5 (Scroll Progress Indicator)**: Global top progress bar in burnt-orange mounted in `src/App.tsx`.

## Phase 3: Interactive 3D Campus Network (Completed)
- [x] **REQ-3.1 (Spatial Node Architecture)**: Implemented 6 distinct node categories representing Students (`#E76F35`), Alumni (`#20211F`), Mentors (`#C25828`), Projects (`#4A3B32`), Skills (`#737068`), and Opportunities (`#D97706`).
- [x] **REQ-3.2 (Palette & Lighting Integration)**: Replaced legacy blue/purple point lights with warm alabaster ambient light (`#FAF9F6`) and burnt-orange key light (`#E76F35`). Connection lines updated to `#E76F35` with subtle opacity.
- [x] **REQ-3.3 (Mouse Coordinate Reactivity)**: Smooth camera parallax tracking mouse coordinates and raycast node hover scaling with instant feedback.
- [x] **REQ-3.4 (Spatial HTML Chips)**: Projected editorial labels on pivotal hub nodes (e.g. `Student: Aanya M.`, `Alumni: Rahul S.`, `Project: Event Hub`, `Opportunity: HackVerse`) using `@react-three/drei` `<Html>`.
- [x] **REQ-3.5 (UI Graph Legend)**: Hero section includes an interactive Spatial Campus Graph legend chip directly indexing the 6 node categories.

## Phase 4: Scroll-Driven 3D Transformations (Completed)
- [x] **REQ-4.1 (Meaningful 3D Composition Shifts)**: Scroll position drives 3D camera trajectory through 5 smoothstep waypoints, category node morphing, active stage scaling, and screen-space proximity lighting.
- [x] **REQ-4.2 (Node-to-Card Transition Orchestration)**: Smooth synchronised choreographies where spatial nodes transition into floating student profiles, receding as project cards emerge, followed by opportunities and mentorship cards using `SpatialCard` 3D perspective emergence.
- [x] **REQ-4.3 (Performance Preservation)**: 60fps/120fps render loop with passive scroll listeners, inertial damping inside `useFrame`, zero React re-render churn during scroll, and persistent background canvas.

## Phase 5: Holistic Page Integration (Completed)
- [x] **REQ-5.1 (App Shell & Navigation Across All Routes)**: Consistent top navigation with frosted glass header (`--color-header-bg`), expanded 5-destination mobile dock, and editorial footer with campus directory links across all interior views.
- [x] **REQ-5.2 (Interior Page Styling)**: Applied the burnt-orange/warm white aesthetic with `TiltCard` micro-interactions, `MagneticButton` primary actions, and clean editorial typography across Home, People, Projects, Opportunities, Mentorship, Messages, and Settings.
- [x] **REQ-5.3 (Auth Page Polish)**: Streamlined, high-fashion login and student signup views using `#20211F` contrast panels with verified campus benefits, burnt-orange `#E76F35` accents, and magnetic submit action.

## Phase 6: Performance, Accessibility & Final Validation (Completed)
- [x] **REQ-6.1 (Bundle & Performance Audit)**: Dynamic code-split 3D canvas chunk, single instanced mesh for 60 nodes, zero-rerender continuous damping frame loop, clean production build in 2.13s.
- [x] **REQ-6.2 (Contrast & Accessibility)**: Exceeded WCAG AA (AAA compliance on ink: 15.8:1, secondary: 8.3:1, dark panel inverted: 14.2:1, dark mode ink: 16.2:1), focus rings with 2px offset, full reduced-motion and touch pointer safety guards.
- [x] **REQ-6.3 (Cross-Device & Responsive Verification)**: Full mobile drawer & 5-destination thumb dock, fluid clamp typography, horizontal scrolling for cards, and seamless layouts from 360px phones up to ultra-wide desktop displays.

## Phase 7: Visual & Interaction Refinements (Completed)
- [x] **REQ-7.1 (Liquid Glass Button Architecture)**: Apple-inspired liquid specular highlight tracking cursor position, refractive rim, tactile spring click feedback, dark charcoal & burnt-orange brand variants, full keyboard focus rings, touch safety, and form submit support.
- [x] **REQ-7.2 (Cinematic 3D Constellation Trajectory)**: Forward depth traversal with smoothstep Hermite waypoints, Skills category 4 stage integration (`Students ↔ Skills ↔ Projects ↔ Alumni ↔ Opportunities`), calm parallax, zero camera popping, and zero scroll hijacking.
- [x] **REQ-7.3 (Card-to-Node Depth Choreography)**: Tuned landing page section backdrops to create continuous spatial corridors, synchronizing 3D node transitions with DOM student profile cards receding as project cards emerge, leading into opportunities and mentorship.

## Milestone 3: Backend MVP (Supabase Integration) (Completed)
- [x] **REQ-8.1 (Supabase Setup & Foundational Schema)**: Migrations for profiles, skills, profile_skills, verification_requests, connections, and handle_new_user auth trigger.
- [x] **REQ-9.1 (Authentication, Sessions & Verification)**: Real Supabase Auth, persistent sessions, ProtectedRoute guards, and student verification submission flow.
- [x] **REQ-10.1 (Profiles, Skills & Connections Lifecycle)**: Directory lookup, skills mapping, and connection lifecycle with progressive access.
- [x] **REQ-11.1 (Community Feed, Posts & Reactions)**: Post creation, bookmarks, like counters, and comment threads.
- [x] **REQ-12.1 (Projects & Opportunities)**: Project publishing, team applications, and opportunity directory.
- [x] **REQ-13.1 (Mentorship Workflows)**: Mentor profiles, booking modal, session scheduling, and review flow.
- [x] **REQ-14.1 (Messaging & Notifications)**: Direct conversations, message delivery, and notification drawer.
- [x] **REQ-15.1 (Admin & Moderation)**: Verification request auditing, moderation desk, and platform statistics.

## Milestone 4: Code Hardening & Reliability
- [x] **REQ-16.1 (Database Security & RLS Hardening - Priority 1)**: Prevent conversation modification, message spoofing, actor spoofing, duplicate connections, and profile privilege escalation with negative tests.
- [x] **REQ-17.1 (Authentication & Verification Integrity - Priority 2)**: Database trigger for automatic status transitions on verification requests, session profile hydration locks, polling with exponential backoff on signup, and safe password recovery error reporting.
- [x] **REQ-18.1 (Supabase Integration & Data Flow Correctness - Priority 3)**: Atomic triggers for project creator membership and accepted applications, explicit PostgREST `table!fk` relationship embeds, and zero silent fallbacks on live errors.
- [x] **REQ-19.1 (Functionality, Admin & Realtime Polish - Priority 4)**: Admin opportunity management CRUD and RLS, live Supabase Realtime channel subscriptions for messaging and notifications, root ThemeProvider, and offline profile edit sync.
- [x] **REQ-20.1 (Performance, Tooling & Script Hygiene - Priority 5)**: Query pagination with `.range()` boundaries across 5 core services, safe database type-generation runner `scripts/generate-types.js`, and package script hygiene.
- [x] **REQ-21.1 (Final Verification & End-to-End Validation - Priority 6)**: Comprehensive execution of full automated test suite across all 10+ test suites, zero TypeScript errors, clean production bundle, and final verification report artifact.


