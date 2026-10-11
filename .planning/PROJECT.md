# PROJECT: LNCT CONNECT 2.0

## 1. Executive Summary
LNCT Connect 2.0 is a complete redesign of the LNCT student and alumni networking platform into an editorial-grade, highly interactive campus network. The platform replaces generic AI-generated blue/purple styling with a disciplined white, black, and burnt-orange visual identity, paired with spatial 3D network visualizations and scroll-driven floating composition transformations.

## 2. Core Philosophy & Design Identity
- **Palette**:
  - Main Background: `#FAF9F6` (Alabaster / Warm Off-white)
  - Secondary Background: `#F0EEE8` (Warm Stone)
  - Primary Text: `#171717` (Near-Black)
  - Accent: `#E76F35` (Burnt Orange)
  - Cards / Surfaces: `#FFFFFF` (Pure White)
  - Borders: `#E7E5E0` (Subtle Warm Gray)
  - Dark Sections: `#20211F` (Deep Charcoal Black)
- **Typography & Layout**:
  - Strong typography (`Space Grotesk` display + `Inter` body).
  - Generous whitespace, asymmetric grid rhythms, razor-thin 1px borders.
  - Zero generic SaaS gradients, zero neon glows, zero repetitive card walls, zero unmotivated glassmorphism.

## 3. Interactive Mechanics
1. **Interactive 3D Campus Network (Three.js / React Three Fiber)**:
   - Dynamic spatial network of connected nodes representing students, skills, projects, alumni, mentors, and opportunities.
   - Interactive hover states, particle field, and camera parallax reacting to mouse coordinate physics.
2. **Scroll-Driven Floating Cards**:
   - Scroll position actively reconfigures the 3D composition: spatial nodes transition into student profiles, which recede as collaborative project cards emerge, followed by opportunities and mentorship hubs.
3. **Micro-Interactions**:
   - Custom black trailing cursor with hover expansion and magnetic attraction.
   - 3D card tilt physics with perspective matrices.
   - Magnetic buttons on primary calls-to-action.
   - Full reduced-motion fallbacks (`prefers-reduced-motion`) and touch device awareness.

## 4. Preservation & Technical Rules
- Preserve all 11 existing routes (`/`, `/login`, `/signup`, `/home`, `/people`, `/profile/:id`, `/projects`, `/opportunities`, `/mentorship`, `/messages`, `/settings`).
- Maintain existing React 18, Vite, TypeScript, and Tailwind CSS v4 architecture without adding unnecessary dependencies.
- Keep all structural and textual content in accessible, semantic HTML.

## 5. Milestone 1 Status: COMPLETED
All 7 phases (Phases 0 through 6) have been successfully engineered and verified with zero compilation or bundling errors. LNCT Connect 2.0 is fully operational, responsive, accessible, and live on the development server.
