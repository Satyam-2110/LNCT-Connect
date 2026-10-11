# Phase 15 Plan: Administration, Moderation & Security Hardening

**Milestone**: Milestone 3 — Backend MVP  
**Phase**: Phase 15 (Admin Verification Review Desk, Content Moderation, Security Audit & Production Hardening)  
**Status**: Completed & Verified  

---

## 1. Objectives & Scope

Deliver administration, content reporting, moderation workflows, and negative security testing for LNCT Connect:
1. Version-controlled PostgreSQL migration (`supabase/migrations/0006_administration_and_moderation.sql`).
2. Update TypeScript database contracts in `src/types/database.ts`.
3. Create `src/services/admin.ts` with offline-first in-memory stores and permission checks.
4. Build `src/components/ReportContentModal.tsx` and upgrade `PostCard` to allow reporting.
5. Build `src/pages/AdminPage.tsx` with Verification Queue, Moderation Queue, and Campus Stats.
6. Register protected `/admin` route in `src/App.tsx` and header navigation link in `src/components/layout.tsx`.
7. Author automated Vitest suite `src/test/security-hardening.test.ts`.
8. Complete production readiness audit (`npm test`, `npm run lint`, `npm run build`).

---

## 2. Tasks Breakdown

- [x] **Task 15.1: Database Migration & Types**
  - Author `supabase/migrations/0006_administration_and_moderation.sql`.
  - Define `public.content_reports` table (id, reporter_id, target_type, target_id, reason, details, status, admin_notes, resolved_by, timestamps).
  - Add indexes and updated_at triggers.
  - Implement trigger syncing `profiles.verification_status` on `verification_requests` status changes.
  - Write Row Level Security (RLS) policies enforcing that only admins can view all reports or resolve them, while authenticated users can file reports.
  - Update `src/types/database.ts` with `content_reports`.

- [x] **Task 15.2: Admin & Moderation Service Layer**
  - Create `src/services/admin.ts`:
    - `fetchVerificationQueue(adminUserId)`: List verification requests with student info.
    - `reviewVerification(adminUserId, requestId, status, reviewNotes)`: Approve or reject verification request.
    - `reportContent(reporterId, targetType, targetId, reason, details)`: File a content report.
    - `fetchContentReports(adminUserId, statusFilter)`: Admin queue of flagged content.
    - `resolveContentReport(adminUserId, reportId, resolution, adminNotes)`: Admin resolve/dismiss report.
    - `fetchCampusAdminStats(adminUserId)`: Overview campus statistics.

- [x] **Task 15.3: UI Components & Reporting Modal**
  - Create `src/components/ReportContentModal.tsx`.
  - Update `src/components/cards.tsx` (`PostCard` options menu `•••`) to include "Report Post" action opening `ReportContentModal`.

- [x] **Task 15.4: Admin Dashboard Page & Navigation Integration**
  - Create `src/pages/AdminPage.tsx` with:
    - Tab 1: Verification Queue (pending student ID cards, quick approve / reject with notes).
    - Tab 2: Content Moderation Queue (review reported posts, comments, projects, profiles).
    - Tab 3: Campus Analytics (verified ratio, active projects, mentorship metrics).
  - Add route `/admin` in `src/App.tsx`.
  - Add Admin Desk badge/link in `src/components/layout.tsx` Header when `profile?.role === 'admin'`.

- [x] **Task 15.5: Security Hardening Test Suite & Verification**
  - Write `src/test/security-hardening.test.ts`.
  - Cover:
    - Non-admin blocked from viewing verification queue.
    - Non-admin blocked from approving verifications.
    - Verified approval correctly updates student profile status to verified.
    - Content report creation and non-admin resolution blocking.
    - Admin resolution of reports.
    - Privilege escalation prevention.
  - Run `npm test` (all 73 tests pass).
  - Run `npm run lint` and `npm run build` with zero errors.

---

## 3. Acceptance Criteria

- **AC-15.1**: PostgreSQL migration `0006_administration_and_moderation.sql` exists and has correct DDL, triggers, and RLS policies.
- **AC-15.2**: TypeScript contracts in `src/types/database.ts` include `content_reports`.
- **AC-15.3**: Non-admin users are strictly blocked from viewing verification queues or approving requests.
- **AC-15.4**: Admin approval of a verification request synchronizes `profiles.verification_status` to `'verified'`.
- **AC-15.5**: Authenticated users can file content reports with reason and explanation via `ReportContentModal`.
- **AC-15.6**: Only administrators can review, resolve, or dismiss content reports.
- **AC-15.7**: `/admin` dashboard displays live queues for verification review and content moderation.
- **AC-15.8**: Negative security test suite passes with zero failures.
- **AC-15.9**: Complete test suite passes (`npm test`), 0 linter errors, and `npm run build` succeeds cleanly.
