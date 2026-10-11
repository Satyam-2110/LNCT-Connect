# Phase 20 Plan: Performance, Tooling & Script Hygiene

**Milestone**: Milestone 4 — Code Hardening & Reliability  
**Phase**: Phase 20 (Priority 5: Performance, Tooling & Script Hygiene)  
**Status**: Completed  
**Dependencies**: Completed Phase 16, Phase 17, Phase 18, Phase 19 (Migrations 0001–0010)  

---

## 1. Objectives & Scope

Optimize query throughput, sanitize database automation scripts, resolve misleading project scripts, and update central planning documentation:

1. **Query Pagination & Bound Enforcement**:
   - Add boundary parameters (`limit` and `offset`) with `.range(from, to)` to high-volume read endpoints:
     - `fetchFeed` in `src/services/posts.ts`
     - `fetchProjects` in `src/services/projects.ts`
     - `fetchProfiles` in `src/services/profiles.ts`
     - `fetchMentors` in `src/services/mentorship.ts`
     - `fetchConversations` in `src/services/messaging.ts`
   - Preserve default backward compatibility while enabling windowed data loading in both live and offline mock environments.

2. **Safe Type-Generation Script Guard**:
   - Replace the destructive placeholder command `"db:types"` in `package.json` with a guarded runner `scripts/generate-types.js`.
   - Prevent inadvertent truncation or corruption of `src/types/database.ts` when `SUPABASE_PROJECT_ID` is unset or contains placeholders.

3. **Package Scripts Hygiene**:
   - Clean up `"lint"` script in `package.json` to properly invoke TypeScript compiler checking (`tsc -b`).

4. **Planning Documentation & Requirements Alignment**:
   - Update `.planning/STATE.md`, `.planning/REQUIREMENTS.md`, and `.planning/ROADMAP.md` reflecting all code hardening phases.

5. **Automated Verification Suite**:
   - Author `src/test/performance-and-tooling.test.ts` validating:
     - Pagination boundaries across all 5 query services.
     - Type generation safety guard script execution.

---

## 2. Tasks Breakdown

- [x] **Task 20.1: Query Pagination Across Core Services**
  - Add `limit` and `offset` support to `fetchFeed` (`src/services/posts.ts`).
  - Add `limit` and `offset` support to `fetchProjects` (`src/services/projects.ts`).
  - Add `limit` and `offset` support to `fetchProfiles` (`src/services/profiles.ts`).
  - Add `limit` and `offset` support to `fetchMentors` (`src/services/mentorship.ts`).
  - Add `limit` and `offset` support to `fetchConversations` (`src/services/messaging.ts`).

- [x] **Task 20.2: Guarded Database Type Generation Script**
  - Author `scripts/generate-types.js`.
  - Update `"db:types"` and `"lint"` in `package.json`.

- [x] **Task 20.3: Documentation & Planning Directory Sync**
  - Update `.planning/REQUIREMENTS.md` with hardening requirements.
  - Update `.planning/STATE.md` and `.planning/ROADMAP.md`.

- [x] **Task 20.4: Automated Test Expansion & Verification**
  - Author `src/test/performance-and-tooling.test.ts`.
  - Run `npm test` verifying all suites pass (124/124 tests).
  - Run `npm run build` verifying clean compilation and zero TypeScript errors.

---

## 3. Measurable Acceptance Criteria

- **AC-20.1**: All 5 query services support pagination slices both in live PostgREST queries (`.range()`) and local stores (`.slice()`).
- **AC-20.2**: `npm run db:types` safely aborts with exit code 1 when project ID is missing, preserving `database.ts`.
- **AC-20.3**: `npm run lint` cleanly executes TypeScript typechecking (`tsc -b`).
- **AC-20.4**: 100% automated test pass rate across vitest suites with clean production build.
