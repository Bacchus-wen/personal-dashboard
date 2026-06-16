# Navigation Visibility And Avatar Admin Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use inline execution for this plan in the current low-consumption session. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the administrator choose which public navigation items appear while moving the admin entry behind the profile avatar.

**Architecture:** Store public navigation visibility in a dedicated `site_settings.navigation_visibility` JSONB column. A small navigation helper owns defaults and filtering so the home sidebar and top navigation stay consistent.

**Tech Stack:** Next.js App Router, React client components, existing Supabase-backed site settings repository, Vitest.

---

### Task 1: Navigation Visibility Model

**Files:**
- Modify: `src/lib/site-settings/types.ts`
- Modify: `src/lib/site-settings/defaults.ts`
- Modify: `src/lib/site-settings/validation.ts`
- Modify: `src/lib/site-settings/repository.ts`
- Create: `src/lib/navigation/visibility.ts`
- Create: `supabase/migrations/202606160001_navigation_visibility.sql`
- Test: `src/lib/navigation/visibility.test.ts`
- Test: `src/lib/site-settings/validation.test.ts`

- [ ] Add a `NavigationVisibility` type keyed by public nav ids except `home`.
- [ ] Default to plans, works, about, collections, and projects visible; articles hidden.
- [ ] Validate that settings contain a complete boolean navigation visibility map.
- [ ] Normalize missing persisted visibility to defaults for older rows.

### Task 2: Admin Settings UI

**Files:**
- Modify: `src/components/admin/settings/settings-workspace.tsx`
- Create: `src/components/admin/settings/navigation-visibility-editor.tsx`

- [ ] Add a "navigation" settings tab.
- [ ] Render checkboxes for public navigation items.
- [ ] Save changes through the existing publish action.

### Task 3: Public Navigation Integration

**Files:**
- Modify: `src/components/home/home-dashboard.tsx`
- Modify: `src/components/chrome/top-nav.tsx`
- Modify: `src/components/chrome/page-shell.tsx`
- Modify: public route pages that render `PageShell`

- [ ] Filter sidebar items with published navigation visibility.
- [ ] Link the profile block to `/admin` and remove the explicit admin side-menu item.
- [ ] Pass filtered navigation into the top nav on non-home pages.

### Task 4: Verification

**Files:**
- Focused tests only.

- [ ] Run navigation visibility and site settings focused tests.
- [ ] Run TypeScript if resource usage is normal.
- [ ] Run `git diff --check`.
