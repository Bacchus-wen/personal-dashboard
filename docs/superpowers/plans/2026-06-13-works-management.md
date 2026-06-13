# Works Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build secure administrator-managed portfolio works with public list/detail routes, draft preview, filters, screenshots, sorting, and trash recovery.

**Architecture:** Follow the existing plans feature boundaries: pure domain validation/query/repository modules, a server-only Supabase adapter, protected Server Actions, mostly server-rendered routes, and focused client editors. Save a work and its screenshots through one Supabase RPC so the update is atomic. Public routes only receive server-filtered public records.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase/PostgreSQL, Vitest, React Markdown, existing CSS design tokens.

---

## File Structure

**Create**

- `supabase/migrations/202606130003_works_management.sql`: works schema, screenshot schema, permissions, indexes, triggers, and atomic save RPC.
- `src/lib/works/constants.ts`: status and visibility values plus Chinese labels.
- `src/lib/works/types.ts`: domain, input, validation, action, and list result types.
- `src/lib/works/validation.ts`: normalize and validate editor input.
- `src/lib/works/validation.test.ts`: validation behavior.
- `src/lib/works/queries.ts`: normalize public/admin URL filters and public visibility rules.
- `src/lib/works/queries.test.ts`: filter and public visibility behavior.
- `src/lib/works/repository.ts`: database-neutral repository and row mapping.
- `src/lib/works/repository.test.ts`: repository filters, sorting, atomic save, and trash behavior.
- `src/lib/works/server-repository.ts`: server-only Supabase adapter and RPC call.
- `src/lib/works/actions.ts`: protected action service and cache paths.
- `src/lib/works/actions.test.ts`: permission, validation, and action-result tests.
- `src/app/admin/(protected)/works/actions.ts`: form-data Server Actions.
- `src/app/admin/(protected)/works/page.tsx`: admin list.
- `src/app/admin/(protected)/works/new/page.tsx`: create route.
- `src/app/admin/(protected)/works/[id]/edit/page.tsx`: edit route.
- `src/app/admin/(protected)/works/[id]/preview/page.tsx`: protected draft preview.
- `src/app/admin/(protected)/works/trash/page.tsx`: trash route.
- `src/components/admin/works/work-editor.tsx`: shared create/edit form.
- `src/components/admin/works/screenshot-editor.tsx`: screenshot list editing and ordering.
- `src/components/admin/works/work-admin-card.tsx`: admin work summary/actions.
- `src/components/admin/works/work-filters.tsx`: admin URL filters.
- `src/components/admin/works/delete-work-button.tsx`: move-to-trash confirmation.
- `src/components/admin/works/trash-work-card.tsx`: restore/permanent-delete controls.
- `src/app/works/page.tsx`: public work list.
- `src/app/works/[slug]/page.tsx`: public work detail and metadata.
- `src/components/works/work-card.tsx`: confirmed hybrid public card.
- `src/components/works/work-filters.tsx`: public URL filters.
- `src/components/works/work-detail.tsx`: reusable public/draft-preview detail layout.
- `src/components/works/work-gallery.tsx`: screenshot gallery.

**Modify**

- `src/app/admin/(protected)/page.tsx`: add works management entry.
- `src/data/site-content.ts`: add `/works` navigation item and preserve `/projects`.
- `src/components/icons.tsx`: map the works navigation identifier.
- `src/app/globals.css`: add works list/detail/admin/editor responsive styles using existing tokens.

## Task 1: Add Database Schema and Atomic Save Contract

**Files:**
- Create: `supabase/migrations/202606130003_works_management.sql`

- [ ] **Step 1: Define enums, tables, constraints, indexes, and updated-at trigger**

Create `work_status`, `work_visibility`, `works`, and `work_screenshots`. Enforce public completeness, HTTPS links, valid dates, nonnegative ordering, and unique screenshot positions.

- [ ] **Step 2: Add atomic save RPC**

Add `save_work_with_screenshots(work_id uuid, work jsonb, screenshots jsonb)` as a `security definer` transaction function. Upsert the work, replace its screenshots, and return the work ID.

- [ ] **Step 3: Lock down browser access**

Enable RLS, revoke `anon` and `authenticated`, grant only required table/function permissions to `service_role`, and add explanatory comments.

- [ ] **Step 4: Manually inspect migration safety**

Run:

```powershell
git diff --check -- supabase/migrations/202606130003_works_management.sql
```

Expected: no output.

- [ ] **Step 5: Commit**

```powershell
git add supabase/migrations/202606130003_works_management.sql
git commit -m "feat: add works management schema"
```

## Task 2: Build and Test the Works Domain

**Files:**
- Create: `src/lib/works/constants.ts`
- Create: `src/lib/works/types.ts`
- Create: `src/lib/works/validation.ts`
- Create: `src/lib/works/validation.test.ts`
- Create: `src/lib/works/queries.ts`
- Create: `src/lib/works/queries.test.ts`

- [ ] **Step 1: Write failing validation tests**

Cover draft-name-only success, missing public fields, slug format, HTTPS-only links, local/HTTPS images, tag normalization, screenshot ordering, and date order.

Run:

```powershell
npm test -- src/lib/works/validation.test.ts
```

Expected: FAIL because works modules do not exist.

- [ ] **Step 2: Implement constants, types, and validation**

Use:

```ts
export const WORK_STATUSES = ["developing", "maintained", "completed", "stopped"] as const;
export const WORK_VISIBILITIES = ["draft", "private", "public", "archived"] as const;
```

Normalize empty optional fields to `null`, deduplicate tags case-insensitively, require a name for every save, and require slug/summary/description/website for public works.

- [ ] **Step 3: Run validation tests**

Run:

```powershell
npm test -- src/lib/works/validation.test.ts
```

Expected: PASS.

- [ ] **Step 4: Write failing query tests**

Cover public query filters, admin query filters, safe page values, and `isPublicWork` excluding nonpublic/deleted/no-slug records.

- [ ] **Step 5: Implement query normalization and public rules**

Public filters accept only known status and a normalized tech tag. Admin filters accept known status/visibility and trimmed search.

- [ ] **Step 6: Run domain tests**

Run:

```powershell
npm test -- src/lib/works/validation.test.ts src/lib/works/queries.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/lib/works
git commit -m "feat: add works domain rules"
```

## Task 3: Build and Test Repository and Protected Actions

**Files:**
- Create: `src/lib/works/repository.ts`
- Create: `src/lib/works/repository.test.ts`
- Create: `src/lib/works/server-repository.ts`
- Create: `src/lib/works/actions.ts`
- Create: `src/lib/works/actions.test.ts`
- Create: `src/app/admin/(protected)/works/actions.ts`

- [ ] **Step 1: Write failing repository tests**

Verify public filters always include public/not-deleted/non-null-slug, public sorting uses `sort_order` then `updated_at`, admin filters are optional, atomic save calls one RPC contract, restore sets draft, and permanent delete targets trash only.

- [ ] **Step 2: Implement repository contract and row mapping**

Expose:

```ts
type WorkRepository = {
  listPublicWorks(query: PublicWorkQuery): Promise<WorkListResult>;
  getPublicWorkBySlug(slug: string): Promise<Work | null>;
  listAdminWorks(query: AdminWorkQuery): Promise<WorkListResult>;
  listTrashWorks(): Promise<Work[]>;
  getWorkById(id: string): Promise<Work | null>;
  saveWork(id: string | null, input: ValidWorkInput): Promise<Work>;
  moveWorkToTrash(id: string): Promise<void>;
  restoreWork(id: string): Promise<void>;
  permanentlyDeleteWork(id: string): Promise<void>;
};
```

- [ ] **Step 3: Implement server-only Supabase adapter**

Map generic select/update/delete requests to Supabase and call `save_work_with_screenshots` for atomic saves.

- [ ] **Step 4: Run repository tests**

Run:

```powershell
npm test -- src/lib/works/repository.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write failing action service tests**

Verify non-admin denial, field errors, successful create/update, trash/restore/permanent-delete messages, and revalidation paths.

- [ ] **Step 6: Implement action service and Server Actions**

Every write must call `requireAdmin`, validate on the server, use the server repository, and revalidate `/works`, affected detail routes, and admin works routes.

- [ ] **Step 7: Run works library tests**

Run:

```powershell
npm test -- src/lib/works
```

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add src/lib/works "src/app/admin/(protected)/works/actions.ts"
git commit -m "feat: add works repository and actions"
```

## Task 4: Build Administrator Works Management

**Files:**
- Create: `src/app/admin/(protected)/works/page.tsx`
- Create: `src/app/admin/(protected)/works/new/page.tsx`
- Create: `src/app/admin/(protected)/works/[id]/edit/page.tsx`
- Create: `src/app/admin/(protected)/works/[id]/preview/page.tsx`
- Create: `src/app/admin/(protected)/works/trash/page.tsx`
- Create: `src/components/admin/works/work-editor.tsx`
- Create: `src/components/admin/works/screenshot-editor.tsx`
- Create: `src/components/admin/works/work-admin-card.tsx`
- Create: `src/components/admin/works/work-filters.tsx`
- Create: `src/components/admin/works/delete-work-button.tsx`
- Create: `src/components/admin/works/trash-work-card.tsx`
- Modify: `src/app/admin/(protected)/page.tsx`

- [ ] **Step 1: Add admin list and filters**

Render server-filtered cards, keyword/status/visibility filters, empty/error states, new-work button, and trash link.

- [ ] **Step 2: Add shared editor**

Use controlled state for all fields, tag editing, Markdown edit/preview, screenshots, dirty-state warning, field errors, pending state, and success notice. Save remains on the current edit page; after creating, replace the URL with the returned edit route.

- [ ] **Step 3: Add screenshot editor**

Support adding, editing, removing, and moving screenshots without a new drag-and-drop dependency. Submit screenshots as JSON to the protected Server Action.

- [ ] **Step 4: Add protected preview**

Load by ID after the protected layout has authenticated the administrator and render the shared public detail component without changing visibility.

- [ ] **Step 5: Add trash operations**

Restore one work at a time and permanently delete only after explicit confirmation.

- [ ] **Step 6: Add backend entry**

Add “管理作品” to the existing admin landing page.

- [ ] **Step 7: Run TypeScript and existing tests**

Run:

```powershell
npx tsc --noEmit
npm test
```

Expected: both pass.

- [ ] **Step 8: Commit**

```powershell
git add src/app/admin src/components/admin/works
git commit -m "feat: add works admin workspace"
```

## Task 5: Build Public Works List and Detail

**Files:**
- Create: `src/app/works/page.tsx`
- Create: `src/app/works/[slug]/page.tsx`
- Create: `src/components/works/work-card.tsx`
- Create: `src/components/works/work-filters.tsx`
- Create: `src/components/works/work-detail.tsx`
- Create: `src/components/works/work-gallery.tsx`
- Modify: `src/data/site-content.ts`
- Modify: `src/components/icons.tsx`

- [ ] **Step 1: Add navigation route**

Add a `works` navigation ID pointing to `/works` with label “我的作品”. Keep `/projects` route available for the later优秀项目 flow.

- [ ] **Step 2: Add public list**

Render tech/status URL filters, hybrid cards, loading-error state, and a true empty state without demo fallback.

- [ ] **Step 3: Add public detail and metadata**

Load only public nondeleted works by slug, call `notFound()` otherwise, and generate metadata from SEO fields with name/summary/cover fallback.

- [ ] **Step 4: Add reusable detail and gallery**

Render Markdown, ordered screenshots, dates, tags, new-tab links, and disabled unavailable-site state. Reuse this component in admin preview.

- [ ] **Step 5: Run focused tests and TypeScript**

Run:

```powershell
npm test -- src/lib/works
npx tsc --noEmit
```

Expected: both pass.

- [ ] **Step 6: Commit**

```powershell
git add src/app/works src/components/works src/data/site-content.ts src/components/icons.ts
git commit -m "feat: add public works pages"
```

## Task 6: Add Confirmed Visual System and Responsive Behavior

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add hybrid card styles**

Use existing tokens for a large browser-preview cover, layered information panel, status/featured/date metadata, tag row, focus ring, and lift hover state.

- [ ] **Step 2: Add detail and gallery styles**

Provide readable Markdown width, project action area, screenshot grid, fallback visuals, and unavailable state.

- [ ] **Step 3: Add admin/editor styles**

Reuse current admin grid and editor language while keeping screenshots and fields usable at 320px.

- [ ] **Step 4: Run lint and TypeScript**

Run:

```powershell
npm run lint
npx tsc --noEmit
```

Expected: both pass.

- [ ] **Step 5: Commit**

```powershell
git add src/app/globals.css
git commit -m "style: add works portfolio layouts"
```

## Task 7: Final Automated Verification and External Browser Acceptance

**Files:**
- Modify only files required by verified defects.

- [ ] **Step 1: Run full tests**

Run:

```powershell
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Run lint and TypeScript**

Run:

```powershell
npm run lint
npx tsc --noEmit
```

Expected: both pass.

- [ ] **Step 3: Run the single final production build**

Stop any development server first, then run:

```powershell
npm run build
```

Expected: production build succeeds. Do not repeat unless a build-specific defect is fixed.

- [ ] **Step 4: Ask user to execute migration**

The user runs `supabase/migrations/202606130003_works_management.sql` in the Supabase SQL Editor and reports success. No Docker or Supabase CLI is required.

- [ ] **Step 5: Start local acceptance server**

Start one development server. If the in-app browser cannot access it, give the URL to the user for external-browser acceptance.

- [ ] **Step 6: Verify desktop and mobile acceptance checklist**

Verify create draft, protected preview, publish validation, public list/detail, filters, unavailable-site state, edit/sort/featured, trash/restore/permanent delete, public isolation, empty state, and 320px layout.

- [ ] **Step 7: Commit verified fixes**

If acceptance reveals a defect, fix and commit it immediately with only the files involved in that defect. Skip this step when no verification fixes were needed.

## Task 8: Review and Publish the Feature Branch

**Files:**
- No planned code changes.

- [ ] **Step 1: Review the complete diff**

Run:

```powershell
git diff --check origin/main...HEAD
git status --short
git log --oneline origin/main..HEAD
```

Expected: no whitespace errors, only intentional untracked files, and clear feature commits.

- [ ] **Step 2: Perform code review**

Use the requesting-code-review skill and fix only confirmed defects.

- [ ] **Step 3: Push and create the works-management pull request**

Report the branch, commits, verification evidence, migration requirement, changed files, remaining manual acceptance, and skills used.
