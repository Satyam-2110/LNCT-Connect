# Codebase Architecture

## Directory Overview
```
src/
├── App.tsx          # Root routing configuration & route transition animations
├── main.tsx         # React entry point with BrowserRouter wrapper
├── index.css        # Global CSS rules, custom scrollbars & theme variables
├── components/      # Shared layout, card components, UI primitives & canvas scenes
│   ├── layout.tsx         # Navbar, Sidebar, AppLayout shells
│   ├── ui.tsx             # Buttons, Badges, Tabs, Search input primitives
│   ├── cards.tsx          # Feed posts, Student cards, Project cards, Mentor cards
│   ├── NetworkScene.tsx   # React Three Fiber / 3D particle network animation
│   ├── CustomCursor.tsx   # Custom animated cursor trailing effect
│   ├── Interactive.tsx    # Magnetic button & hover wrapper primitives
│   └── ScrollProgress.tsx # Top scroll progress indicator
├── pages/           # High-level page route views
│   ├── LandingPage.tsx    # Hero section, features, stats & 3D hero canvas
│   ├── AuthPages.tsx      # Login & student registration screens
│   ├── HomePage.tsx       # Main social feed, post creator, trending topics
│   ├── PeoplePage.tsx     # Student & alumni directory search & filters
│   ├── ProfilePage.tsx    # Student profile detail view
│   ├── ProjectsPage.tsx   # Project showcase & team discovery
│   ├── OpportunitiesPage.tsx # Internships, hackathons & job listings
│   ├── MentorshipPage.tsx # Mentor directory & booking modals
│   ├── MessagesPage.tsx   # Direct messaging interface & chat threads
│   └── SettingsPage.tsx   # Account settings & preferences form
├── data/            # Mock dataset for students, posts, projects & opportunities
├── types/           # Core TypeScript type definitions
└── lib/             # Utility helpers & helper functions
```

## Routing & Page Hierarchy
- `/` — Landing page with 3D canvas and interactive CTA
- `/login` / `/signup` — Frontend authentication screens
- `/home` — Social feed and post interactions
- `/people` — Student & alumni discovery directory
- `/profile/:id` — Individual student/alumni profile view
- `/projects` — Collaborative student projects & recruitment
- `/opportunities` — Internships, hackathons, and job board
- `/mentorship` — Alumni and peer mentorship directory
- `/messages` — Conversational chat interface
- `/settings` — User preferences & profile settings
