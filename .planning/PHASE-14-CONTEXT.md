# Phase 14 Context: Private Messaging & Realtime Notifications

**Milestone**: Milestone 3 — Backend MVP  
**Phase**: Phase 14 (Participant-Isolated 1-on-1 Direct Messaging, Read Receipts & Campus Notifications)  
**Status**: Decisions Locked & Plan Formulated  

---

## 1. Executive Summary & Objective

Phase 14 delivers private direct communication and an active notification center for LNCT Connect. It enables students, project collaborators, and mentors to communicate 1-on-1 while keeping campus activities transparent via real-time alerts.
- Version-controlled PostgreSQL migration (`supabase/migrations/0005_messaging_and_notifications.sql`) creating `conversations`, `messages`, and `notifications`.
- TypeScript database contracts in `src/types/database.ts`.
- Direct messaging service (`src/services/messaging.ts`) supporting conversation threads, chronological message logs, unread counts, and mark-as-read receipts.
- Notifications service (`src/services/notifications.ts`) and interactive header drawer (`NotificationsDrawer.tsx`) with unread badge counter.
- Progressive access verification gating: unverified students browse in read-only mode, but initiating conversations or sending messages requires `isVerified === true` and prompts `VerificationModal`.
- Row Level Security (RLS) guaranteeing that direct messages and conversations are strictly participant-isolated (accessible only to `participant_one` and `participant_two`), and notifications are private to `recipient_id`.

---

## 2. Locked Decisions

### Decision 1: Participant-Isolated Conversation Model
- **Choice**: Canonical 2-Participant Thread (`public.conversations`).
- **Specification**:
  - Each conversation is uniquely identified by two participant profiles (`participant_one`, `participant_two`).
  - Constraint `check_distinct_participants` prevents self-conversations (`participant_one <> participant_two`).
  - Strict RLS restricts SELECT, INSERT, and UPDATE to the 2 participants only.

### Decision 2: Progressive Access & Anti-Spam Guard
- **Choice**: Verification Interception with RLS.
- **Specification**:
  - Unverified users can read incoming messages or browse threads in read-only mode.
  - Sending a message or starting a conversation requires institutional verification (`isVerified === true`).
  - Unverified attempts trigger `VerificationModal` client-side and are blocked by database RLS.

### Decision 3: Seed & Database Hybrid Thread Model
- **Choice**: Combined Live & Seed Conversations.
- **Specification**:
  - Live conversations created in PostgreSQL take precedence.
  - Augmented with existing seed conversations (`src/data/messages.ts` with Rahul Sharma, Nisha Verma, etc.) so the chat interface is rich and interactive out-of-the-box.
  - When messages are sent in a thread, the thread preview, timestamp, and message history update immediately.

### Decision 4: Interactive Notification Center
- **Choice**: Header Popover / Drawer (`NotificationsDrawer.tsx`).
- **Specification**:
  - The Bell icon in the header (`src/components/layout.tsx`) displays a live unread count indicator.
  - Clicking the Bell toggles `NotificationsDrawer` displaying recent activity (connection requests, mentorship sessions, project applications, and direct messages).
  - One-click "Mark all as read" clears the badge.

---

## 3. Deliverables for Phase 14

1. **Database Migration (`supabase/migrations/0005_messaging_and_notifications.sql`)**:
   - `public.conversations`, `public.messages`, `public.notifications`.
   - Foreign keys to `public.profiles`, constraints, indexes, triggers, and strict RLS policies.
2. **Database Types Updates (`src/types/database.ts`)**:
   - TypeScript definitions for the 3 new tables.
3. **Messaging & Notifications Services**:
   - `src/services/messaging.ts`: `fetchConversations()`, `getOrCreateConversation()`, `fetchMessages()`, `sendMessage()`, `markConversationRead()`.
   - `src/services/notifications.ts`: `fetchNotifications()`, `markNotificationRead()`, `markAllNotificationsRead()`, `createNotification()`.
4. **UI Components & Page Upgrades**:
   - `src/components/NotificationsDrawer.tsx`: Header activity drawer with unread badges.
   - `src/components/layout.tsx`: Wired Bell icon toggle, dynamic unread badge, and notifications drawer integration.
   - `src/pages/MessagesPage.tsx`: Live thread selection, message history stream, progressive access verification guard, and search.
5. **Automated Unit & Integration Test Suite (`src/test/messaging-and-notifications.test.ts`)**:
   - 10+ test scenarios covering progressive access, participant isolation, chronological message dispatch, read receipts, and notification management.
