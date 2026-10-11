# Phase 13 Context: Mentorship Workflows

**Milestone**: Milestone 3 — Backend MVP  
**Phase**: Phase 13 (Alumni & Senior Mentorship Discovery, Topic Matching, Session Requests & Lifecycle Tracking)  
**Status**: Decisions Locked & Plan Formulated  

---

## 1. Executive Summary & Objective

Phase 13 establishes the mentorship and alumni guidance workflow on LNCT Connect. It connects current students with experienced alumni and senior engineers through structured 1-on-1 session requests.
- Version-controlled PostgreSQL migration (`supabase/migrations/0004_mentorship_workflows.sql`) creating `mentor_profiles` and `mentorship_requests`.
- TypeScript database contracts in `src/types/database.ts`.
- Full mentorship lifecycle: mentor profile registration, topic matching & discovery, structured session booking (topic, goals, preferred timeframe), and mentor review (accept / decline).
- Progressive access verification gating: unverified accounts can browse mentors in read-only mode, but booking a session or applying to be a mentor prompts the `VerificationModal`.
- Row Level Security (RLS) guaranteeing that only verified students can request sessions, self-mentorship is rejected, and only the targeted mentor can accept or decline requests.
- Interactive UI: `BookSessionModal`, `MentorApplicationModal`, and `MentorRequestsModal` embedded seamlessly into `MentorshipPage` and `MentorCard`.

---

## 2. Locked Decisions

### Decision 1: Session Request Structure
- **Choice**: Structured Topic & Goals Booking Modal (`BookSessionModal`).
- **Specification**:
  - Instead of generic unguided messaging, bookings require:
    - Selected Topic (chosen from mentor's advisory topics or custom topic).
    - Session Goals & Context Note (what the student is currently building or struggling with).
    - Preferred Timeframe / Availability.
  - Generates a record in `public.mentorship_requests` with status `pending`.

### Decision 2: Progressive Access & Self-Mentorship Guard
- **Choice**: Verification Interception with Strict RLS and Self-Mentorship Check.
- **Specification**:
  - Unverified accounts can explore alumni mentors and read topics in read-only mode.
  - Booking a session or registering as a mentor requires `isVerified === true`. Unverified users are intercepted client-side with `VerificationModal` and blocked at database RLS level.
  - Self-mentorship (`mentor_id = student_id`) is strictly prohibited by database constraint `check_no_self_mentorship` and client-side guards.

### Decision 3: Mentor Applications & Availability Management
- **Choice**: "Become a Mentor" In-Page Registration Modal (`MentorApplicationModal`).
- **Specification**:
  - Verified students/alumni can activate their mentor profile directly from `/mentorship`.
  - Captures: Years/depth of experience, advisory topics (chips), and monthly session availability (e.g., "2 slots this month").
  - Upserts into `public.mentor_profiles`.

### Decision 4: Mentor Request Dashboard
- **Choice**: Dedicated Review Drawer / Modal (`MentorRequestsModal`).
- **Specification**:
  - When the authenticated user is an active mentor with pending requests, a prominent badge/button ("Review Requests (N)") appears in the mentorship header.
  - Mentors can view student details, topic, and goals, then one-click Accept or Decline.
  - Only the targeted mentor (`auth.uid() = mentor_id`) has permission to update the request status.

### Decision 5: Catalog & Seed Strategy
- **Choice**: Hybrid Database & Curated Alumni Seed.
- **Specification**:
  - Database mentor profiles take precedence.
  - Merged with existing curated alumni profiles (`src/data/mentors.ts`) so the page is populated with rich guidance opportunities from day one.
  - Search field filters across name, company, role, skills, and advice topics.

---

## 3. Deliverables for Phase 13

1. **Database Migration (`supabase/migrations/0004_mentorship_workflows.sql`)**:
   - `public.mentor_profiles`, `public.mentorship_requests`.
   - Foreign keys to `public.profiles`, constraints (`check_no_self_mentorship`), updated_at triggers, and RLS policies.
2. **Database Types Updates (`src/types/database.ts`)**:
   - TypeScript definitions for `mentor_profiles` and `mentorship_requests`.
3. **Mentorship Service (`src/services/mentorship.ts`)**:
   - `fetchMentors(query?)`
   - `registerMentorProfile(userId, profile, isVerified)`
   - `requestMentorshipSession(mentorId, studentId, studentInfo, requestData, isVerified)`
   - `fetchMentorshipRequests(userId, role)`
   - `respondToMentorshipRequest(requestId, mentorId, status)`
4. **Interactive UI Modals & Cards**:
   - `src/components/BookSessionModal.tsx`: Topic selection, goals input, timeframe selection.
   - `src/components/MentorApplicationModal.tsx`: Become a mentor dialog.
   - `src/components/MentorRequestsModal.tsx`: Mentor incoming requests review.
   - `src/components/cards.tsx`: Upgraded `MentorCard` with live session booking state, self-profile detection, and verification guard.
5. **Page Integration**:
   - `src/pages/MentorshipPage.tsx`: Live mentor querying, search, "Become a Mentor" modal, "Review Requests" button for active mentors.
6. **Automated Unit & Integration Test Suite (`src/test/mentorship-workflows.test.ts`)**:
   - 7+ test scenarios verifying progressive access, self-mentorship blocking, booking lifecycle, mentor request review, and search filtering.
