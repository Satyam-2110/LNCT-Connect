# Phase 10 Context: Profiles, Skills & Connections

**Milestone**: Milestone 3 — Backend MVP  
**Phase**: Phase 10 (Dynamic Profiles, Skills Taxonomy, Directory Discovery & Connection Requests)  
**Status**: Decisions Locked & Plan Formulated  

---

## 1. Executive Summary & Objective

Phase 10 transitions the student directory and user profiles from static mock representations to a real PostgreSQL-backed system. It introduces dynamic profile querying, skill taxonomy management, full student and alumni discovery with faceted filtering, in-page profile editing, and an end-to-end peer connection request lifecycle (send, accept, decline, remove) governed by Row Level Security.

---

## 2. Locked Decisions

### Decision 1: Directory Discovery Experience
- **Choice**: Hybrid Campus Seed.
- **Specification**:
  - Live profiles stored in `public.profiles` are prioritized and queried in real-time.
  - To ensure the directory remains engaging and discoverable during initial onboarding (when the database may only contain the developer's single account), live database results are seamlessly augmented with campus seed profiles.
  - As more students register in the database, registered profiles naturally expand and take precedence.

### Decision 2: Connection Management Interface
- **Choice**: In-Directory Pending Requests Tab.
- **Specification**:
  - The `PeoplePage` (`/people`) includes an intuitive view switcher:
    1. **"Explore Network"**: Full student & alumni directory with search and multi-facet filters.
    2. **"Pending Requests"**: Dedicated view displaying all incoming connection requests with student details and instant "Accept" / "Decline" actions.
  - Peer cards also display accurate contextual status: `Connect` $\to$ `Requested` $\to$ `Connected`.

### Decision 3: Profile Editing Workflow
- **Choice**: In-Page Comprehensive Edit Modal.
- **Specification**:
  - On `/profile/:id`, clicking "Edit Profile" (visible only on the student's own profile) opens an editorial modal dialog.
  - Allows editing: Full Name, Branch, Academic Year/Batch, Bio, Campus Location, Company/Role, Skills (interactive chip tags), and Profile Links (GitHub, LinkedIn, Portfolio).
  - Persists directly to `public.profiles` and `public.profile_skills`, immediately synchronizing app state.

### Decision 4: Progressive Access Security Guard
- **Choice**: Database & Client Verification Check.
- **Specification**:
  - Unverified students can freely discover peers and view profiles in read-only mode.
  - Attempting to click "Connect" on any student card checks verification status:
    - If unverified, the action is gracefully intercepted and opens the `VerificationModal` prompting student ID submission.
    - If bypassed client-side, the PostgreSQL RLS policy on `public.connections` explicitly rejects the `INSERT` operation.

---

## 3. Deliverables for Phase 10

1. **Profiles Service (`src/services/profiles.ts`)**:
   - Queries `public.profiles` with skills, handles search & filtering, provides profile updates and skill associations.
2. **Connections Service (`src/services/connections.ts`)**:
   - Manages connection lifecycle (`send`, `accept`, `decline`, `remove`) and calculates connection status relative to the logged-in student.
3. **In-Page Profile Editor (`src/components/EditProfileModal.tsx`)**:
   - Full profile editing dialog with skill management and social links.
4. **Interactive People Directory (`src/pages/PeoplePage.tsx`)**:
   - Live query integration, "Pending Requests" management tab, and multi-facet filtering.
5. **Dynamic Student Cards & Profile View (`src/components/cards.tsx` & `src/pages/ProfilePage.tsx`)**:
   - Live connection state buttons with verification guard, dynamic profile data rendering, and edit modal integration.
6. **Automated Unit & Security Tests (`src/test/profiles-and-connections.test.ts`)**:
   - Validates connection lifecycle, self-connection prevention, unverified write rejection, and directory search logic.
