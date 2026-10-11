# Phase 11 Context: Community Feed, Posts, Comments & Reactions

**Milestone**: Milestone 3 — Backend MVP  
**Phase**: Phase 11 (Persistent Posts, Threaded Comments, Reactions, Bookmarks & Feed RLS)  
**Status**: Decisions Locked & Plan Formulated  

---

## 1. Executive Summary & Objective

Phase 11 connects LNCT Connect's home feed and student interactions to the real PostgreSQL database. It introduces schema and services for publishing campus updates, managing top-level comments, toggling post reactions (likes) and saved bookmarks, enforcing author ownership permissions (editing and deleting own content), and progressive access gating (unverified students browse in read-only mode while writing prompts verification).

---

## 2. Locked Decisions

### Decision 1: Feed Source & Seed Strategy
- **Choice**: Hybrid Campus Feed.
- **Specification**:
  - Live posts stored in `public.posts` are queried in real-time, ordered with latest updates first.
  - Live posts are augmented with curated campus seed posts from `src/data/posts.ts` (avoiding ID collisions) to ensure the feed remains active and engaging during initial rollout.
  - New posts published by users immediately appear at the top of the stream.

### Decision 2: Comment Architecture
- **Choice**: Single-Level Direct Comments.
- **Specification**:
  - Posts support direct comments with author details (name, avatar, branch/year), creation timestamp, and comment content.
  - Authors can delete their own comments.
  - Clean, responsive design optimized for mobile and desktop without excessive nested indentation complexity.

### Decision 3: Progressive Access Verification Gating
- **Choice**: Full Progressive Access Gating.
- **Specification**:
  - Unverified authenticated users can browse the entire campus feed, view posts, read comments, and inspect reactions in read-only mode.
  - Writing actions (publishing a post, submitting a comment, toggling a like) check verification status:
    - If unverified, the action is intercepted and opens the `VerificationModal` prompting enrollment proof submission.
    - If bypassed client-side, database Row Level Security (RLS) policies on `posts`, `comments`, and `reactions` enforce that only verified accounts can perform `INSERT` operations.

### Decision 4: Author Ownership & Deletion Controls
- **Choice**: Author-Restricted Modifying / Deleting with RLS.
- **Specification**:
  - Post creators have a `•••` options menu on their posts allowing them to delete (or edit) their post.
  - Other users do not see delete controls for foreign posts.
  - Database RLS strictly enforces `auth.uid() = author_id` for `UPDATE` and `DELETE` queries on `posts` and `comments`.

---

## 3. Deliverables for Phase 11

1. **Database Migration (`supabase/migrations/0002_posts_and_interactions.sql`)**:
   - `public.posts`, `public.comments`, `public.post_reactions`, and `public.post_bookmarks` tables.
   - Foreign key constraints, cascading deletes, performance indexes, and strict RLS policies with progressive access checks.
2. **Database Types Updates (`src/types/database.ts`)**:
   - Added TypeScript interfaces for `posts`, `comments`, `post_reactions`, and `post_bookmarks`.
3. **Posts & Interactions Service (`src/services/posts.ts`)**:
   - Typed CRUD methods: `fetchFeed()`, `createPost()`, `deletePost()`, `fetchComments()`, `createComment()`, `deleteComment()`, `toggleLike()`, and `toggleBookmark()`.
   - Dev-mode fallback store supporting full offline testing when Supabase credentials are pending.
4. **Interactive Feed UI Components**:
   - Post composer wired to active authenticated user with hashtag chips and verification prompt.
   - `PostCard` updated in `src/components/cards.tsx` with live like toggle, real comment expansion list with author info and submit form, delete post menu for authors, and bookmark toggle.
5. **Feed & Saved Filter in `src/pages/HomePage.tsx`**:
   - Real-time post feed with tag filtering and "Saved items" view.
6. **Automated Unit & Integration Test Suite (`src/test/posts-and-feed.test.ts`)**:
   - Vitest tests covering post creation, progressive access verification gating, author deletion rights, like toggle idempotency, comment submission, and hashtag filtering.
