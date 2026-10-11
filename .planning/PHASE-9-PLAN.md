# Phase 9 Plan: Authentication, Persistent Sessions & Student Verification

**Milestone**: Milestone 3 — Backend MVP  
**Phase**: Phase 9  
**Status**: Completed & Verified  
**Dependencies**: Completed Phase 8 (Backend Foundation & Supabase Setup)  

---

## 1. Executive Summary & Scope

Phase 9 transforms the LNCT Connect authentication interface into a fully functional, secure authentication system backed by Supabase Auth and PostgreSQL. It delivers:
- Real email/password registration and login with input validation and error handling.
- Persistent session management via `AuthContext`.
- Automatic profile hydration from `public.profiles`.
- Institutional email recognition (`@lnct.ac.in`) with automated instant verification.
- Verification submission workflow for personal emails (`verification_requests`).
- Password reset modal workflow.
- Route protection (`ProtectedRoute`) guarding internal campus views while keeping landing pages accessible.
- Dynamic navigation states (User initials, verification badge, and Sign Out).

---

## 2. Work Breakdown & Action Tasks

| Task | Component | Description | Target Files |
|---|---|---|---|
| **Task 9.1** | `AuthContext` | Global React authentication provider managing session, user, profile, verification status, and auth methods. | `src/context/AuthContext.tsx` |
| **Task 9.2** | `ProtectedRoute` | Route guard component redirecting unauthenticated users to `/login` and authenticated users away from auth pages. | `src/components/ProtectedRoute.tsx` |
| **Task 9.3** | `AuthPages` Wiring | Wire real signup, login, validation, domain detection (`@lnct.ac.in`), and in-page password reset modal. | `src/pages/AuthPages.tsx` |
| **Task 9.4** | Verification Workflow | Implement `VerificationModal` & `VerificationBanner` enabling unverified students to submit enrollment proofs. | `src/components/VerificationModal.tsx` |
| **Task 9.5** | App & Navigation Guard | Wrap routes in `App.tsx` with `AuthProvider` and `ProtectedRoute`, update `Navbar` to reflect user session and sign out. | `src/App.tsx`, `src/components/layout.tsx` |
| **Task 9.6** | Build & Verification | Run full build checks (`tsc -b && vite build`), test auth flows and fallback mode, confirm zero regressions. | Repository-wide |

---

## 3. Measurable Acceptance Criteria

- [x] **AC-9.1**: `AuthContext` provides real session state, user details, profile hydration from `public.profiles`, and auth actions (`signIn`, `signUp`, `signOut`, `resetPassword`, `submitVerification`).
- [x] **AC-9.2**: `AuthPage` for `/signup` performs real registration via `supabase.auth.signUp`, capturing full name, branch, and academic year, and displays domain-aware feedback for `@lnct.ac.in` addresses.
- [x] **AC-9.3**: `AuthPage` for `/login` performs real authentication via `supabase.auth.signInWithPassword`, with clear error messages on failure and smooth navigation on success.
- [x] **AC-9.4**: Forgot password dialog opens smoothly from `/login`, submits password recovery requests, and displays confirmation states.
- [x] **AC-9.5**: `ProtectedRoute` protects all internal routes, redirecting unauthenticated users to `/login` and redirecting authenticated users away from `/login`/`/signup`.
- [x] **AC-9.6**: Verification banner/modal allows unverified users to submit enrollment number and details into `public.verification_requests` with status set to `pending`.
- [x] **AC-9.7**: Header displays logged-in state (student initials/name, verification badge, and sign-out button) when authenticated, and "Log in" / "Join Network" when signed out.
- [x] **AC-9.8**: Development fallback mode allows testing without unhandled errors if Supabase environment variables are missing.
- [x] **AC-9.9**: Full production build (`tsc -b && vite build`) and lint pass with 0 errors.
- [x] **AC-9.10**: Progressive access database RLS policies and checks reject unauthorized write operations (such as connection requests) from unverified accounts, while keeping discovery read-only and verification documents strictly confidential.
- [x] **AC-9.11**: Password recovery validates email input, uses configured redirect URL (`VITE_SITE_URL`), and returns privacy-safe feedback without revealing whether an account exists.
- [x] **AC-9.12**: Missing credentials in local development display friendly setup instructions and return explicit unconfigured errors instead of falsely reporting success.
- [x] **AC-9.13**: Production environment strictly enforces credential presence (`import.meta.env.PROD` check), throwing fatal error if variables are missing.
- [x] **AC-9.14**: Automated security and authentication test suite (`src/test/security-and-auth.test.ts` via `npm test`) executes and passes with 100% success.

