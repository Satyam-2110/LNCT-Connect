# Phase 15 Context: Administration, Moderation & Security Hardening

**Milestone**: Milestone 3 — Backend MVP  
**Phase**: Phase 15 (Admin Verification Review Desk, Content Moderation, Security Audit & Production Hardening)  
**Status**: Decisions Locked & Plan Formulated  

---

## 1. Executive Summary & Objective

Phase 15 is the final phase of Milestone 3 (Backend MVP). It equips LNCT Connect with administrative governance, content moderation, and security hardening.
- Version-controlled PostgreSQL migration (`supabase/migrations/0006_administration_and_moderation.sql`) introducing `content_reports` and administrative procedures.
- Administrative verification review desk (`src/pages/AdminPage.tsx`) allowing verified campus administrators to review, approve, or reject student enrollment ID proofs from `public.verification_requests`.
- Content reporting and moderation workflow allowing community members to report inappropriate posts, comments, profiles, or projects, and administrators to review and resolve them.
- Negative security test suite (`src/test/security-hardening.test.ts`) ensuring non-admins cannot access admin endpoints, cannot approve verifications, cannot elevate privileges, and that progressive access rules hold across all 15 phases.
- Production readiness verification: zero build errors, zero linter warnings, complete test suite passing.

---

## 2. Locked Decisions

### Decision 1: Dedicated Admin Portal Route
- **Choice**: Protected Route `/admin` with Role Guard.
- **Specification**:
  - Accessible to users with `role = 'admin'` (with simulated dev admin toggle or role inspection for testing).
  - Displays:
    1. **Verification Queue**: Pending student enrollment requests, uploaded ID card previews, department, year, approve/reject buttons with review notes.
    2. **Moderation Desk**: Flagged content reports with reason (`spam`, `harassment`, `inappropriate`, `impersonation`), target link, reporter details, and resolve/dismiss controls.
    3. **Campus Metrics**: Summary counts for total registered students, verified ratio, active projects, and mentorship sessions.
  - When non-admin authenticated users attempt to navigate to `/admin`, displays an access denied barrier with an option to request admin credentials.

### Decision 2: Content Moderation & Reporting Workflow
- **Choice**: Direct Reporting Modal (`ReportContentModal.tsx`).
- **Specification**:
  - Triggerable from post action menus (`PostCard` `•••`), project details, or student profiles.
  - Submits to `public.content_reports` with `target_type`, `target_id`, `reason`, and explanatory details.
  - Database RLS permits authenticated members to file reports, but only `public.is_admin()` can view all reports or update status to `resolved` or `dismissed`.

### Decision 3: Verification Approval Synchronization
- **Choice**: Bi-Directional Request & Profile Sync.
- **Specification**:
  - Approving a verification request in `public.verification_requests` atomically updates the user's `profiles.verification_status` to `'verified'`.
  - Rejecting updates `profiles.verification_status` to `'rejected'`.
  - Enforced by database trigger and backend service layer logic.

### Decision 4: Negative Security Hardening Suite
- **Choice**: Comprehensive Multi-Vector RLS & Auth Audit (`security-hardening.test.ts`).
- **Specification**:
  - Verifies non-admin cannot access verification queues.
  - Verifies non-admin cannot resolve moderation reports.
  - Verifies role tampering prevention (privilege escalation blocked).
  - Verifies cross-user privacy (messages, notifications, bookmarks remain isolated).

---

## 3. Deliverables for Phase 15

1. **Database Migration (`supabase/migrations/0006_administration_and_moderation.sql`)**:
   - `public.content_reports` schema, constraints, indexes, triggers, and RLS policies.
   - Sync trigger updating `public.profiles.verification_status` when `verification_requests.status` changes.
2. **Database Types Updates (`src/types/database.ts`)**:
   - TypeScript definitions for `content_reports`.
3. **Admin & Moderation Service (`src/services/admin.ts`)**:
   - `fetchVerificationQueue(adminUserId)`
   - `reviewVerification(adminUserId, requestId, status, reviewNotes)`
   - `reportContent(reporterId, targetType, targetId, reason, details)`
   - `fetchContentReports(adminUserId, statusFilter)`
   - `resolveContentReport(adminUserId, reportId, resolution, adminNotes)`
   - `fetchCampusAdminStats(adminUserId)`
4. **UI Components & Pages**:
   - `src/components/ReportContentModal.tsx`: User-facing report dialog.
   - `src/pages/AdminPage.tsx`: Admin dashboard with Verification Queue, Moderation Desk, and Metrics.
   - Route `/admin` in `src/App.tsx`.
   - Header badge / link in `src/components/layout.tsx` for admins.
5. **Automated Vitest Test Suite (`src/test/security-hardening.test.ts`)**:
   - 10+ negative and positive security tests validating access boundaries.
