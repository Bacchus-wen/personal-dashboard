# Music Library Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use inline execution in this low-consumption session. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static homepage music placeholder with a real optional music module backed by an admin-managed MP3 library.

**Architecture:** Add a dedicated `music_tracks` table and server repository. Keep homepage module visibility controlled by existing site settings, while active music selection is controlled by the music library so only one track can be active at a time. Use a dedicated admin audio upload API for MP3 files instead of changing the existing image media upload flow.

**Tech Stack:** Next.js App Router, React client components, Server Actions, Supabase PostgreSQL and Storage, existing `public-media` bucket, Vitest.

---

### Task 1: Data Model And Validation

**Files:**
- Create: `supabase/migrations/202606220001_music_library.sql`
- Create: `src/lib/music/types.ts`
- Create: `src/lib/music/validation.ts`
- Create: `src/lib/music/validation.test.ts`

- [ ] Add `music_tracks` with title, artist, audio path, cover path, active flag, sort order, soft delete, timestamps.
- [ ] Add a partial unique index so only one non-deleted track can be active.
- [ ] Validate title, artist, audio path, cover path, active flag, and sort order.

### Task 2: Repository And Actions

**Files:**
- Create: `src/lib/music/repository.ts`
- Create: `src/lib/music/server-repository.ts`
- Create: `src/lib/music/actions.ts`
- Create: `src/lib/music/actions.test.ts`
- Create: `src/app/admin/(protected)/music/actions.ts`

- [ ] List active/admin/trash tracks.
- [ ] Save tracks, move to trash, restore, permanently delete.
- [ ] Activate one track at a time.
- [ ] Clean up replaced/deleted audio and cover objects.

### Task 3: MP3 Upload API

**Files:**
- Create: `src/lib/music/upload.ts`
- Create: `src/lib/music/upload.test.ts`
- Create: `src/app/api/admin/music/upload/route.ts`

- [ ] Accept only `audio/mpeg` / `.mp3`.
- [ ] Store objects under `music/<track-id>/audio/<uuid>.mp3`.
- [ ] Reuse the existing media storage service and cleanup task behavior.

### Task 4: Admin UI

**Files:**
- Create: `src/components/admin/music/music-editor.tsx`
- Create: `src/components/admin/music/music-admin-card.tsx`
- Create: `src/app/admin/(protected)/music/page.tsx`
- Create: `src/app/admin/(protected)/music/new/page.tsx`
- Create: `src/app/admin/(protected)/music/[id]/edit/page.tsx`
- Modify: `src/app/admin/(protected)/page.tsx`

- [ ] Add admin list, create, edit, activate, trash actions.
- [ ] Add MP3 upload control.
- [ ] Link admin home to music management.

### Task 5: Homepage Player

**Files:**
- Create: `src/components/home/music-widget.tsx`
- Modify: `src/components/home/home-dashboard.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

- [ ] Fetch active music for homepage.
- [ ] Render nothing if module is hidden or no active music exists.
- [ ] Replace placeholder with a real `<audio>` play/pause/progress widget.

### Task 6: Verification

- [ ] Run focused music tests.
- [ ] Run TypeScript if dependencies are available.
- [ ] Run `git diff --check`.
- [ ] Ask user to apply Supabase migration in SQL Editor.
- [ ] Browser-test MP3 upload, activation, homepage playback, and module visibility.
