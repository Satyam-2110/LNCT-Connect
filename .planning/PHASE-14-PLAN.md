# Phase 14 Plan: Private Messaging & Realtime Notifications

**Milestone**: Milestone 3 — Backend MVP  
**Phase**: Phase 14 (Participant-Isolated 1-on-1 Direct Messaging, Read Receipts & Campus Notifications)  
**Status**: Completed & Verified  

---

## 1. Objectives & Scope

Deliver real private direct messaging and notification tracking for LNCT Connect:
1. PostgreSQL migration (`supabase/migrations/0005_messaging_and_notifications.sql`).
2. Update TypeScript database contracts in `src/types/database.ts`.
3. Create `src/services/messaging.ts` and `src/services/notifications.ts` with offline fallback stores matching Phases 8–13.
4. Build `src/components/NotificationsDrawer.tsx` and connect the Bell button in `src/components/layout.tsx`.
5. Upgrade `src/pages/MessagesPage.tsx` with live thread selection, realtime message sending, progressive access verification gating, and unread management.
6. Automated Vitest suite `src/test/messaging-and-notifications.test.ts` verifying all requirements.

---

## 2. Tasks Breakdown

- [x] **Task 14.1: Database Migration & Types**
  - Author `supabase/migrations/0005_messaging_and_notifications.sql`.
  - Define `public.conversations` (id, participant_one, participant_two, created_at, updated_at).
  - Define `public.messages` (id, conversation_id, sender_id, content, is_read, created_at).
  - Define `public.notifications` (id, recipient_id, actor_id, type, title, message, link, is_read, created_at).
  - Add constraints (`check_distinct_participants`), indexes, cascade deletes, updated_at triggers, and RLS policies.
  - Update `src/types/database.ts` with TypeScript contracts for all 3 tables.

- [x] **Task 14.2: Messaging & Notifications Service Layer**
  - Create `src/services/messaging.ts`:
    - `fetchConversations(userId)`: Merges live database threads with seed conversations.
    - `getOrCreateConversation(userOneId, userTwoId, isVerified)`: Progressive access check.
    - `fetchMessages(conversationId)`: Returns chronological messages.
    - `sendMessage(conversationId, senderId, content, isVerified)`: Progressive access check and timestamp updates.
    - `markConversationRead(conversationId, userId)`: Updates unread receipts.
  - Create `src/services/notifications.ts`:
    - `fetchNotifications(userId)`: Returns unread and recent notifications.
    - `markNotificationRead(notificationId, userId)`.
    - `markAllNotificationsRead(userId)`.
    - `createNotification(data)`.

- [x] **Task 14.3: Interactive UI Notifications Drawer & Header Integration**
  - Create `src/components/NotificationsDrawer.tsx` displaying notification cards with type icons, timestamps, and mark-as-read actions.
  - Update `src/components/layout.tsx` to wire the Bell `IconButton` with live unread counter and drawer toggle.

- [x] **Task 14.4: Messages Page Integration**
  - Refactor `src/pages/MessagesPage.tsx` to consume `fetchConversations()` and `fetchMessages()`.
  - Support sending messages via `sendMessage()`, updating thread preview and message stream.
  - Wire progressive access verification interception via `VerificationModal`.
  - Add "Start Conversation" / peer search capability.

- [x] **Task 14.5: Automated Vitest Test Suite & Verification**
  - Author `src/test/messaging-and-notifications.test.ts`.
  - Cover progressive access restriction, participant isolation, message delivery, read receipt toggling, and notification clearing.
  - Run `npm test`, `npm run lint`, and `npm run build` with zero errors.

---

## 3. Acceptance Criteria

- **AC-14.1**: Migration `0005_messaging_and_notifications.sql` contains correct schemas, constraints, indexes, and RLS policies.
- **AC-14.2**: Database contracts in `src/types/database.ts` reflect `conversations`, `messages`, and `notifications`.
- **AC-14.3**: Unverified users can read conversations/notifications in read-only mode, but sending messages prompts `VerificationModal` and is blocked by service and database RLS.
- **AC-14.4**: Self-conversations (`participant_one = participant_two`) are blocked.
- **AC-14.5**: Messages sent in a thread persist, update the thread preview and timestamp, and appear chronologically.
- **AC-14.6**: Only conversation participants can view thread messages (participant isolation).
- **AC-14.7**: Header Bell icon displays live unread notification badge and opens `NotificationsDrawer`.
- **AC-14.8**: Notifications can be marked as read individually or all at once.
- **AC-14.9**: All Vitest test suites pass (`npm test`) with zero failures.
- **AC-14.10**: Production build (`tsc -b && vite build`) completes cleanly with 0 TypeScript/Vite errors.
