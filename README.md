# LNCT Connect 2.0

The private campus network and professional collaboration platform connecting LNCT students, seniors, alumni, projects, and opportunities.

---

## 1. Project Architecture

The repository is organised into modular, distinct environments:

```
LNCT-Connect/
├── frontend/                     # React 18 + TypeScript + Vite client application
│   ├── public/                   # Static assets and public resources
│   ├── src/
│   │   ├── components/           # Reusable UI, 3D Canvas, Modals, App Shell
│   │   ├── pages/                # Route views (Home, People, Projects, Mentorship, Admin, etc.)
│   │   ├── context/              # Authentication & Session State Context
│   │   ├── services/             # Client-side PostgREST service layers
│   │   ├── lib/                  # Supabase client singleton, theme provider, utilities
│   │   ├── types/                # Strict TypeScript database schemas and model types
│   │   ├── data/                 # Curated development seed data
│   │   └── test/                 # Automated Vitest test suites (124 tests)
│   ├── index.html                # Vite entry HTML
│   ├── package.json              # Frontend dependencies and scripts
│   ├── package-lock.json         # Pinned dependency lockfile
│   ├── vite.config.ts            # Vite & Tailwind CSS plugins
│   ├── tsconfig.json             # TypeScript project references
│   ├── tsconfig.app.json         # Browser application TypeScript config
│   ├── tsconfig.node.json        # Build tooling TypeScript config
│   └── .env.example              # Frontend environment template
│
├── backend/                      # Supabase database platform & scripts
│   ├── supabase/
│   │   └── migrations/           # 10 sequentially versioned PostgreSQL migrations
│   │       ├── 0001_initial_schema.sql
│   │       ├── 0002_posts_and_interactions.sql
│   │       ├── 0003_projects_and_opportunities.sql
│   │       ├── 0004_mentorship_workflows.sql
│   │       ├── 0005_messaging_and_notifications.sql
│   │       ├── 0006_administration_and_moderation.sql
│   │       ├── 0007_security_and_rls_hardening.sql
│   │       ├── 0008_verification_and_auth_integrity.sql
│   │       ├── 0009_data_flow_and_atomic_triggers.sql
│   │       └── 0010_admin_opportunities_rls.sql
│   └── scripts/
│       └── generate-types.js     # Guarded Supabase TypeScript definitions generator
│
├── other/                        # Supporting project documentation and assets
│   ├── documentation/            # Guides and architectural notes
│   ├── reports/                  # Code review audits and milestone reports
│   ├── architecture/             # Design contracts and entity relationship specs
│   └── assets/                   # Non-application brand and reference assets
│
├── .planning/                    # GSD planning directory, roadmaps, and requirements
├── .gitignore                    # Root Git ignore rules
├── package.json                  # Root command coordinator
└── README.md                     # Project documentation
```

---

## 2. Quick Start & Frontend Workflow

### Running Directly from `frontend/`

```bash
# Navigate to the frontend directory
cd frontend

# Install clean dependencies
npm ci

# Start the Vite local development server
npm run dev

# Run TypeScript compilation check
npm run lint

# Run the automated test suite (124 tests across 10 suites)
npm test

# Build for production
npm run build
```

### Running from the Repository Root

Convenience scripts are provided in the root `package.json`:

```bash
# Start frontend dev server from root
npm run dev

# Run production build from root
npm run build

# Run linting/typechecking from root
npm run lint

# Run automated tests from root
npm test

# Generate database types safely
npm run db:types
```

---

## 3. Backend & Supabase CLI Commands

The database schemas, triggers, and Row Level Security (RLS) policies are managed via version-controlled SQL migrations in `backend/supabase/migrations/`.

### Supabase CLI Usage

To run Supabase CLI commands against the backend:

**Option A: From the repository root (recommended):**
```bash
# Pass --workdir backend to point Supabase CLI to backend/supabase/
npx supabase status --workdir backend
npx supabase start --workdir backend
npx supabase db diff --workdir backend
```

**Option B: From the `backend/` directory:**
```bash
cd backend
npx supabase status
npx supabase start
npx supabase db reset
```

### Generating Database TypeScript Types

To generate TypeScript interfaces from your live Supabase project without risking data corruption:

```bash
# Set your Supabase project reference
export SUPABASE_PROJECT_ID="your-project-id"

# Execute the guarded generator
npm run db:types
```

The script verifies your credentials and safely outputs types into `frontend/src/types/database.ts`.

---

## 4. Key Design & Technical Guarantees

- **Theme & Aesthetics**: Warm alabaster background (`#FAF9F6`), deep charcoal panels (`#20211F`), burnt-orange accents (`#E76F35`), Apple-inspired liquid specular buttons, and interactive 3D spatial network constellation.
- **Security & Integrity**: 100% Row Level Security (RLS) enforcement, privilege escalation protection, participant spoofing defense, atomic membership triggers, and institutional email verification.
- **Reliability**: 124 passing unit, integration, and security tests across 10 Vitest test suites.
