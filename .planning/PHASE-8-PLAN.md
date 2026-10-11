# Phase 8 Plan: Backend Foundation, Supabase Setup & Base Schema

**Milestone**: Milestone 3 — Backend MVP  
**Phase**: Phase 8  
**Status**: Completed & Verified  
**Dependencies**: Completed Milestones 1 & 2 (Phases 0–7)  

---

## 1. Executive Summary & Scope

Phase 8 establishes the robust backend foundation for LNCT Connect without modifying existing visual features, page flows, or 3D animations. It integrates `@supabase/supabase-js`, defines secure environment variables and Git exclusions, authors version-controlled PostgreSQL schema migrations for the 5 initial entities (`profiles`, `skills`, `profile_skills`, `verification_requests`, `connections`), implements automated profile provisioning triggers, enforces strict Row Level Security (RLS) policies, and establishes type-safe database contracts.

---

## 2. Core Architecture & Technical Specifications

### A. Environment Configuration & Secret Hygiene
- **Environment Variables**:
  - `VITE_SUPABASE_URL`: Supabase project endpoint.
  - `VITE_SUPABASE_PUBLISHABLE_KEY`: Client publishable / anon public key (also aliased with `VITE_SUPABASE_ANON_KEY` for convenience).
- **Files**:
  - `.env.example`: Safe template containing placeholder keys with explanatory documentation.
  - `.gitignore`: Comprehensive Git exclusion rules ensuring `.env`, `.env.local`, `.env.*.local`, credentials, and builds are strictly ignored.
- **Rule**: Never expose `service_role` or secret keys in client-side code.

### B. Supabase Client Singleton (`src/lib/supabase.ts`)
- Configures a typed Supabase client instance using `createClient<Database>`.
- **Graceful Fallback Mode**: If environment variables are missing during initial setup, it:
  1. Emits a clean, non-intrusive console notice informing developers how to configure `.env.local`.
  2. Provides a safe client instance so `npm run dev` and `npm run build` execute without throwing unhandled runtime exceptions.

### C. Version-Controlled Migration (`supabase/migrations/0001_initial_schema.sql`)
The migration defines 5 core tables with strict relational integrity, foreign keys, cascades, constraints, and indexes:

1. **`public.profiles`**:
   - `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
   - `full_name TEXT NOT NULL`
   - `avatar_url TEXT`
   - `branch TEXT` (e.g. 'CSE', 'IT', 'ECE', 'AIML')
   - `batch TEXT` (e.g. '2022-2026')
   - `graduation_year TEXT`
   - `bio TEXT`
   - `location TEXT DEFAULT 'Bhopal, MP'`
   - `company TEXT`
   - `is_alumni BOOLEAN DEFAULT FALSE`
   - `role TEXT DEFAULT 'student' CHECK (role IN ('student', 'alumni', 'faculty', 'mentor', 'admin'))`
   - `verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'))`
   - `github_url TEXT`
   - `linkedin_url TEXT`
   - `portfolio_url TEXT`
   - `created_at TIMESTAMPTZ DEFAULT NOW()`
   - `updated_at TIMESTAMPTZ DEFAULT NOW()`

2. **`public.skills`**:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `name TEXT UNIQUE NOT NULL`
   - `category TEXT DEFAULT 'general'`
   - `created_at TIMESTAMPTZ DEFAULT NOW()`

3. **`public.profile_skills`**:
   - `profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE`
   - `skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE`
   - `PRIMARY KEY (profile_id, skill_id)`

4. **`public.verification_requests`**:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE`
   - `enrollment_number TEXT NOT NULL`
   - `id_card_url TEXT`
   - `status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))`
   - `rejection_reason TEXT`
   - `submitted_at TIMESTAMPTZ DEFAULT NOW()`
   - `reviewed_at TIMESTAMPTZ`
   - `reviewed_by UUID REFERENCES public.profiles(id)`

5. **`public.connections`**:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE`
   - `receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE`
   - `status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected'))`
   - `created_at TIMESTAMPTZ DEFAULT NOW()`
   - `updated_at TIMESTAMPTZ DEFAULT NOW()`
   - `CONSTRAINT check_no_self_connection CHECK (requester_id <> receiver_id)`
   - `CONSTRAINT unique_connection_pair UNIQUE (requester_id, receiver_id)`

### D. Triggers & Stored Functions
1. **`public.handle_new_user()` Trigger**:
   - Triggered `AFTER INSERT ON auth.users`.
   - Security Definer function.
   - Extracts `full_name` from `raw_user_meta_data` or falls back to the user's email username.
   - Automatically determines initial `verification_status`: if email ends in `@lnct.ac.in`, marks as `verified`, otherwise `unverified`.
   - Automatically provisions initial `role` as `student` (never trusts client-supplied role values).
2. **`public.handle_updated_at()` Trigger**:
   - Keeps `updated_at` timestamps fresh on `profiles` and `connections`.
3. **`public.is_admin()` Function**:
   - Helper function evaluating `EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')` for administrative policy checks.
4. **Privilege Escalation Prevention Trigger**:
   - A `BEFORE UPDATE ON public.profiles` trigger ensuring non-admin users cannot alter their own `role` or `verification_status`.

### E. Row Level Security (RLS) Specification
- **`profiles`**:
  - `SELECT`: Allowed for all authenticated users (and public discovery where permitted).
  - `INSERT`: Enforced by auth trigger only.
  - `UPDATE`: `auth.uid() = id` (with trigger preventing self-elevation of role or verification).
  - `DELETE`: Admin only or cascade via `auth.users`.
- **`skills`**:
  - `SELECT`: Permitted for all users.
  - `INSERT / UPDATE / DELETE`: Admin only.
- **`profile_skills`**:
  - `SELECT`: Permitted for all users.
  - `INSERT / UPDATE / DELETE`: `auth.uid() = profile_id`.
- **`verification_requests`**:
  - `SELECT`: `auth.uid() = user_id` OR `is_admin()`.
  - `INSERT`: `auth.uid() = user_id` AND `status = 'pending'`.
  - `UPDATE`: `is_admin()` only (regular users CANNOT approve/reject requests).
- **`connections`**:
  - `SELECT`: `auth.uid() IN (requester_id, receiver_id)`.
  - `INSERT`: `auth.uid() = requester_id`.
  - `UPDATE`: `auth.uid() IN (requester_id, receiver_id)` (e.g. receiver accepting/rejecting).
  - `DELETE`: `auth.uid() IN (requester_id, receiver_id)`.

### F. TypeScript Database Definitions (`src/types/database.ts`)
- Stand-in `Database` type accurately matching `0001_initial_schema.sql`.
- Header clearly documenting that types must be regenerated via `npm run db:types` once connected to the live Supabase project.
- Script added to `package.json`: `"db:types": "supabase gen types typescript --project-id <id> > src/types/database.ts"`.

---

## 3. Work Breakdown & Action Tasks

| Task | Category | Description | Target Files |
|---|---|---|---|
| **Task 8.1** | Dependencies | Install `@supabase/supabase-js` | `package.json`, `package-lock.json` |
| **Task 8.2** | Git & Env | Create `.gitignore` and `.env.example` with security comments | `.gitignore`, `.env.example` |
| **Task 8.3** | Client Singleton | Implement `src/lib/supabase.ts` with graceful fallback & configuration checks | `src/lib/supabase.ts` |
| **Task 8.4** | Database Migration | Author `0001_initial_schema.sql` with tables, triggers, and RLS policies | `supabase/migrations/0001_initial_schema.sql` |
| **Task 8.5** | Type Contracts | Create `src/types/database.ts` stand-in and add `db:types` script | `src/types/database.ts`, `package.json` |
| **Task 8.6** | Security Tests & Validation | Build verification (`tsc -b && vite build`), RLS policy dry-run review, frontend sanity check | Repository-wide |

---

## 4. Measurable Acceptance Criteria

- [x] **AC-8.1**: `@supabase/supabase-js` is installed and registered in `package.json` dependencies.
- [x] **AC-8.2**: `.gitignore` exists and explicitly blocks `.env`, `.env.local`, `.env.*.local`, and build artifacts from Git.
- [x] **AC-8.3**: `.env.example` is created with clear configuration instructions and zero exposed secret keys.
- [x] **AC-8.4**: `src/lib/supabase.ts` provides a typed `supabase` client singleton that supports both `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_ANON_KEY`, with graceful fallback logging if variables are unset.
- [x] **AC-8.5**: `supabase/migrations/0001_initial_schema.sql` is created containing complete PostgreSQL DDL for `profiles`, `skills`, `profile_skills`, `verification_requests`, and `connections`.
- [x] **AC-8.6**: Automated profile provisioning trigger (`handle_new_user()`) is defined on `auth.users` with safe metadata extraction and institutional email verification check (`@lnct.ac.in`).
- [x] **AC-8.7**: Row Level Security (RLS) is enabled on all 5 tables with explicit policies protecting user ownership and preventing privilege escalation.
- [x] **AC-8.8**: `src/types/database.ts` provides strictly matching database types, with prominent docstring declaring it a temporary stand-in to be regenerated once the project is linked.
- [x] **AC-8.9**: Existing frontend builds cleanly (`tsc -b && vite build`) with zero TypeScript errors and zero regressions.
