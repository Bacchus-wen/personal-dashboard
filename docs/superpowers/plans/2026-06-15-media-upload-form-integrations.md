# Flow 5B-2 Media Upload Form Integrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `subagent-driven-development` or `executing-plans` task-by-task. Keep builds
> sequential and stop immediately on abnormal duration or resource use.

**Goal:** Connect the verified Flow 5B-1 media foundation to site settings,
Works, Collections, and Featured Projects, including safe replacement and
permanent-delete cleanup.

**Architecture:** Keep object paths in business tables and resolve them to
public URLs only for display. Client editors upload and update draft fields;
domain action services compare persisted records with validated new values,
write business data first, then best-effort delete obsolete system objects.
Permanent delete reads the full record, deletes the database record, and then
best-effort cleans all associated system objects.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase
Auth/PostgreSQL/Storage, Vitest, existing Flow 5B-1 media APIs and CSS tokens.

---

## File Map

### Shared media integration

- Create: `src/lib/media/display.ts`
- Create: `src/lib/media/display.test.ts`
- Create: `src/lib/media/lifecycle.ts`
- Create: `src/lib/media/lifecycle.test.ts`
- Create: `src/components/admin/media/compact-media-upload.tsx`
- Modify: `src/components/admin/media/media-upload-field.tsx`
- Modify: `src/app/globals.css`

### Database

- Create: `supabase/migrations/202606150002_media_upload_form_integrations.sql`

### Site settings

- Modify: `src/components/admin/settings/settings-workspace.tsx`
- Modify: `src/components/admin/settings/site-settings-form.tsx`
- Modify: `src/lib/site-settings/actions.ts`
- Modify: `src/lib/site-settings/actions.test.ts`
- Modify: `src/lib/site-settings/validation.ts`
- Modify: `src/lib/site-settings/validation.test.ts`
- Modify: `src/app/layout.tsx`
- Modify: public avatar rendering path as required by the display helper

### Works

- Modify: `src/components/admin/works/work-editor.tsx`
- Modify: `src/components/admin/works/screenshot-editor.tsx`
- Modify: `src/lib/works/navigation.ts`
- Modify: `src/lib/works/navigation.test.ts`
- Modify: `src/lib/works/actions.ts`
- Modify: `src/lib/works/actions.test.ts`
- Modify: `src/lib/works/validation.ts`
- Modify: `src/lib/works/validation.test.ts`
- Modify: `src/components/works/work-card.tsx`
- Modify: `src/components/works/work-detail.tsx`
- Modify: `src/components/works/work-gallery.tsx`
- Modify: `src/app/works/[slug]/page.tsx`

### Collections

- Modify: `src/components/admin/collections/collection-editor.tsx`
- Modify: `src/lib/collections/actions.ts`
- Modify: `src/lib/collections/actions.test.ts`
- Modify: `src/lib/collections/validation.ts`
- Modify: `src/lib/collections/validation.test.ts`
- Modify: `src/components/collections/collection-card.tsx`

### Featured Projects

- Modify: `src/components/admin/featured-projects/project-editor.tsx`
- Modify: `src/components/featured-projects/project-card.tsx`
- Modify: `src/lib/featured-projects/types.ts`
- Modify: `src/lib/featured-projects/validation.ts`
- Modify: `src/lib/featured-projects/validation.test.ts`
- Modify: `src/lib/featured-projects/repository.ts`
- Modify: `src/lib/featured-projects/repository.test.ts`
- Modify: `src/lib/featured-projects/actions.ts`
- Modify: `src/lib/featured-projects/actions.test.ts`

### Operations and status

- Create: `docs/operations/media-upload-form-integrations.md`
- Modify: `docs/PROJECT_STATUS.md`

## Task 1: Add Shared Display And Lifecycle Helpers

**Files:**
- Create: `src/lib/media/display.ts`
- Create: `src/lib/media/display.test.ts`
- Create: `src/lib/media/lifecycle.ts`
- Create: `src/lib/media/lifecycle.test.ts`
- Modify: `src/lib/media/server-storage.ts`

- [ ] **Step 1: Write failing display tests**

Cover:

- system object paths resolve through an injected `publicUrlForPath`;
- HTTPS URLs remain unchanged;
- project-local `/...` paths remain unchanged;
- empty paths remain empty.

- [ ] **Step 2: Implement display helper**

Export a pure helper similar to:

```ts
export function resolveMediaDisplayUrl(
  path: string | null,
  publicUrlForPath: (path: string) => string,
): string | null;
```

Use `isSystemMediaPath` to decide whether to resolve. Do not expose the
server-only Supabase client to browser components.

- [ ] **Step 3: Write failing lifecycle tests**

Cover:

- identifies only obsolete system paths;
- ignores unchanged paths, HTTPS URLs, local paths, nulls, and duplicates;
- best-effort deletes every obsolete path;
- suppresses media-delete failures because the media service already records a
  cleanup task.

- [ ] **Step 4: Implement lifecycle helper**

Export pure path comparison plus a small async cleanup coordinator. Keep
repository concerns outside this module.

- [ ] **Step 5: Run focused tests**

```powershell
npm test -- src/lib/media/display.test.ts src/lib/media/lifecycle.test.ts
```

- [ ] **Step 6: Commit**

```powershell
git add src/lib/media/display.ts src/lib/media/display.test.ts src/lib/media/lifecycle.ts src/lib/media/lifecycle.test.ts src/lib/media/server-storage.ts
git commit -m "feat: add media integration lifecycle helpers"
```

## Task 2: Add Safe Database Migration

**Files:**
- Create: `supabase/migrations/202606150002_media_upload_form_integrations.sql`
- Create: `docs/operations/media-upload-form-integrations.md`

- [ ] **Step 1: Write migration**

The migration must:

- add nullable `featured_projects.cover_path`;
- allow `projects/<id>/cover/<uuid>.webp` plus existing `/...` and HTTPS values;
- expand existing Works cover, Works SEO, work screenshot, and Collections cover
  check constraints to allow their approved generated object paths;
- preserve all existing rows;
- use named replacement constraints and no table rebuild;
- keep RLS and browser-role grants unchanged.

- [ ] **Step 2: Add SQL verification guide**

Document SQL queries for:

- `featured_projects.cover_path`;
- all affected check constraint definitions;
- RLS and `anon`/`authenticated` privileges;
- Storage object and cleanup-task checks.

- [ ] **Step 3: Verify formatting**

```powershell
git diff --check -- supabase/migrations/202606150002_media_upload_form_integrations.sql docs/operations/media-upload-form-integrations.md
```

- [ ] **Step 4: Commit**

```powershell
git add supabase/migrations/202606150002_media_upload_form_integrations.sql docs/operations/media-upload-form-integrations.md
git commit -m "feat: add media integration schema"
```

## Task 3: Add Compact Upload Controls And Client Cleanup

**Files:**
- Create: `src/components/admin/media/compact-media-upload.tsx`
- Modify: `src/components/admin/media/media-upload-field.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Extend reusable upload behavior**

Add only the capabilities required by business forms:

- compact presentation;
- disabled state and first-save hint;
- configurable multiple-file selection for screenshots;
- per-file success/failure result reporting;
- callback with both object path and public URL;
- callback before replacing or removing an unsaved session upload.

Do not auto-save business forms.

- [ ] **Step 2: Implement session-only cleanup**

For a newly uploaded path that has not been saved:

- replacing a single-value upload calls `/api/admin/media/delete`;
- removing a newly uploaded screenshot calls the same API;
- failures remain visible but do not discard the new selection;
- closing or navigating away does not claim successful cleanup.

- [ ] **Step 3: Add scoped responsive styles**

Reuse existing form, button, pill, preview, and focus patterns. Verify compact
controls and screenshot rows at desktop, tablet, and approximately 320px.

- [ ] **Step 4: Run low-cost verification**

```powershell
npm run lint
npx tsc --noEmit
git diff --check
```

- [ ] **Step 5: Commit**

```powershell
git add src/components/admin/media/compact-media-upload.tsx src/components/admin/media/media-upload-field.tsx src/app/globals.css
git commit -m "feat: add compact media upload controls"
```

## Task 4: Integrate Site Settings

**Files:**
- Modify: `src/components/admin/settings/settings-workspace.tsx`
- Modify: `src/components/admin/settings/site-settings-form.tsx`
- Modify: `src/lib/site-settings/actions.ts`
- Modify: `src/lib/site-settings/actions.test.ts`
- Modify: `src/lib/site-settings/validation.ts`
- Modify: `src/lib/site-settings/validation.test.ts`
- Modify: `src/app/layout.tsx`
- Modify: public avatar rendering path as required

- [ ] **Step 1: Write failing action and validation tests**

Cover:

- system avatar and favicon paths validate;
- publish reads the previous configuration;
- successful publish cleans replaced system avatar/favicon;
- unchanged, HTTPS, and local old values are not deleted;
- publish failure does not delete old media;
- cleanup failure does not turn successful publish into failure.

- [ ] **Step 2: Add lifecycle dependency to action service**

Add repository read and injected media cleanup to
`createSiteSettingsActionService`. Publish database state first, then clean
obsolete system paths.

- [ ] **Step 3: Add compact controls**

Place avatar and favicon upload controls below their existing path inputs.
Upload updates `draft.settings`; successful publish updates the baseline.

- [ ] **Step 4: Resolve public display URLs**

Use resolved display URLs for the public avatar and root Metadata favicon while
keeping stored business values as object paths.

- [ ] **Step 5: Run focused tests**

```powershell
npm test -- src/lib/site-settings/actions.test.ts src/lib/site-settings/validation.test.ts src/lib/media/display.test.ts src/lib/media/lifecycle.test.ts
```

- [ ] **Step 6: Commit**

```powershell
git add src/components/admin/settings src/lib/site-settings src/app/layout.tsx
git commit -m "feat: integrate site setting uploads"
```

## Task 5: Integrate Works Uploads And Cleanup

**Files:**
- Modify: `src/components/admin/works/work-editor.tsx`
- Modify: `src/components/admin/works/screenshot-editor.tsx`
- Modify: `src/lib/works/navigation.ts`
- Modify: `src/lib/works/navigation.test.ts`
- Modify: `src/lib/works/actions.ts`
- Modify: `src/lib/works/actions.test.ts`
- Modify: `src/lib/works/validation.ts`
- Modify: `src/lib/works/validation.test.ts`
- Modify: `src/components/works/work-card.tsx`
- Modify: `src/components/works/work-detail.tsx`
- Modify: `src/components/works/work-gallery.tsx`
- Modify: `src/app/works/[slug]/page.tsx`

- [ ] **Step 1: Write failing navigation, validation, and lifecycle tests**

Cover:

- new work save destination is `/admin/works/<id>/edit`;
- system cover, SEO, and screenshot paths validate;
- update reads old work and cleans obsolete cover, SEO, and screenshot paths
  only after save;
- permanent delete reads a trashed work, deletes the database record, then
  cleans all associated system paths;
- media cleanup failure does not fail successful database mutation.

- [ ] **Step 2: Update action service**

Inject media cleanup and use `getWorkById` before update or permanent delete.
Keep move-to-trash and restore behavior unchanged.

- [ ] **Step 3: Add editor controls**

- new page shows first-save hint instead of upload controls;
- edit page uses `work.id` for cover, SEO, and screenshot upload targets;
- batch screenshot uploads append successful results in selection order;
- failed screenshot files are reported without removing successful items;
- existing caption, sort, manual path, and removal controls remain.

- [ ] **Step 4: Resolve public display and metadata URLs**

Resolve system paths for cards, detail cover, gallery screenshots, and Open
Graph images. Preserve local and HTTPS paths.

- [ ] **Step 5: Run focused tests**

```powershell
npm test -- src/lib/works/actions.test.ts src/lib/works/navigation.test.ts src/lib/works/validation.test.ts
```

- [ ] **Step 6: Commit**

```powershell
git add src/components/admin/works src/lib/works src/components/works "src/app/works/[slug]/page.tsx"
git commit -m "feat: integrate work media uploads"
```

## Task 6: Integrate Collections Upload And Cleanup

**Files:**
- Modify: `src/components/admin/collections/collection-editor.tsx`
- Modify: `src/lib/collections/actions.ts`
- Modify: `src/lib/collections/actions.test.ts`
- Modify: `src/lib/collections/validation.ts`
- Modify: `src/lib/collections/validation.test.ts`
- Modify: `src/components/collections/collection-card.tsx`

- [ ] **Step 1: Write failing tests**

Cover system cover validation, post-save obsolete cover cleanup, permanent
delete cleanup, and cleanup-failure tolerance.

- [ ] **Step 2: Update action service**

Read the old collection before update or permanent delete. Save or delete the
database record first, then best-effort clean obsolete system cover paths.

- [ ] **Step 3: Add editor control and create redirect**

New page shows first-save hint. After first successful save, route to
`/admin/collections/<id>/edit`. Edit page enables cover upload with the real ID.

- [ ] **Step 4: Resolve card display URL**

The public and preview card must resolve generated system paths while retaining
local and HTTPS behavior.

- [ ] **Step 5: Run focused tests**

```powershell
npm test -- src/lib/collections/actions.test.ts src/lib/collections/validation.test.ts
```

- [ ] **Step 6: Commit**

```powershell
git add src/components/admin/collections src/lib/collections src/components/collections
git commit -m "feat: integrate collection cover uploads"
```

## Task 7: Add Featured Project Covers And Cleanup

**Files:**
- Modify: `src/components/admin/featured-projects/project-editor.tsx`
- Modify: `src/components/featured-projects/project-card.tsx`
- Modify: `src/lib/featured-projects/types.ts`
- Modify: `src/lib/featured-projects/validation.ts`
- Modify: `src/lib/featured-projects/validation.test.ts`
- Modify: `src/lib/featured-projects/repository.ts`
- Modify: `src/lib/featured-projects/repository.test.ts`
- Modify: `src/lib/featured-projects/actions.ts`
- Modify: `src/lib/featured-projects/actions.test.ts`

- [ ] **Step 1: Write failing model, repository, and action tests**

Cover:

- `coverPath` validation and normalization;
- `cover_path` selection, mapping, and save payload;
- post-save obsolete cover cleanup;
- permanent-delete cover cleanup;
- cleanup-failure tolerance.

- [ ] **Step 2: Implement full cover data chain**

Add `coverPath` to types, validation, repository columns/mapping/payload, and
test fixtures.

- [ ] **Step 3: Add editor control and create redirect**

New page shows first-save hint. After first successful save, route to
`/admin/projects/<id>/edit`. Edit page enables cover upload with the real ID.

- [ ] **Step 4: Update cards**

Show cover image when present, retain current `GH` fallback when absent, and
resolve generated system paths for public and preview cards.

- [ ] **Step 5: Run focused tests**

```powershell
npm test -- src/lib/featured-projects/actions.test.ts src/lib/featured-projects/repository.test.ts src/lib/featured-projects/validation.test.ts
```

- [ ] **Step 6: Commit**

```powershell
git add src/components/admin/featured-projects src/components/featured-projects src/lib/featured-projects
git commit -m "feat: integrate featured project covers"
```

## Task 8: Run Integrated Local Verification

- [ ] **Step 1: Run focused domain suite**

```powershell
npm test -- src/lib/media src/lib/site-settings src/lib/works src/lib/collections src/lib/featured-projects
```

- [ ] **Step 2: Run full low-cost verification sequentially**

```powershell
npm test
npm run lint
npx tsc --noEmit
git diff --check
```

- [ ] **Step 3: Start or reuse one development server**

Reuse the existing server if it points to the Flow 5B-2 worktree. Otherwise
start one webpack development server on an unused port. Do not start parallel
builds or duplicate servers.

- [ ] **Step 4: Browser smoke test**

Check:

- first-save hints on new forms;
- compact controls and previews on edit forms;
- batch screenshot partial success;
- manual local and HTTPS path preservation;
- no horizontal overflow at desktop, tablet, and approximately 320px.

- [ ] **Step 5: Run final production build once**

```powershell
npm run build -- --webpack
```

- [ ] **Step 6: Commit any narrowly scoped verification fixes**

## Task 9: Apply And Verify Real Supabase Migration

- [ ] **Step 1: Apply migration**

Run `supabase/migrations/202606150002_media_upload_form_integrations.sql` in the
real Supabase SQL Editor. Do not expose `.env.local`, keys, sessions, or admin
IDs.

- [ ] **Step 2: Verify schema and security**

Use the operations guide queries to confirm:

- `featured_projects.cover_path` exists;
- affected check constraints accept approved generated paths;
- RLS remains enabled;
- browser roles have no direct table or Storage write access.

- [ ] **Step 3: External-browser acceptance**

As administrator:

- upload, save, replace, clear, and verify public display for site avatar and
  favicon;
- upload and save Works cover, SEO image, and multiple screenshots;
- upload and save Collections and Featured Projects covers;
- verify first-save flow for new records;
- verify move-to-trash preserves images;
- verify permanent delete removes objects or creates cleanup tasks.

- [ ] **Step 4: Update verified operations outcomes**

Update `docs/operations/media-upload-form-integrations.md` with observed results
only.

## Task 10: Update Status, Publish PR, And Merge

**Files:**
- Modify: `docs/PROJECT_STATUS.md`
- Modify: `docs/operations/media-upload-form-integrations.md`

- [ ] **Step 1: Update project status**

Record branch, commits, verification, migration state, browser acceptance, and
PR URL. Mark Flow 5B-2 complete only after real service and browser acceptance.

- [ ] **Step 2: Run final repository checks**

```powershell
git status --short --branch
git diff --check
```

- [ ] **Step 3: Push and create draft PR**

Use project-local GitHub CLI when needed:

```powershell
& "F:\网站制作\.local-tools\github-cli\bin\gh.exe" pr create --draft --base main --head codex/media-upload-form-integrations --title "[codex] Integrate media uploads into business forms"
```

- [ ] **Step 4: Review checks and make PR ready**

Do not merge while tests, cloud verification, browser acceptance, or required
review remain incomplete.

- [ ] **Step 5: Merge and record outcome**

After merge, update `docs/PROJECT_STATUS.md` on `main` with the final PR and
merge commit, then verify `main` is clean and synchronized.
