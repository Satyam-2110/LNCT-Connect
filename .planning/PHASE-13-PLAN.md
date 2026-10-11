# Phase 13 Plan: Mentorship Workflows

**Milestone**: Milestone 3 — Backend MVP  
**Phase**: Phase 13 (Alumni & Senior Mentorship Discovery, Topic Matching, Session Requests & Lifecycle Tracking)  
**Status**: Completed & Verified  

---

## 1. Objectives & Scope

Deliver complete mentorship workflows for LNCT Connect:
1. Version-controlled PostgreSQL migration (`supabase/migrations/0004_mentorship_workflows.sql`).
2. TypeScript types stand-in for `mentor_profiles` and `mentorship_requests` in `src/types/database.ts`.
3. Service layer `src/services/mentorship.ts` with offline-first in-memory store matching Phase 8–12 architecture.
4. User interface modals:
   - `src/components/BookSessionModal.tsx` for requesting mentorship.
   - `src/components/MentorApplicationModal.tsx` for registering as a mentor.
   - `src/components/MentorRequestsModal.tsx` for mentors to review incoming requests.
5. Upgrade `MentorCard` in `src/components/cards.tsx` and `src/pages/MentorshipPage.tsx` with live actions, progressive access gating, and verification prompt.
6. Automated Vitest suite `src/test/mentorship-workflows.test.ts` verifying all functional rules.

---

## 2. Tasks Breakdown

- [x] **Task 13.1: Database Migration & Types**
  - Author `supabase/migrations/0004_mentorship_workflows.sql`.
  - Define `public.mentor_profiles` (id, experience, topics, availability, is_active, timestamps).
  - Define `public.mentorship_requests` (id, mentor_id, student_id, topic, goals_note, preferred_time, status, created_at, updated_at).
  - Add constraints (`check_no_self_mentorship`), cascade deletes, indexes, and updated_at triggers.
  - Write Row Level Security (RLS) policies enforcing progressive access and mentor response isolation.
  - Update `src/types/database.ts` with TypeScript contracts for both tables.

- [x] **Task 13.2: Mentorship Service Layer**
  - Create `src/services/mentorship.ts` with:
    - `fetchMentors(query?)`: Hybrid fetch combining database + seed mentors.
    - `registerMentorProfile(userId, profile, isVerified)`: Progressive access check.
    - `requestMentorshipSession(mentorId, studentId, studentInfo, requestData, isVerified)`: Progressive access & self-mentorship checks.
    - `fetchMentorshipRequests(userId, role)`: Fetch sent or received requests.
    - `respondToMentorshipRequest(requestId, mentorId, status)`: Accept or reject session request.

- [x] **Task 13.3: Interactive UI Modals & Cards**
  - Create `src/components/BookSessionModal.tsx`.
  - Create `src/components/MentorApplicationModal.tsx`.
  - Create `src/components/MentorRequestsModal.tsx`.
  - Upgrade `MentorCard` in `src/components/cards.tsx` to handle live booking modal, requested badge, and verification interception.

- [x] **Task 13.4: Mentorship Page Integration**
  - Wire `src/pages/MentorshipPage.tsx` to `fetchMentors()`.
  - Connect search field across name, company, role, skills, and topics.
  - Add "Become a Mentor" button opening `MentorApplicationModal` with progressive access check.
  - Add "Review Requests (N)" button when user is a mentor with incoming requests.
  - Wire `VerificationModal` for unverified students.

- [x] **Task 13.5: Automated Vitest Test Suite & Verification**
  - Write `src/test/mentorship-workflows.test.ts`.
  - Cover progressive access restriction, self-mentorship check, booking creation, mentor review lifecycle (accept/reject), and unauthorized access protection.
  - Run `npm test`, `npm run lint`, and `npm run build` with zero errors.

---

## 3. Acceptance Criteria

- **AC-13.1**: PostgreSQL migration `0004_mentorship_workflows.sql` exists and contains correct DDL, constraints, indexes, and RLS policies.
- **AC-13.2**: `src/types/database.ts` includes `mentor_profiles` and `mentorship_requests` tables.
- **AC-13.3**: Unverified users can browse mentors but are blocked from booking a session or registering as a mentor, triggering `VerificationModal`.
- **AC-13.4**: Students cannot request mentorship from themselves (`check_no_self_mentorship`).
- **AC-13.5**: Verified students can successfully submit a session request with topic, goals note, and preferred timeframe.
- **AC-13.6**: Mentors can view incoming requests and accept or decline them.
- **AC-13.7**: Only the targeted mentor has permission to accept or decline a request.
- **AC-13.8**: Verified students or alumni can register as a mentor via `MentorApplicationModal`.
- **AC-13.9**: Vitest test suite passes all tests with zero failures.
- **AC-13.10**: `npm run build` completes cleanly with 0 TypeScript/Vite errors.
