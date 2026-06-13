# Website Settings And Home Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an authenticated settings workspace that atomically publishes site information, social links, module visibility, and a fixed-size desktop homepage layout.

**Architecture:** Store published configuration in three server-only Supabase tables and publish all settings through one transactional PostgreSQL RPC. Keep validation and layout rules in framework-independent TypeScript modules, expose mutations through an authenticated Server Action, and make the public homepage fall back to existing defaults whenever published configuration is unavailable or invalid.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase PostgreSQL/RPC, Vitest, native Pointer Events, existing CSS design tokens.

---

## File Structure

- `supabase/migrations/202606130001_site_settings_home_layout.sql`: tables, server-only grants, default rows, and transactional publish RPC.
- `src/lib/site-settings/types.ts`: public settings, social link, module, layout, and action result types.
- `src/lib/site-settings/defaults.ts`: project defaults, module registry, fixed sizes, grid bounds, and mobile order.
- `src/lib/site-settings/validation.ts`: normalization and field/layout validation.
- `src/lib/site-settings/validation.test.ts`: unit tests for settings, URLs, core modules, overlap, and bounds.
- `src/lib/site-settings/repository.ts`: database-independent published-settings repository.
- `src/lib/site-settings/repository.test.ts`: mapping, fallback, and publish request tests.
- `src/lib/site-settings/server-repository.ts`: Supabase adapter and server repository factory.
- `src/app/admin/(protected)/settings/actions.ts`: authenticated publish Server Action and cache revalidation.
- `src/app/admin/(protected)/settings/page.tsx`: protected settings route and initial-data loading.
- `src/components/admin/settings/settings-workspace.tsx`: client-side draft state, tabs, dirty-state warning, publish feedback.
- `src/components/admin/settings/site-settings-form.tsx`: basic site fields.
- `src/components/admin/settings/social-links-editor.tsx`: social list CRUD, ordering, and confirmation.
- `src/components/admin/settings/home-layout-editor.tsx`: native pointer drag, snapping, visibility, collision checks, reset.
- `src/components/admin/settings/theme-placeholder.tsx`: read-only theme tab.
- `src/components/home/home-dashboard.tsx`: render published content, visibility, and desktop coordinates.
- `src/app/page.tsx`: load homepage plans and published site configuration.
- `src/app/layout.tsx`: load published metadata with defaults.
- `src/app/admin/(protected)/page.tsx`: add settings workspace entry.
- `src/app/globals.css`: settings workspace, layout editor, positioned desktop modules, and fixed mobile order.

### Task 1: Create The Published Configuration Schema

**Files:**
- Create: `supabase/migrations/202606130001_site_settings_home_layout.sql`

- [ ] **Step 1: Define server-only tables**

Create singleton `site_settings`, ordered `social_links`, and keyed `home_layout` tables. Add checks for non-empty required text, accepted link protocols, unique social positions, unique module keys, non-negative grid coordinates, and positive fixed dimensions.

- [ ] **Step 2: Add transactional publish RPC**

Create `public.publish_site_configuration(settings jsonb, links jsonb, layout jsonb)` as a `security definer` function with an empty search path. The function updates the singleton settings row, replaces social links and layout rows, and returns only after all writes succeed.

- [ ] **Step 3: Restrict database access**

Enable RLS, revoke table/function access from `anon` and `authenticated`, and grant tables plus RPC execution only to `service_role`.

- [ ] **Step 4: Add defaults**

Insert the initial published settings, four current social links, and default layout rows so the database can immediately match the existing homepage.

- [ ] **Step 5: Verify migration text**

Run: `git diff --check -- supabase/migrations/202606130001_site_settings_home_layout.sql`

Expected: no output.

- [ ] **Step 6: Commit**

```powershell
git add supabase/migrations/202606130001_site_settings_home_layout.sql
git commit -m "feat: add published site configuration schema"
```

### Task 2: Define Defaults And Validate Drafts

**Files:**
- Create: `src/lib/site-settings/types.ts`
- Create: `src/lib/site-settings/defaults.ts`
- Create: `src/lib/site-settings/validation.ts`
- Create: `src/lib/site-settings/validation.test.ts`

- [ ] **Step 1: Write failing validation tests**

Cover valid defaults, required title/name, HTTPS or local image paths, HTTPS/mailto social links, duplicate social order, disabled core modules, unknown module keys, overlaps, and out-of-bounds cards.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- src/lib/site-settings/validation.test.ts`

Expected: FAIL because the site-settings modules do not exist.

- [ ] **Step 3: Add shared types and defaults**

Define:

```ts
type HomeModuleId =
  | "navigation"
  | "welcome"
  | "socials"
  | "album"
  | "clock"
  | "calendar"
  | "recentPlans"
  | "recommendation"
  | "music";
```

Add the approved core/optional registry, fixed card sizes, desktop canvas dimensions, mobile order, default site content, default links, and default layout.

- [ ] **Step 4: Implement validation**

Normalize trimmed strings, reject invalid image paths/link protocols, enforce unique social order, force known fixed card sizes, reject disabled core modules, and detect overlap/bounds violations. Return a field-error result suitable for the admin UI and a fully normalized payload on success.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- src/lib/site-settings/validation.test.ts`

Expected: all validation tests pass.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/site-settings
git commit -m "feat: define and validate site configuration"
```

### Task 3: Add The Server Repository

**Files:**
- Create: `src/lib/site-settings/repository.ts`
- Create: `src/lib/site-settings/repository.test.ts`
- Create: `src/lib/site-settings/server-repository.ts`

- [ ] **Step 1: Write failing repository tests**

Test mapping database rows into published configuration, fallback to project defaults when rows are incomplete, and sending one RPC request containing all three normalized sections.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- src/lib/site-settings/repository.test.ts`

Expected: FAIL because the repository does not exist.

- [ ] **Step 3: Implement database-independent repository**

Expose:

```ts
type SiteSettingsRepository = {
  getPublished(): Promise<PublishedSiteConfiguration>;
  publish(input: ValidSiteConfiguration): Promise<void>;
};
```

Wrap read/write failures in stable error codes without exposing database details.

- [ ] **Step 4: Implement Supabase adapter**

Use `createSupabaseAdminClient()` to select the three configuration tables and call `publish_site_configuration` once for writes.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- src/lib/site-settings/repository.test.ts`

Expected: all repository tests pass.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/site-settings
git commit -m "feat: add site configuration repository"
```

### Task 4: Add Authenticated Publish Action And Settings Route

**Files:**
- Create: `src/app/admin/(protected)/settings/actions.ts`
- Create: `src/app/admin/(protected)/settings/page.tsx`
- Modify: `src/app/admin/(protected)/page.tsx`
- Create: `src/lib/site-settings/actions.ts`
- Create: `src/lib/site-settings/actions.test.ts`

- [ ] **Step 1: Write failing action-service tests**

Test admin-ID rejection, validation errors, successful single repository publish, and stable write-failure messages.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- src/lib/site-settings/actions.test.ts`

Expected: FAIL because the action service does not exist.

- [ ] **Step 3: Implement action service**

Create a framework-independent service that checks the current user ID, validates the complete draft, and invokes one repository publish call.

- [ ] **Step 4: Implement Server Action**

The Server Action must call `requireAdmin()`, invoke the action service, and revalidate `/`, `/about`, `/admin/settings`, and the root layout.

- [ ] **Step 5: Add protected route and admin link**

Load current published settings with a safe fallback and render the settings workspace. Add a settings link to `/admin`.

- [ ] **Step 6: Run focused tests**

Run: `npm test -- src/lib/site-settings/actions.test.ts`

Expected: all action-service tests pass.

- [ ] **Step 7: Commit**

```powershell
git add src/app/admin src/lib/site-settings
git commit -m "feat: add protected site settings publishing"
```

### Task 5: Build The Settings Workspace

**Files:**
- Create: `src/components/admin/settings/settings-workspace.tsx`
- Create: `src/components/admin/settings/site-settings-form.tsx`
- Create: `src/components/admin/settings/social-links-editor.tsx`
- Create: `src/components/admin/settings/theme-placeholder.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Build shared draft workspace**

Maintain one draft for all tabs, show the four approved tabs, call the publish action, display field/general errors, preserve failed drafts, and show a brief success notice.

- [ ] **Step 2: Add dirty-state protection**

Attach `beforeunload` only while the draft differs from the initial published configuration. Internal tab switches must not trigger the warning.

- [ ] **Step 3: Add basic settings form**

Render labeled controls for all approved fields and inline errors. Keep avatar/favicon as path or URL text fields.

- [ ] **Step 4: Add social links editor**

Support add, edit, enabled toggle, move up/down, and confirmed deletion. Generate contiguous unique sort orders before publishing.

- [ ] **Step 5: Add theme placeholder**

Show current mint/glass theme information and an explicit later-phase notice.

- [ ] **Step 6: Add responsive styles**

Reuse existing tokens, `.glass`, `.btn`, and admin patterns. Ensure controls remain usable at 320px.

- [ ] **Step 7: Verify types**

Run: `npx tsc --noEmit`

Expected: exit code 0.

- [ ] **Step 8: Commit**

```powershell
git add src/components/admin/settings src/app/globals.css
git commit -m "feat: add site settings workspace"
```

### Task 6: Build The Native Layout Editor

**Files:**
- Create: `src/components/admin/settings/home-layout-editor.tsx`
- Create: `src/lib/site-settings/layout.ts`
- Create: `src/lib/site-settings/layout.test.ts`
- Modify: `src/components/admin/settings/settings-workspace.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write failing layout-helper tests**

Test grid snapping, clamping, collision rejection, default restoration, optional visibility changes, and preservation of a disabled module's saved position.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- src/lib/site-settings/layout.test.ts`

Expected: FAIL because layout helpers do not exist.

- [ ] **Step 3: Implement pure layout helpers**

Keep pointer calculations outside React. Export snap, clamp, collision, move, visibility, and restore-default helpers so behavior can be tested without a browser.

- [ ] **Step 4: Implement editor UI**

Use native Pointer Events and pointer capture. Show fixed-size cards on a scaled desktop canvas, prevent invalid drops, expose optional-module toggles, and keep core toggles disabled.

- [ ] **Step 5: Connect reset and draft state**

“恢复默认” replaces only the draft layout. No public data changes until “保存并发布”.

- [ ] **Step 6: Run focused tests and type check**

Run: `npm test -- src/lib/site-settings/layout.test.ts`

Run: `npx tsc --noEmit`

Expected: all tests pass and type check exits 0.

- [ ] **Step 7: Commit**

```powershell
git add src/components/admin/settings src/lib/site-settings src/app/globals.css
git commit -m "feat: add homepage layout editor"
```

### Task 7: Render Published Homepage Configuration

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/home/home-dashboard.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Load published configuration safely**

Load plans and published site configuration independently. If settings fail, pass project defaults so the homepage still renders.

- [ ] **Step 2: Apply site content and module visibility**

Replace hardcoded profile/social values with published configuration. Do not render disabled optional modules. Always render core modules.

- [ ] **Step 3: Apply desktop layout**

Render modules through a module registry and apply validated grid positions as CSS custom properties. Preserve existing visual components and fixed sizes.

- [ ] **Step 4: Apply mobile order**

At mobile widths, ignore desktop coordinates and apply the approved fixed order. Hidden optional modules leave no empty space.

- [ ] **Step 5: Apply metadata and fallbacks**

Generate title and description from published settings with project defaults. Use safe default images when configured assets fail.

- [ ] **Step 6: Verify types and lint**

Run: `npx tsc --noEmit`

Run: `npm run lint`

Expected: both commands exit 0.

- [ ] **Step 7: Commit**

```powershell
git add src/app src/components/home
git commit -m "feat: render published homepage settings"
```

### Task 8: Verify And Prepare Acceptance

**Files:**
- Modify only if verification finds a flow-2 defect.

- [ ] **Step 1: Run the complete lightweight suite**

Run: `npm test`

Run: `npm run lint`

Run: `npx tsc --noEmit`

Expected: all commands exit 0.

- [ ] **Step 2: Apply migration manually**

Ask the user to run `supabase/migrations/202606130001_site_settings_home_layout.sql` in Supabase SQL Editor. Do not require Docker or install Supabase CLI.

- [ ] **Step 3: Start one acceptance server**

Run a single development server only after automated checks pass. Confirm it returns HTTP 200 before giving the external-browser URL.

- [ ] **Step 4: External-browser acceptance**

Verify: protected access, settings edits, social CRUD/order, layout drag/snap/collision, module toggles, reset-before-publish behavior, failed publish draft retention, desktop homepage, 320px mobile order, and metadata.

- [ ] **Step 5: Run one final production build**

Stop the development server first.

Run: `npm run build`

Expected: build exits 0. Do not repeat unless a build-specific fix is made.

- [ ] **Step 6: Commit any verification fixes**

```powershell
git add src supabase docs
git commit -m "fix: complete site settings acceptance"
```
