# Phase 17 Plan: Authentication & Verification Integrity

**Milestone**: Milestone 4 — Code Hardening & Reliability  
**Phase**: Phase 17 (Priority 2: Authentication & Verification Integrity)  
**Status**: Completed  
**Dependencies**: Completed Phase 16 (Migrations 0001–0007)  

---

## 1. Objectives & Scope

Guarantee end-to-end reliability, atomic consistency, and privacy protection across authentication, profile hydration, and student verification workflows:

1. **Verification Submission Consistency**:
   - Implement database trigger `AFTER INSERT ON public.verification_requests` to transition `profiles.verification_status` to `'pending'` securely inside PostgreSQL via `SECURITY DEFINER`.
   - Update `submitVerification` in `src/context/AuthContext.tsx` to insert the request and rely on the database trigger, eliminating prohibited client-side profile update calls.
2. **Admin Verification Review Fix**:
   - Fix `reviewVerification` in `src/services/admin.ts` to return the real database result rather than falling through to mock queue lookup on live Supabase.
3. **Signup & Session Profile Hydration**:
   - Refactor `AuthContext.tsx` initialization so `loading` remains true until initial profile resolution finishes.
   - Implement robust retry/poll logic (`fetchProfileWithRetry`) to handle asynchronous profile creation delay after `signUpWithEmail` without race condition dropouts.
4. **Password Recovery Error Handling**:
   - Inspect `error` returned from `supabase.auth.resetPasswordForEmail(...)`.
   - Surface genuine network errors and rate limits (`over_email_send_rate_limit`), while preserving email enumeration safety for non-existent accounts.
5. **Comprehensive Verification & Integrity Tests**:
   - Expand automated test suites verifying all authentication and verification lifecycle guarantees.

---

## 2. Tasks Breakdown

- [x] **Task 17.1: Forward Migration for Verification Request Trigger**
  - Author `supabase/migrations/0008_verification_and_auth_integrity.sql`.
  - Add `handle_new_verification_request` function and `AFTER INSERT ON public.verification_requests` trigger to synchronize `profiles.verification_status` to `'pending'`.
  - Ensure function executes as `SECURITY DEFINER` with fixed `search_path = public`.

- [x] **Task 17.2: AuthContext Verification Submission & Hydration Hardening**
  - Update `submitVerification` in `src/context/AuthContext.tsx`:
    - Remove direct `.from('profiles').update(...)` call.
    - Insert into `verification_requests` and call `refreshProfile()`.
  - Refactor `initAuth` in `src/context/AuthContext.tsx`:
    - Guarantee `loading` remains true until `fetchProfile` completes.
  - Implement `fetchProfileWithRetry` in `src/context/AuthContext.tsx`:
    - Poll with exponential backoff on user signup until `handle_new_user` trigger creates the profile.
  - Harden `resetPassword` in `src/context/AuthContext.tsx`:
    - Detect rate limits and network errors while preserving email enumeration safety.

- [x] **Task 17.3: Admin Verification Review Return Fix**
  - Update `reviewVerification` in `src/services/admin.ts`:
    - In live Supabase mode, map and return the real `updatedReq` with updated status, notes, and timestamp immediately.
    - Prevent falling through to mock queue lookup when connected to database.

- [x] **Task 17.4: Automated Test Expansion & Verification**
  - Expand `src/test/security-and-auth.test.ts` with tests for:
    - Verification submission trigger consistency.
    - Password recovery error classification (rate limits, network errors, privacy protection).
    - Profile hydration with retry logic.
    - Admin review live return mapping.
  - Run `npm test` verifying all test suites pass (98/98 tests passing).
  - Run `npm run build` verifying clean compilation and zero TypeScript errors.

---

## 3. Measurable Acceptance Criteria

- **AC-17.1**: `supabase/migrations/0008_verification_and_auth_integrity.sql` automatically transitions `profiles.verification_status` to `'pending'` on `verification_requests` insertion.
- **AC-17.2**: `submitVerification` succeeds without attempting prohibited client-side updates on `public.profiles`.
- **AC-17.3**: `reviewVerification` returns live database results when connected to Supabase without falling through to mock store.
- **AC-17.4**: `AuthContext` keeps `loading` true until initial profile resolution completes or session is determined.
- **AC-17.5**: `resetPassword` reports rate limits and connection errors without leaking user existence.
- **AC-17.6**: All automated test suites pass cleanly (`npm test`) with zero failures.
