# Phase 9 Context: Authentication, Persistent Sessions & Student Verification

**Milestone**: Milestone 3 — Backend MVP  
**Phase**: Phase 9  
**Status**: Decisions Locked & Plan Formulated  

---

## 1. Executive Summary & Objective

Phase 9 integrates real Supabase Auth into LNCT Connect. It replaces simulated client-side login with genuine Supabase email/password authentication, persistent sessions, route protection, profile hydration, and the multi-tier LNCT student verification workflow.

---

## 2. Locked Decisions

### Decision 1: Platform Access & Verification Policy
- **Choice**: Progressive Access Policy.
- **Specification**:
  - **Unverified Users**: Can explore public campus discovery, feeds, projects, and opportunities in read-only mode, and view their own profile.
  - **Verified Users**: Possess full interactive privileges (creating posts, commenting, sending connection requests, applying to projects, messaging peers, and booking mentors).
  - **Verification Tiers**:
    - *Tier 1 (Instant)*: Users who register with an institutional `@lnct.ac.in` email are automatically set to `verification_status: 'verified'` by the database trigger upon email confirmation.
    - *Tier 2 (Admin Review)*: Users registering with personal emails (`@gmail.com`, etc.) submit their enrollment number and ID details into `verification_requests` (status: `pending`).
  - **Verification Banner**: An elegant, dismissible/docked campus banner notifies unverified users of their read-only state and provides a single-click modal to submit their enrollment verification.

### Decision 2: Password Recovery Workflow
- **Choice**: Dedicated In-Page Interactive Modal on `/login`.
- **Specification**:
  - Clicking "Forgot password?" opens a sleek dialog styled with the LNCT alabaster and charcoal visual system.
  - Submitting an email calls `supabase.auth.resetPasswordForEmail()`.
  - Displays instant positive confirmation without leaking account existence.

### Decision 3: Local Development Fallback Behavior
- **Choice**: Graceful Development Fallback.
- **Specification**:
  - When `isSupabaseConfigured === false` (e.g. before developer pastes live Supabase credentials in `.env.local`), the Auth form displays a discrete dev badge explaining that the app is in local demo mode.
  - A mock demo session can be activated to permit testing interior routes and navigation without throwing errors or halting development.

### Decision 4: Protected Routes Architecture
- **Choice**: Declarative `<ProtectedRoute>` wrapper.
- **Specification**:
  - Wraps `/home`, `/people`, `/profile/:id`, `/projects`, `/opportunities`, `/mentorship`, `/messages`, `/settings`.
  - Unauthenticated access redirects to `/login` with `state: { from: location }`.
  - Authenticated users accessing `/login` or `/signup` automatically redirect to `/home`.

---

## 3. Deliverables for Phase 9

1. **Authentication Context (`src/context/AuthContext.tsx`)**:
   - Central React context managing `user`, `session`, `profile`, `isVerified`, `loading`, and methods: `signIn`, `signUp`, `signOut`, `resetPassword`, `submitVerification`.
2. **Protected Route Component (`src/components/ProtectedRoute.tsx`)**:
   - Guards authenticated routes with loading skeleton and login redirect.
3. **Auth Pages Integration (`src/pages/AuthPages.tsx`)**:
   - Connects Registration and Login forms to real Supabase Auth.
   - Form validation, error callouts, and institutional email detection (`@lnct.ac.in`).
   - Password reset modal dialog.
4. **Student Verification Modal & Banner (`src/components/VerificationModal.tsx`)**:
   - Submission form for enrollment number + ID proof storing in `public.verification_requests`.
5. **App Header & Session Synchronization (`src/components/layout.tsx` & `src/App.tsx`)**:
   - Dynamic user avatar/menu and real Sign Out flow in the top frosted header.
