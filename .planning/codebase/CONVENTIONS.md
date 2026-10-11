# Coding & Project Conventions

## Code Style & Formatting
- **Components**: Functional components written with standard export functions (`export function ComponentName()`).
- **Styling**: Tailwind CSS classes embedded directly in JSX, supplemented by custom glassmorphism and gradient classes defined in `src/index.css`.
- **Animations**: Page transitions handled via `framer-motion` `AnimatePresence`. Micro-interactions (hover, active states) use Framer Motion motion components.
- **State Management**: Local React component state (`useState`, `useMemo`) using mock data from `src/data/mockData.ts`.

## File Naming Conventions
- **Pages**: PascalCase ending in `Page.tsx` or `Pages.tsx` (e.g. `LandingPage.tsx`, `AuthPages.tsx`).
- **Components**: PascalCase (e.g. `NetworkScene.tsx`, `CustomCursor.tsx`) or camelCase for component bundles (e.g. `cards.tsx`, `layout.tsx`, `ui.tsx`).
- **Types**: Single export file `src/types/index.ts`.

## TypeScript & Type Safety
- Strict type definitions for domain models (`Student`, `Project`, `Opportunity`, `Mentor`, `Post`, `Conversation`).
- Avoid `any` types; utilize standard React typing (`ReactNode`, `FC`).
