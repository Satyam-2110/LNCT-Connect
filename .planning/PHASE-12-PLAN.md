# Phase 12 Plan: Projects, Collaboration & Opportunities

**Milestone**: Milestone 3 — Backend MVP  
**Phase**: Phase 12  
**Status**: Completed & Verified  
**Dependencies**: Completed Phases 8, 9, 10 & 11  

---

## 1. Executive Summary & Scope

Phase 12 delivers campus project building, team recruitment, join requests, and the opportunities board. It provides:
- Migration `0003_projects_and_opportunities.sql` with tables, indexes, and progressive access RLS policies.
- Strongly-typed database contracts in `src/types/database.ts`.
- `src/services/projects.ts` managing project lifecycle, member registration, join applications, and applicant review.
- `src/services/opportunities.ts` managing opportunity listings and private bookmark saving.
- `CreateProjectModal.tsx` for publishing new student initiatives.
- `ProjectApplicationsModal.tsx` for team leads to review, accept, and decline candidate applications.
- Enhanced `ProjectCard` and `OpportunityCard` with live status tracking and progressive access guards.
- Live integration with `ProjectsPage.tsx` and `OpportunitiesPage.tsx`.
- Vitest test suite (`src/test/projects-and-collaboration.test.ts`) validating project workflows, permission rules, and progressive access.

---

## 2. Work Breakdown & Action Tasks

| Task | Component | Description | Target Files |
|---|---|---|---|
| **Task 12.1** | Database Migration & Types | Author `0003_projects_and_opportunities.sql` with tables, indexes, triggers, and RLS; update `src/types/database.ts`. | `supabase/migrations/0003_projects_and_opportunities.sql`, `src/types/database.ts` |
| **Task 12.2** | Projects & Opportunities Services | Build `src/services/projects.ts` and `src/services/opportunities.ts` with progressive access checks and dev-mode fallback stores. | `src/services/projects.ts`, `src/services/opportunities.ts` |
| **Task 12.3** | Project Modals & Workflows | Create `CreateProjectModal.tsx` and `ProjectApplicationsModal.tsx`. | `src/components/CreateProjectModal.tsx`, `src/components/ProjectApplicationsModal.tsx` |
| **Task 12.4** | Card & Page Integration | Update `ProjectCard` and `OpportunityCard` in `cards.tsx`; wire live queries, filters, and modals in `ProjectsPage.tsx` and `OpportunitiesPage.tsx`. | `src/components/cards.tsx`, `src/pages/ProjectsPage.tsx`, `src/pages/OpportunitiesPage.tsx` |
| **Task 12.5** | Automated Tests & Verification | Author `src/test/projects-and-collaboration.test.ts`, run Vitest test suite, lint, and build. | `src/test/projects-and-collaboration.test.ts`, Repository-wide |

---

## 3. Measurable Acceptance Criteria

- [x] **AC-12.1**: `supabase/migrations/0003_projects_and_opportunities.sql` defines `projects`, `project_members`, `project_applications`, `opportunities`, and `opportunity_bookmarks` with foreign keys, indexes, and progressive access RLS policies.
- [x] **AC-12.2**: `src/types/database.ts` includes TypeScript definitions matching all 5 new tables.
- [x] **AC-12.3**: `src/services/projects.ts` provides typed functions to fetch projects, create projects, apply to projects, retrieve pending applications, respond to applications, and delete projects.
- [x] **AC-12.4**: `src/services/opportunities.ts` provides typed functions to fetch opportunities and toggle private opportunity bookmarks.
- [x] **AC-12.5**: Progressive access verification is strictly enforced: unverified users cannot publish projects or submit join applications; attempts trigger `VerificationModal`.
- [x] **AC-12.6**: Self-application (`applicant_id = project.creator_id`) is prevented at both client and database levels.
- [x] **AC-12.7**: `CreateProjectModal.tsx` enables students to publish projects with tech stack and role requirements, immediately adding the creator as team owner.
- [x] **AC-12.8**: Project creators can review candidate applications via `ProjectApplicationsModal.tsx` with instant Accept and Decline actions.
- [x] **AC-12.9**: `ProjectsPage.tsx` and `OpportunitiesPage.tsx` support live faceted search, status/tech/category filtering, and persistent bookmarking.
- [x] **AC-12.10**: Automated unit & integration tests (`src/test/projects-and-collaboration.test.ts`) pass with 100% success (11/11 passing).
- [x] **AC-12.11**: Production build (`tsc -b && vite build`) and lint pass with 0 errors.
