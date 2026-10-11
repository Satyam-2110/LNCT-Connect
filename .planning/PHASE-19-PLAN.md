# Phase 19 Plan: Functionality, Admin & Realtime Polish

**Milestone**: Milestone 4 — Code Hardening & Reliability  
**Phase**: Phase 19 (Priority 4: Functionality, Admin & Realtime Polish)  
**Status**: Completed & Verified (116/116 tests passing)  
**Dependencies**: Completed Phase 16, Phase 17, Phase 18 (Migrations 0001–0010)  

---

## 1. Objectives & Scope

Deliver critical functionality repairs, administrative opportunity management, live Supabase Realtime channel subscriptions, global ThemeProvider wiring, and offline profile-edit state synchronization:

1. **Admin Opportunity Management**:
   - Author forward migration `supabase/migrations/0010_admin_opportunities_rls.sql` providing `UPDATE` and `DELETE` Row Level Security policies on `public.opportunities` strictly for `role = 'admin'`.
   - Implement admin opportunity CRUD (`createOpportunity`, `updateOpportunity`, `deleteOpportunity`) in `src/services/opportunities.ts` and `src/services/admin.ts` with strict administrator authorization guards.
   - Provide an Opportunities Management interface in `AdminPage.tsx` (create, edit, delete opportunities) and add an admin quick-action in `OpportunitiesPage.tsx`.

2. **Supabase Realtime Channel Subscriptions**:
   - Implement `subscribeToMessages(conversationId, callback)` in `src/services/messaging.ts` and wire dynamic message arrival into `MessagesPage.tsx`.
   - Implement `subscribeToNotifications(userId, callback)` in `src/services/notifications.ts` and wire dynamic notifications arrival into `NotificationsDrawer.tsx` / `AppShell`.
   - Ensure clean subscription teardown (`unsubscribe` / `removeChannel`) to prevent memory leaks and zombie listeners.

3. **Global ThemeProvider Wiring**:
   - Wrap the application tree in `src/App.tsx` with `<ThemeProvider>` from `src/lib/theme.tsx`.
   - Validate theme toggle persistence in `localStorage`, `data-theme` attribute synchronization on `document.documentElement`, and correct contrast across dark and light palettes.

4. **Profile Edit Synchronization**:
   - Update `src/services/profiles.ts` and `src/context/AuthContext.tsx` to maintain updated profile state across both online Supabase queries and offline development modes.
   - Refactor `EditProfileModal.tsx` ensuring form submission cleanly reflects changes in active session state and triggers UI re-renders without stale state or lag.

5. **Automated Verification Suite**:
   - Author `src/test/functionality-admin-realtime.test.ts` validating:
     - Admin opportunity CRUD operations & non-admin rejection guards.
     - Realtime subscription setup, event processing, and channel teardown.
     - Offline and online profile update synchronization.
     - Theme context contract.

---

## 2. Tasks Breakdown

- [x] **Task 19.1: Migration 0010 for Admin Opportunities RLS**
  - Author `supabase/migrations/0010_admin_opportunities_rls.sql`.
  - Add RLS `UPDATE` policy on `public.opportunities` for `role = 'admin'`.
  - Add RLS `DELETE` policy on `public.opportunities` for `role = 'admin'`.

- [x] **Task 19.2: Admin Opportunity CRUD Services & UI**
  - Add `createOpportunity`, `updateOpportunity`, `deleteOpportunity` in `src/services/opportunities.ts`.
  - Add administrative wrappers and types in `src/services/admin.ts`.
  - Add Opportunities management tab in `src/pages/AdminPage.tsx`.
  - Connect admin quick-action in `src/pages/OpportunitiesPage.tsx`.

- [x] **Task 19.3: Realtime Subscriptions in Messaging & Notifications**
  - Implement `subscribeToMessages` in `src/services/messaging.ts`.
  - Connect live message stream in `src/pages/MessagesPage.tsx`.
  - Implement `subscribeToNotifications` in `src/services/notifications.ts`.
  - Connect live notification stream in `src/components/NotificationsDrawer.tsx`.

- [x] **Task 19.4: Global ThemeProvider Wiring & Profile Edit Synchronization**
  - Wrap application in `src/App.tsx` with `<ThemeProvider>`.
  - Support offline store update and synchronization in `src/services/profiles.ts` and `src/context/AuthContext.tsx`.
  - Verify and polish `EditProfileModal.tsx`.

- [x] **Task 19.5: Automated Test Expansion & Verification**
  - Author `src/test/functionality-admin-realtime.test.ts`.
  - Run `npm test` verifying all suites pass (116/116 tests passing).
  - Run `npm run build` verifying clean compilation and zero TypeScript errors.

---


## 3. Measurable Acceptance Criteria

- **AC-19.1**: `0010_admin_opportunities_rls.sql` enables update/delete permissions solely for platform administrators.
- **AC-19.2**: Administrators can create, edit, and delete opportunities in both live and mock stores with authorization enforcement.
- **AC-19.3**: Realtime subscriptions receive and process PostgreSQL change events with verified cleanup on unmount.
- **AC-19.4**: `ThemeProvider` is active at the root, enabling light/dark toggling without undefined context fallbacks.
- **AC-19.5**: Editing profile fields synchronizes immediately to `AuthContext` and persists across the user interface.
- **AC-19.6**: 100% test pass rate across all vitest suites with zero TypeScript errors.
