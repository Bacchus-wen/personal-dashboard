# Draggable Photo Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Synchronize the photo settings form after saves and turn the public album stack into a session-only draggable photo board with a minimal single-photo lightbox.

**Architecture:** Keep geometry and gesture thresholds in a tested pure helper module. Let `PublicAlbum` own ephemeral positions and stacking order, while `PhotoLightbox` remains a focused accessible dialog. Force the photo editor form to remount only when the server-provided persisted settings change.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Vitest, CSS pointer events

---

### Task 1: Synchronize Persisted Photo Settings

**Files:**
- Modify: `src/components/admin/photos/photo-editor.tsx`
- Create: `src/components/admin/photos/photo-editor-state.ts`
- Create: `src/components/admin/photos/photo-editor-state.test.ts`

- [ ] **Step 1: Write the failing form-key test**

Create tests asserting that `photoEditorFormKey({ visibility: "draft", sortOrder: 0 })` is stable for unchanged persisted values and changes when either persisted value changes.

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```powershell
npx vitest run src/components/admin/photos/photo-editor-state.test.ts
```

Expected: FAIL because `photo-editor-state.ts` does not exist.

- [ ] **Step 3: Implement the minimal persisted-value key**

Add a pure `photoEditorFormKey` helper that returns a key derived only from `visibility` and `sortOrder`. Apply the key to the settings `<form>` so a successful `router.refresh()` remounts controls with the latest server values.

- [ ] **Step 4: Verify the focused test**

Run:

```powershell
npx vitest run src/components/admin/photos/photo-editor-state.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/components/admin/photos/photo-editor.tsx src/components/admin/photos/photo-editor-state.ts src/components/admin/photos/photo-editor-state.test.ts
git commit -m "fix: sync persisted photo settings"
```

### Task 2: Add Tested Board Geometry

**Files:**
- Create: `src/lib/photos/board.ts`
- Create: `src/lib/photos/board.test.ts`

- [ ] **Step 1: Write failing geometry tests**

Cover deterministic seeded positions distributed across board zones, clamping a card within the board, and distinguishing a click from movement beyond the drag threshold.

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```powershell
npx vitest run src/lib/photos/board.test.ts
```

Expected: FAIL because `board.ts` does not exist.

- [ ] **Step 3: Implement minimal pure helpers**

Implement:

- `createBoardPositions(ids, boardWidth, boardHeight, cardWidth, cardHeight, seed)` using shuffled board zones plus bounded jitter;
- `clampBoardPosition(position, boardWidth, boardHeight, cardWidth, cardHeight)`;
- `hasDragged(start, current)` using a small fixed threshold.

Positions must keep each card within the board and avoid assigning all cards to the center zone.

- [ ] **Step 4: Verify the focused test**

Run:

```powershell
npx vitest run src/lib/photos/board.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/photos/board.ts src/lib/photos/board.test.ts
git commit -m "feat: add photo board geometry"
```

### Task 3: Implement Draggable Public Album

**Files:**
- Modify: `src/components/photos/public-album.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace stack state with session board state**

Measure the stage with `ResizeObserver`, generate positions when the current group or stage size changes, and store per-photo `{ x, y, z }` state in `PublicAlbum`.

- [ ] **Step 2: Add pointer dragging**

Use pointer capture to track mouse and touch movement. On pointer down, raise the photo to the next highest `z`; on pointer move, clamp and update its position; on pointer up, open the lightbox only when movement stayed below the drag threshold.

- [ ] **Step 3: Update board styling**

Use absolute top-left positioning, preserve restrained rotations, add `touch-action: none` to draggable photos, and maintain responsive card sizes without page-level horizontal overflow.

- [ ] **Step 4: Run focused tests and type checking**

Run:

```powershell
npx vitest run src/lib/photos/board.test.ts src/lib/photos/stack.test.ts
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/components/photos/public-album.tsx src/app/globals.css
git commit -m "feat: make public album draggable"
```

### Task 4: Simplify The Lightbox

**Files:**
- Modify: `src/components/photos/photo-lightbox.tsx`
- Modify: `src/components/photos/public-album.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Reduce the lightbox API**

Pass one selected `PublicPhoto` instead of the complete photo list and initial index.

- [ ] **Step 2: Remove visual controls**

Render only the selected photo inside the dialog. Remove close, previous, next, and page-number controls while preserving backdrop click, `Escape`, and focus restoration.

- [ ] **Step 3: Verify type checking**

Run:

```powershell
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add src/components/photos/photo-lightbox.tsx src/components/photos/public-album.tsx src/app/globals.css
git commit -m "feat: simplify photo lightbox"
```

### Task 5: Verify And Record Acceptance

**Files:**
- Modify: `docs/PROJECT_STATUS.md`
- Modify: `docs/operations/public-album-storage.md`

- [ ] **Step 1: Run automated verification**

Run sequentially:

```powershell
npm test
npm run lint
npx tsc --noEmit
npm run build -- --webpack
git diff --check
```

Expected: all commands pass.

- [ ] **Step 2: Perform external-browser verification**

Verify:

- saved photo status and sort values immediately display correctly;
- initial photos are distributed across the board;
- mouse and touch dragging retain positions for the current session;
- the last dragged photo is on top;
- click opens a single-photo lightbox with no controls;
- backdrop click and `Escape` close the lightbox;
- desktop and approximately `320px` layouts have no page-level horizontal scrolling.

- [ ] **Step 3: Update verified documentation**

Record only confirmed automated and external-browser results in `docs/PROJECT_STATUS.md` and `docs/operations/public-album-storage.md`.

- [ ] **Step 4: Commit**

```powershell
git add docs/PROJECT_STATUS.md docs/operations/public-album-storage.md
git commit -m "docs: record draggable photo board acceptance"
```
