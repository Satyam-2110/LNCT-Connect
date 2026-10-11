# Phase 16 Plan: Database Security & RLS Hardening

**Milestone**: Milestone 4 — Code Hardening & Reliability  
**Phase**: Phase 16 (Priority 1: Database Security & RLS Hardening)  
**Status**: Completed  
**Dependencies**: Completed Milestone 3 (Migrations 0001–0006)  

---

## 1. Objectives & Scope

Remediate all verified database authorization vulnerabilities and integrity risks across PostgreSQL schema and Row Level Security policies via a forward-only migration and rigorous negative test coverage:

1. **Conversation Participant Immutability**: Prohibit updates to `participant_one` or `participant_two` on `public.conversations` so attackers cannot hijack existing conversation threads or replace participants.
2. **Message Sender & Content Spoofing Prevention**: Narrow `public.messages` UPDATE policy so participants can ONLY update `is_read = true`, strictly prohibiting alterations to `content`, `sender_id`, or `conversation_id`.
3. **Notification Creation Lockdown**: Harden `public.notifications` INSERT policy so `actor_id` must equal `auth.uid()`, preventing members from creating spoofed notifications on behalf of others.
4. **Profile Privilege Escalation Prevention**: Harden `public.profiles` UPDATE policy with explicit `WITH CHECK (auth.uid() = id)` and safeguard `protect_profile_fields` trigger against role and verification tampering.
5. **Connection Request Authorization & Deduplication**:
   - Strictly prohibit self-acceptance by requesters: only `receiver_id` can transition connection status to `'accepted'` or `'rejected'`.
   - Prevent reciprocal duplicate connections by introducing a unique index on `(LEAST(requester_id, receiver_id), GREATEST(requester_id, receiver_id))`.
6. **Negative Security Test Suite**: Expand automated test suite in `src/test/security-hardening.test.ts` to test all prohibited operations and verify failure conditions.

---

## 2. Tasks Breakdown

- [x] **Task 16.1: Forward Migration for Database Security Hardening**
  - Author `supabase/migrations/0007_security_and_rls_hardening.sql`.
  - Add trigger or RLS check preventing modification of `participant_one` and `participant_two` on `public.conversations`.
  - Drop and recreate `public.messages` UPDATE policy:
    - Restrict updates to only allow changing `is_read` to `true`.
    - Prohibit changes where `NEW.content <> OLD.content`, `NEW.sender_id <> OLD.sender_id`, or `NEW.conversation_id <> OLD.conversation_id`.
  - Drop and recreate `public.notifications` INSERT policy:
    - Enforce `WITH CHECK (auth.uid() = actor_id)`.
  - Update `public.profiles` UPDATE policy to include explicit `WITH CHECK (auth.uid() = id)`.
  - Drop and recreate `public.connections` UPDATE policy:
    - Allow only `receiver_id = auth.uid()` to update status when `status = 'pending'`.
  - Create unique bilateral index:
    - `CREATE UNIQUE INDEX IF NOT EXISTS idx_connections_bilateral_unique ON public.connections (LEAST(requester_id, receiver_id), GREATEST(requester_id, receiver_id));`

- [x] **Task 16.2: Service Layer Connection Authorization Hardening**
  - Update `respondToConnectionRequest` in `src/services/connections.ts`:
    - Require `currentUserId` parameter.
    - Check that only the receiver can accept or reject a pending connection request.
    - Prevent requester self-acceptance in mock store and live Supabase queries.
  - Update `sendConnectionRequest` in `src/services/connections.ts`:
    - Check bidirectional existing relationship before attempting insert.
    - Return a friendly error if a pending or accepted connection already exists in either direction.

- [x] **Task 16.3: Negative Security Test Suite Expansion**
  - Expand `src/test/security-hardening.test.ts` with dedicated test suites:
    - Test: Requesters cannot self-accept their own connection request.
    - Test: Bidirectional duplicate connection requests are blocked.
    - Test: Message content and sender cannot be spoofed or mutated post-creation.
    - Test: Non-admin users cannot escalate role or verification status.
    - Test: Notification actors cannot be spoofed to impersonate other users.
    - Test: Conversation participants cannot be modified post-creation.

- [x] **Task 16.4: Verification & Integrity Check**
  - Run `npm test` verifying all suites pass (87/87 tests passing).
  - Run `npm run build` verifying clean compilation and zero TypeScript errors.

---

## 3. Measurable Acceptance Criteria

- **AC-16.1**: `supabase/migrations/0007_security_and_rls_hardening.sql` cleanly applies all forward security constraints, policies, and indexes without destructive operations.
- **AC-16.2**: Senders or other participants cannot alter message `content` or `sender_id` after message creation.
- **AC-16.3**: Notifications cannot be inserted with an `actor_id` different from the authenticated user's ID.
- **AC-16.4**: Requesters cannot accept their own pending connection request.
- **AC-16.5**: Reverse duplicate connection requests between the same two users are prohibited by database constraints and service validation.
- **AC-16.6**: All automated negative security tests pass (`npm test`) with zero failures.
