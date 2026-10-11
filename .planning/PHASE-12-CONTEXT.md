# Phase 12 Context: Projects, Collaboration & Opportunities

**Milestone**: Milestone 3 — Backend MVP  
**Phase**: Phase 12 (Campus Project Hub, Team Recruitment, Join Requests & Opportunities Board)  
**Status**: Decisions Locked & Plan Formulated  

---

## 1. Executive Summary & Objective

Phase 12 transforms the campus project catalog (`/projects`) and opportunity board (`/opportunities`) into real database-driven collaboration systems. It introduces:
- Version-controlled PostgreSQL migration (`supabase/migrations/0003_projects_and_opportunities.sql`) creating `projects`, `project_members`, `project_applications`, `opportunities`, and `opportunity_bookmarks`.
- Full-lifecycle team collaboration: project creation, teammate recruitment, join request applications, and creator review (accept / reject).
- Opportunities board with search, category filtering, and private bookmarking.
- Progressive access verification gating: unverified accounts browse in read-only mode, while project creation and team applications prompt the `VerificationModal`.
- Row Level Security (RLS) guaranteeing that only verified students can create projects or apply, only project creators can review applications or edit projects, and opportunity bookmarks are private.

---

## 2. Locked Decisions

### Decision 1: Project Creation Workflow
- **Choice**: In-Page Structured Creation Modal.
- **Specification**:
  - Clicking "Create Project" on `/projects` opens `CreateProjectModal`.
  - Captures: Project Name, Category (`Campus Tech`, `AI & Education`, `Community`, `Career`, `Social Impact`), Description, Tech Stack tags, Looking-For role tags, Development Status (`Ideation`, `Building`, `Launched`), and initial progress.
  - Automatically establishes the authenticated user as the project creator and owner in `public.project_members`.

### Decision 2: Team Recruitment & Join Requests
- **Choice**: Lightweight Join Request with Creator Review.
- **Specification**:
  - Students viewing open projects see contextual action buttons:
    - `Join team`: Prompts lightweight join request dialog with optional message.
    - `Requested`: Indicates join application is pending creator review.
    - `Joined`: Indicates student is an accepted team member.
  - Project creators see a "Review Applicants (N)" button on their own projects which opens `ProjectApplicationsModal` to accept or decline applicants.
  - Accepting an applicant automatically transitions their status to `accepted` and registers them into `public.project_members`.
  - Self-applications (`applicant_id = creator_id`) are blocked at both client and database levels.

### Decision 3: Catalog & Seed Strategy
- **Choice**: Hybrid Database & Curated Campus Seed.
- **Specification**:
  - Live projects and opportunities created in PostgreSQL take precedence.
  - Augmented with existing high-value seed projects (`src/data/projects.ts`) and opportunities (`src/data/opportunities.ts`) to ensure density during early campus adoption.
  - Full-text search and faceted filters (Tech Stack, Status, Category) apply across combined listings.

### Decision 4: Progressive Access Security Guard
- **Choice**: Verification Interception with RLS.
- **Specification**:
  - Unverified students can explore projects, inspect requirements, and browse opportunities in read-only mode.
  - Creating a project or applying to join a team checks `isVerified`. Unverified users are intercepted by `VerificationModal`.
  - Database RLS enforces `verification_status = 'verified'` on `INSERT` operations for `projects` and `project_applications`.

---

## 3. Deliverables for Phase 12

1. **Database Migration (`supabase/migrations/0003_projects_and_opportunities.sql`)**:
   - `public.projects`, `public.project_members`, `public.project_applications`, `public.opportunities`, `public.opportunity_bookmarks`.
   - Constraints, foreign keys, cascade deletes, indexes, updated_at triggers, and RLS policies.
2. **Database Types Updates (`src/types/database.ts`)**:
   - TypeScript definitions for the 5 new tables.
3. **Projects Service (`src/services/projects.ts`)**:
   - `fetchProjects()`, `createProject()`, `applyToProject()`, `fetchProjectApplications()`, `respondToApplication()`, `deleteProject()`.
4. **Opportunities Service (`src/services/opportunities.ts`)**:
   - `fetchOpportunities()`, `toggleOpportunityBookmark()`.
5. **Interactive UI Modals & Cards**:
   - `src/components/CreateProjectModal.tsx`: Project publishing dialog.
   - `src/components/ProjectApplicationsModal.tsx`: Review applicants modal for project creators.
   - `src/components/cards.tsx`: Upgraded `ProjectCard` with join workflow + applicant review, and upgraded `OpportunityCard` with real bookmarking.
6. **Page Integration**:
   - `src/pages/ProjectsPage.tsx`: Live projects querying, creation modal wiring, search & filter.
   - `src/pages/OpportunitiesPage.tsx`: Live opportunities querying, bookmark toggle, search & filter.
7. **Automated Unit & Integration Test Suite (`src/test/projects-and-collaboration.test.ts`)**:
   - Tests covering project publishing, progressive access gating, self-application prevention, application review (accept/reject), and opportunity bookmarking.
