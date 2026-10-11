# Technology Stack Map

## Core Framework & Runtime
- **Build Tool / Bundler**: Vite (latest)
- **UI Library**: React (latest)
- **Language**: TypeScript (latest)
- **Router**: React Router DOM (`react-router-dom`)
- **Package Manager**: npm

## Styling & Animations
- **CSS Engine**: Tailwind CSS (`@tailwindcss/vite`, `tailwindcss`) + `src/index.css`
- **Component Animations**: Framer Motion (`framer-motion`)
- **Timeline & Canvas Animations**: GSAP (`gsap`)
- **Icons**: Lucide React (`lucide-react`)

## 3D Graphics & Canvas
- **3D Engine**: Three.js (`three`, `@types/three`)
- **React 3D Integrations**: `@react-three/fiber`, `@react-three/drei`

## Build & Development Scripts
- `npm run dev` — Launches Vite dev server
- `npm run build` — TypeScript type checking (`tsc -b`) followed by Vite production build
- `npm run lint` — TypeScript check (`tsc -b --pretty false`)
- `npm run preview` — Local preview of production build
