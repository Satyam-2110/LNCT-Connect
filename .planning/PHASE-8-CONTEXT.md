# Phase 8 Context: Backend Foundation & Supabase Setup

**Milestone**: Milestone 3 — Backend MVP  
**Phase**: Phase 8 (Foundational Database Setup, Migrations & Client Integration)  
**Status**: Context Formulated & Decisions Locked  

---

## 1. Executive Summary & Objective

Phase 8 lays the production-ready backend foundation for LNCT Connect using Supabase and PostgreSQL. It establishes the database connection, client singleton, environment variable configuration, version-controlled migrations, and initial schema with Row Level Security (RLS) and automatic profile provisioning triggers.

---

## 2. Locked Decisions

### Decision 1: Environment & Client Fallback
- **Choice**: Graceful Development Fallback.
- **Specification**:
  - The client will check for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in environment variables.
  - If keys are missing (e.g. before developer sets up their Supabase project credentials in `.env.local`), `src/lib/supabase.ts` will:
    1. Log a prominent, helpful console warning outlining how to set up `.env.local` using `.env.example`.
    2. Provide a mock/dummy client or safe fallback so `npm run dev` and `npm run build` continue to succeed with 0 errors and zero app crashes.
  - No secret keys (e.g. `service_role`) will ever be included in client code or `.env.example`.

### Decision 2: Schema Boundary (Strict Minimal Scope)
- **Choice**: Strict Minimal Schema for Phase 8.
- **Specification**:
  - In adherence to the prompt mandate (*"Do not create all possible database tables prematurely. Establish the minimum schema required for each phase"*), Phase 8 will create only the foundational tables:
    1. `profiles`: Linked to `auth.users(id)` with `ON DELETE CASCADE`. Stores `full_name`, `avatar_url`, `branch`, `batch`, `bio`, `github_url`, `linkedin_url`, `portfolio_url`, `role`, and `verification_status`.
    2. `skills`: Standardized taxonomy of skills (`id`, `name`, `category`).
    3. `profile_skills`: Join table linking `profile_id` and `skill_id`.
    4. `verification_requests`: Audit trail for student institutional verification (`id`, `user_id`, `enrollment_number`, `id_card_url`, `status`, `rejection_reason`, `submitted_at`, `reviewed_at`, `reviewed_by`).
  - **Triggers**:
    - `public.handle_new_user()` trigger on `auth.users` (`AFTER INSERT`) to automatically provision a corresponding `profiles` row upon user signup.
    - `update_timestamp()` trigger on `profiles` to automatically maintain `updated_at`.
  - **Deferred Tables**: Posts, comments, reactions, saved posts, projects, project members, opportunities, mentorship, conversations, and notifications will be migrated incrementally in their respective phases (Phases 10 through 14).

### Decision 3: Type Definitions Strategy & Regeneration Rule
- **Choice**: Schema-Generated Types (with Migration-Matched Temporary Definitions until Project is Configured).
- **Specification**:
  - **Preferred Workflow**: Prefer generating TypeScript database definitions directly from the live PostgreSQL schema using the Supabase CLI (`npx supabase gen types typescript --project-id <id>` or `--local`) or exported directly from the Supabase Dashboard SQL/Schema export.
  - **Interim Phase 8 Stand-in**: Because the live Supabase project/database is not yet connected during local repository setup, provide temporary TypeScript definitions in `src/types/database.ts` that accurately and strictly mirror `supabase/migrations/0001_initial_schema.sql`.
  - **Documentation & Invalidation Warning**: The header of `src/types/database.ts` must prominently document that these definitions are temporary stand-ins and **must be regenerated or verified against the actual schema** as soon as the project is linked.
  - **No Manual Edits on Generated Types**: Do not manually modify generated type files. Whenever schema changes require it, regenerate them from the database schema or CLI.
  - **Helper Script**: Include a regeneration script shortcut in `package.json` (e.g. `"db:types": "supabase gen types typescript --project-id <id> > src/types/database.ts"`) with instructions in README/docs.

### Decision 4: Row Level Security (RLS) Baseline
- **Choice**: Defense-in-depth RLS on all tables from Day 1.
- **Specification**:
  - `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`
    - Read: `SELECT` allowed for all authenticated users (and public discovery where permitted).
    - Insert: Managed by system security definer trigger on `auth.users`.
    - Update: `auth.uid() = id` (users can only edit their own profile; cannot self-promote `role` or self-approve `verification_status`).
  - `ALTER TABLE skills ENABLE ROW LEVEL SECURITY;`
    - Read: Public / Authenticated read.
    - Write: Admin only.
  - `ALTER TABLE profile_skills ENABLE ROW LEVEL SECURITY;`
    - Read: Public / Authenticated read.
    - Write: `auth.uid() = profile_id`.
  - `ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;`
    - Select: `auth.uid() = user_id` OR `is_admin()`.
    - Insert: `auth.uid() = user_id`.
    - Update: Admin only.

---

## 3. Deliverables for Phase 8

1. **Dependency Installation**:
   - Install `@supabase/supabase-js`.
2. **Environment Configuration**:
   - `.env.example` documenting `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. **Database Migration**:
   - `supabase/migrations/0001_initial_schema.sql` containing versioned SQL for tables, constraints, foreign keys, triggers, and RLS policies.
4. **TypeScript Definitions**:
   - `src/types/database.ts` mapping schema to TypeScript types.
5. **Supabase Client Singleton**:
   - `src/lib/supabase.ts` with graceful fallback handling and typed client.
6. **Documentation & Verification**:
   - Test build (`tsc -b && vite build`), verify zero regressions on existing 11 routes, and ensure all existing frontend interactions remain intact.

---

## 4. Unresolved or Deferred Items
- **Supabase Cloud Project URL**: The user will create or connect their Supabase project and insert their URL and anon key into `.env.local` when ready. The code will be 100% prepared to connect immediately.
- **Authentication Pages Integration**: Visual and functional wiring of Login / Signup to real Supabase Auth sessions will occur in Phase 9.
