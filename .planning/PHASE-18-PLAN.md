# Phase 18 Plan: Supabase Integration & Data Flow Correctness

**Milestone**: Milestone 4 — Code Hardening & Reliability  
**Phase**: Phase 18 (Priority 3: Supabase Integration & Data Flow Correctness)  
**Status**: Completed & Verified (102/102 tests passing)  
**Dependencies**: Completed Phase 16, Phase 17 (Migrations 0001–0009)  

---

## 1. Objectives & Scope

Harden all data access layers, eliminate silent mock-data fallbacks on database errors, ensure foreign key relationship embedding complies with PostgREST syntax, and enforce atomic multi-step operations via PostgreSQL triggers:

1. **Embedded PostgREST Relationship Queries**:
   - Qualify all embedded foreign key relationship queries across `messaging.ts`, `notifications.ts`, `projects.ts`, `posts.ts`, `admin.ts`, and `mentorship.ts` using explicit `table!foreign_key` syntax (e.g., `profiles!participant_one`, `profiles!creator_id`, `profiles!author_id`) to avoid PostgREST relationship ambiguity errors.
2. **Eliminate Silent Mock-Data Fallbacks on Live Errors**:
   - When `isSupabaseConfigured` is active and a query fails or errors, propagate the real error or return empty state rather than silently falling back to mock fixtures and giving a false illusion of success.
3. **Atomic Multi-Step Operations via Database Triggers**:
   - Implement forward migration `supabase/migrations/0009_data_flow_and_atomic_triggers.sql`:
     - `trg_project_creator_membership`: Automatically insert creator as `'owner'` in `public.project_members` when a new project is created.
     - `trg_accepted_project_application`: Automatically insert applicant as `'member'` in `public.project_members` when a project application status transitions to `'accepted'`.
4. **Automated Integration & Data Flow Test Suite**:
   - Author `src/test/data-flow-and-integration.test.ts` validating trigger atomicity, relationship query validity, and live error propagation behavior.

---

## 2. Tasks Breakdown

- [x] **Task 18.1: Forward Migration for Atomic Multi-Step Operations**
  - Author `supabase/migrations/0009_data_flow_and_atomic_triggers.sql`.
  - Add `handle_new_project_creator_membership()` trigger on `public.projects` (AFTER INSERT).
  - Add `handle_accepted_project_application()` trigger on `public.project_applications` (AFTER UPDATE OF status).
  - Configure functions as `SECURITY DEFINER` with `SET search_path = public`.

- [x] **Task 18.2: PostgREST Relationship Syntax Alignment**
  - Update `src/services/messaging.ts`:
    - `p1:profiles!participant_one(...)` and `p2:profiles!participant_two(...)`.
  - Update `src/services/notifications.ts`:
    - `actor:profiles!actor_id(...)`.
  - Update `src/services/projects.ts`:
    - `profiles!creator_id(...)` in `fetchProjects`.
    - `profiles!applicant_id(...)` in `fetchProjectApplications`.
  - Update `src/services/posts.ts`:
    - `profiles!author_id(...)` in `fetchFeedPosts` and `fetchComments`.
  - Update `src/services/mentorship.ts`:
    - `profiles!id(...)` in `fetchMentors`.
    - `student:profiles!student_id(...)` in `fetchMentorshipRequests`.
  - Update `src/services/admin.ts`:
    - `profiles!user_id(...)` in `fetchVerificationQueue`.
    - `profiles!reporter_id(...)` in `fetchContentReports`.

- [x] **Task 18.3: Remove Silent Mock Fallbacks on Live Database Errors**
  - In `messaging.ts`: return real errors or empty lists on database failure when `isSupabaseConfigured` is true.
  - In `notifications.ts`: return empty lists on database failure when `isSupabaseConfigured` is true.
  - In `projects.ts`: return empty lists on database failure in `fetchProjectApplications`; rely on atomic triggers for membership insertion.
  - In `posts.ts`: return empty list in `fetchComments` on database failure when `isSupabaseConfigured` is true.
  - In `mentorship.ts`: return empty list in `fetchMentorshipRequests` on database failure when `isSupabaseConfigured` is true.
  - In `admin.ts`: propagate real database error in `fetchVerificationQueue` and `fetchContentReports`.

- [x] **Task 18.4: Automated Test Expansion & Verification**
  - Author `src/test/data-flow-and-integration.test.ts`.
  - Run `npm test` verifying all test suites pass (102/102 tests pass).
  - Run `npm run build` verifying clean compilation and zero TypeScript errors.

---

## 3. Measurable Acceptance Criteria

- **AC-18.1**: `0009_data_flow_and_atomic_triggers.sql` guarantees atomic project ownership and application enrollment in PostgreSQL transactions.
- **AC-18.2**: All PostgREST relationship embeds explicitly declare foreign key constraints preventing ambiguous join exceptions.
- **AC-18.3**: Live database operations report real status/errors and do not mask failures with mock fallback data.
- **AC-18.4**: All automated test suites pass cleanly (`npm test`) with zero failures.
