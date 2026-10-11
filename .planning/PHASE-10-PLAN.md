# Phase 10 Plan: Profiles, Skills & Connections

**Milestone**: Milestone 3 — Backend MVP  
**Phase**: Phase 10  
**Status**: Completed & Verified  
**Dependencies**: Completed Phases 8 & 9  

---

## 1. Executive Summary & Scope

Phase 10 connects LNCT Connect's student directory and profile management to the PostgreSQL database. It delivers:
- Dynamic querying of student profiles and skills from `public.profiles` and `public.skills`.
- Campus directory discovery with full-text search and department/batch/skill filtering.
- Hybrid campus seed strategy ensuring the directory remains active and populated during initial rollout.
- Full peer-to-peer connection lifecycle: sending connection requests, tracking request status, accepting incoming requests, declining requests, and removing connections.
- Progressive access verification gating: unverified accounts are prevented from sending connection requests and prompted to submit student verification.
- In-page profile editing modal on `/profile/:id` allowing students to edit their bio, branch, graduation year, skills, and social URLs.
- Automated tests verifying connection rules, self-connection restrictions, and search filtering.

---

## 2. Work Breakdown & Action Tasks

| Task | Component | Description | Target Files |
|---|---|---|---|
| **Task 10.1** | Profiles Service | Functions to fetch student directory, fetch profile by ID, update profile, and synchronize profile skills. | `src/services/profiles.ts` |
| **Task 10.2** | Connections Service | Functions to query connection status, send connection requests, accept/decline requests, and fetch pending requests. | `src/services/connections.ts` |
| **Task 10.3** | Profile Editor Modal | Modal dialog on `/profile/:id` for modifying personal details, branch, skills, and portfolio/social links. | `src/components/EditProfileModal.tsx` |
| **Task 10.4** | People Directory Wiring | Add "Pending Requests" view tab and live directory filtering to `PeoplePage`. | `src/pages/PeoplePage.tsx` |
| **Task 10.5** | Card & Profile Sync | Update `StudentCard` and `ProfilePage` with live connection buttons, verification interceptor, and profile data hydration. | `src/components/cards.tsx`, `src/pages/ProfilePage.tsx` |
| **Task 10.6** | Test Suite & Validation | Create automated tests for connections and profile operations (`src/test/profiles-and-connections.test.ts`), verify lint and production build. | `src/test/profiles-and-connections.test.ts`, Repository-wide |

---

## 3. Measurable Acceptance Criteria

- [x] **AC-10.1**: `src/services/profiles.ts` provides typed queries to fetch student directories with search, branch, year, skill, and alumni filtering, merging live `public.profiles` with seed data.
- [x] **AC-10.2**: `src/services/connections.ts` manages connection operations (`send`, `accept`, `decline`, `remove`, `getStatus`) against `public.connections`.
- [x] **AC-10.3**: `EditProfileModal.tsx` provides an in-page modal dialog for students to update their bio, branch, batch, skills, location, and social links, updating `public.profiles`.
- [x] **AC-10.4**: `PeoplePage.tsx` integrates the live directory with faceted filters and features a "Pending Requests" tab allowing students to accept or decline incoming connections.
- [x] **AC-10.5**: `StudentCard` and `ProfilePage` show accurate contextual connection buttons (`Connect`, `Requested`, `Connected`), and intercept unverified connection attempts by opening `VerificationModal`.
- [x] **AC-10.6**: Progressive access is strictly enforced: unverified accounts cannot send connection requests, and self-connection (`requester_id = receiver_id`) is prevented.
- [x] **AC-10.7**: Automated unit test suite (`src/test/profiles-and-connections.test.ts`) passes with 100% success (14/14 total tests passing).
- [x] **AC-10.8**: Production build (`tsc -b && vite build`) and lint pass with 0 errors.
