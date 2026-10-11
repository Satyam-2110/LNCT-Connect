# Phase 11 Plan: Community Feed, Posts, Comments & Reactions

**Milestone**: Milestone 3 — Backend MVP  
**Phase**: Phase 11  
**Status**: Completed & Verified  
**Dependencies**: Completed Phases 8, 9 & 10  

---

## 1. Executive Summary & Scope

Phase 11 connects LNCT Connect's network stream (`/home`) to real database persistence. It introduces:
- Version-controlled PostgreSQL migration (`supabase/migrations/0002_posts_and_interactions.sql`) creating `posts`, `comments`, `post_reactions`, and `post_bookmarks`.
- Row Level Security (RLS) guaranteeing that public/unverified users have read-only access, only verified students can write/react/comment, and only authors can edit or delete their own contributions.
- Typed database interfaces in `src/types/database.ts`.
- Service layer (`src/services/posts.ts`) handling feed retrieval, post creation, post deletion, comment threads, reaction toggling, and bookmarking with offline dev store support.
- Live Post Composer on `HomePage` associated with the active student session, tag extraction, and verification guard.
- Upgraded `PostCard` in `src/components/cards.tsx` featuring real like toggling, live comment drawer (view comments + submit new comments with author metadata), author options menu (`•••` Delete post), and bookmark saving.
- Left sidebar "Saved items" quick filter in `HomePage`.
- Automated test suite (`src/test/posts-and-feed.test.ts`) validating post publishing, author deletion restrictions, like idempotency, comment submissions, and progressive access verification gating.

---

## 2. Work Breakdown & Action Tasks

| Task | Component | Description | Target Files |
|---|---|---|---|
| **Task 11.1** | Database Migration & Types | Author `0002_posts_and_interactions.sql` with tables, indexes, RLS, and triggers; update `src/types/database.ts`. | `supabase/migrations/0002_posts_and_interactions.sql`, `src/types/database.ts` |
| **Task 11.2** | Posts & Interaction Service | Build `src/services/posts.ts` covering `fetchFeed`, `createPost`, `deletePost`, `fetchComments`, `createComment`, `deleteComment`, `toggleLike`, and `toggleBookmark`. | `src/services/posts.ts` |
| **Task 11.3** | PostCard Interactive Features | Update `PostCard` with live like toggle, real comment expansion list with author info and submit form, delete post menu for authors, and bookmark toggle. | `src/components/cards.tsx` |
| **Task 11.4** | HomePage Live Feed Integration | Wire composer to authenticated user, support tag selection, wire saved posts filter, and display live post updates. | `src/pages/HomePage.tsx` |
| **Task 11.5** | Automated Tests & Verification | Create `src/test/posts-and-feed.test.ts` with 7+ tests verifying feed workflows, run full test suite, lint, and build. | `src/test/posts-and-feed.test.ts`, Repository-wide |

---

## 3. Measurable Acceptance Criteria

- [x] **AC-11.1**: `supabase/migrations/0002_posts_and_interactions.sql` defines `posts`, `comments`, `post_reactions`, and `post_bookmarks` with foreign keys, indexes, and progressive access RLS policies.
- [x] **AC-11.2**: `src/types/database.ts` includes TypeScript definitions matching the post, comment, reaction, and bookmark tables.
- [x] **AC-11.3**: `src/services/posts.ts` provides typed functions to fetch feed (merging database posts with seed posts), publish posts, delete posts, add/fetch/delete comments, toggle reactions, and toggle bookmarks.
- [x] **AC-11.4**: Progressive access verification is strictly enforced: unverified users attempting to publish posts, comment, or react receive an error or trigger the `VerificationModal`.
- [x] **AC-11.5**: Authorship ownership is enforced: only the creator of a post or comment can delete it.
- [x] **AC-11.6**: `PostCard` displays real likes, expands a interactive comment tray allowing commenting and viewing comments with author initials/branch, and provides a delete action for author's own posts.
- [x] **AC-11.7**: `HomePage` composer dynamically posts new updates to the feed, and the sidebar "Saved items" link filters bookmarked posts.
- [x] **AC-11.8**: Unit & integration test suite (`src/test/posts-and-feed.test.ts`) passes with 100% success (12/12 passing).
- [x] **AC-11.9**: Production build (`tsc -b && vite build`) and lint pass with 0 errors.
