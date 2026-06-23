# Unified Admin Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every protected admin route one responsive sidebar shell and remove obsolete edit controls from public pages.

**Architecture:** The protected admin layout remains the authentication boundary and wraps route content with a focused client `AdminShell`. A small pure navigation helper owns route matching so active-state behavior can be tested without a browser. Public edit controls are removed at their two shared call sites.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS, Vitest.

---

### Task 1: Admin navigation state

**Files:**
- Create: `src/lib/admin/navigation.ts`
- Create: `src/lib/admin/navigation.test.ts`

- [ ] **Step 1: Write route-matching tests**

Test that `/admin` matches only the overview item, `/admin/music/new` matches music, and sibling prefixes do not produce false positives.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `F:\网站制作\node_modules\.bin\vitest.cmd run --pool=threads --maxWorkers=1 src/lib/admin/navigation.test.ts`

Expected: failure because the helper does not exist.

- [ ] **Step 3: Implement navigation metadata and matching**

Export `ADMIN_NAVIGATION_ITEMS` containing overview, plans, settings, works, collections, projects, photos, music, and media test. Export `isAdminNavigationItemActive(pathname, href)` using exact matching for `/admin` and prefix matching for feature routes.

- [ ] **Step 4: Run the focused test**

Expected: all navigation tests pass.

### Task 2: Shared protected admin shell

**Files:**
- Create: `src/components/admin/admin-shell.tsx`
- Modify: `src/app/admin/(protected)/layout.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Build the client shell**

Use `usePathname()` to highlight the active entry. Render a brand block, primary navigation links, return-to-site link, and the existing `SignOutButton`.

- [ ] **Step 2: Wrap protected route content**

Keep `await requireAdmin()` in the server layout, then render `<AdminShell>{children}</AdminShell>`.

- [ ] **Step 3: Add responsive styles**

Desktop uses a two-column shell with a sticky rounded glass sidebar. Below the existing tablet breakpoint, switch to a single column and a horizontally scrollable navigation row. Preserve 320px support and existing admin component styles.

### Task 3: Simplify the admin overview

**Files:**
- Modify: `src/app/admin/(protected)/page.tsx`

- [ ] **Step 1: Remove duplicated navigation buttons**

Replace the existing button pile with a concise welcome/overview panel. Do not add data queries, counts, or analytics.

### Task 4: Remove public edit controls

**Files:**
- Modify: `src/components/chrome/page-shell.tsx`
- Modify: `src/app/album/page.tsx`
- Delete: `src/components/chrome/page-action.tsx`

- [ ] **Step 1: Remove shared PageAction rendering**

Delete the import, optional `action` prop, and `<PageAction>` call from `PageShell`.

- [ ] **Step 2: Remove album-specific PageAction rendering**

Delete its direct import and JSX usage from the album route.

- [ ] **Step 3: Prove no references remain**

Run: `rg -n "PageAction|page-action|进入编辑" src`

Expected: no matches.

### Task 5: Verification

**Files:**
- Verify all files above.

- [ ] **Step 1: Run focused navigation tests**

Run: `F:\网站制作\node_modules\.bin\vitest.cmd run --pool=threads --maxWorkers=1 src/lib/admin/navigation.test.ts`

- [ ] **Step 2: Run TypeScript**

Run: `F:\网站制作\node_modules\.bin\tsc.cmd --noEmit`

- [ ] **Step 3: Check the diff**

Run: `git diff --check`

- [ ] **Step 4: Browser acceptance**

Inspect `/admin`, `/admin/music`, one edit route, `/about`, and `/album` at desktop and mobile widths. Confirm active navigation, no public edit button, no horizontal page overflow, and no regression to admin forms.
