# Collections And Featured Projects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build secure administrator-managed external article/video collections and noteworthy GitHub projects, expose them through `/collections`, `/projects`, and the homepage recommendation module, and retire the old recommendation demo pages.

**Architecture:** Keep `collections` and `featured_projects` as independent domains following the existing works-management boundaries: pure validation/query/repository modules, server-only Supabase adapters, protected Server Actions, mostly server-rendered routes, and focused client editors. Convert both domains into one small `HomeRecommendation` display type only at the homepage read boundary.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase/PostgreSQL, Vitest, existing CSS design tokens and components.

---

## File Structure

**Create**

- `supabase/migrations/202606140001_collections_featured_projects.sql`: enums, tables, constraints, indexes, triggers, RLS, and grants.
- `src/lib/collections/constants.ts`: content types, visibility values, and labels.
- `src/lib/collections/types.ts`: collection domain, input, validation, action, and list types.
- `src/lib/collections/validation.ts`: normalize and validate collection inputs.
- `src/lib/collections/validation.test.ts`: collection validation behavior.
- `src/lib/collections/queries.ts`: normalize public/admin collection filters.
- `src/lib/collections/queries.test.ts`: collection query behavior.
- `src/lib/collections/repository.ts`: database-neutral collection repository and row mapping.
- `src/lib/collections/repository.test.ts`: collection filtering, sorting, limit, and trash behavior.
- `src/lib/collections/server-repository.ts`: server-only Supabase collection adapter.
- `src/lib/collections/actions.ts`: protected collection action service.
- `src/lib/collections/actions.test.ts`: collection permission, validation, and mutation behavior.
- `src/lib/featured-projects/constants.ts`: project visibility values and labels.
- `src/lib/featured-projects/types.ts`: featured-project domain, input, validation, action, and list types.
- `src/lib/featured-projects/validation.ts`: normalize and validate featured-project inputs.
- `src/lib/featured-projects/validation.test.ts`: project validation behavior.
- `src/lib/featured-projects/queries.ts`: normalize public/admin project filters.
- `src/lib/featured-projects/queries.test.ts`: project query behavior.
- `src/lib/featured-projects/repository.ts`: database-neutral project repository and row mapping.
- `src/lib/featured-projects/repository.test.ts`: project filtering, sorting, limit, and trash behavior.
- `src/lib/featured-projects/server-repository.ts`: server-only Supabase project adapter.
- `src/lib/featured-projects/actions.ts`: protected project action service.
- `src/lib/featured-projects/actions.test.ts`: project permission, validation, and mutation behavior.
- `src/lib/recommendations/types.ts`: unified homepage recommendation display type.
- `src/lib/recommendations/queries.ts`: merge and randomly select public featured candidates.
- `src/lib/recommendations/queries.test.ts`: homepage recommendation selection behavior.
- `src/lib/recommendations/server-repository.ts`: load both domains and map candidates.
- `src/app/admin/(protected)/collections/actions.ts`: collection form-data Server Actions.
- `src/app/admin/(protected)/collections/page.tsx`: collection admin list.
- `src/app/admin/(protected)/collections/new/page.tsx`: collection create route.
- `src/app/admin/(protected)/collections/[id]/edit/page.tsx`: collection edit route.
- `src/app/admin/(protected)/collections/trash/page.tsx`: collection trash route.
- `src/components/admin/collections/collection-editor.tsx`: collection editor and live card preview.
- `src/components/admin/collections/collection-admin-card.tsx`: collection admin card and trash action.
- `src/components/admin/collections/collection-filters.tsx`: collection admin filters.
- `src/components/admin/collections/collection-trash-card.tsx`: restore and permanent-delete controls.
- `src/app/admin/(protected)/projects/actions.ts`: featured-project form-data Server Actions.
- `src/app/admin/(protected)/projects/page.tsx`: featured-project admin list.
- `src/app/admin/(protected)/projects/new/page.tsx`: featured-project create route.
- `src/app/admin/(protected)/projects/[id]/edit/page.tsx`: featured-project edit route.
- `src/app/admin/(protected)/projects/trash/page.tsx`: featured-project trash route.
- `src/components/admin/featured-projects/project-editor.tsx`: project editor and live card preview.
- `src/components/admin/featured-projects/project-admin-card.tsx`: project admin card and trash action.
- `src/components/admin/featured-projects/project-filters.tsx`: project admin filters.
- `src/components/admin/featured-projects/project-trash-card.tsx`: restore and permanent-delete controls.
- `src/app/collections/page.tsx`: public collection list.
- `src/components/collections/collection-card.tsx`: public collection card.
- `src/components/collections/collection-filters.tsx`: public collection type/search/tag filters.
- `src/components/featured-projects/project-card.tsx`: public featured-project card.
- `src/components/featured-projects/project-filters.tsx`: public project search/language/tag filters.
- `docs/operations/collections-and-featured-projects.md`: migration, permission verification, and content operations.

**Modify**

- `src/app/admin/(protected)/page.tsx`: add collection and project management entries.
- `src/app/projects/page.tsx`: replace demo project cards with server-backed featured projects.
- `src/app/resources/page.tsx`: permanent redirect to `/collections`.
- `src/app/blogs/page.tsx`: permanent redirect to `/projects`.
- `src/app/page.tsx`: load a real homepage recommendation candidate.
- `src/components/home/home-dashboard.tsx`: render or hide the real recommendation card.
- `src/data/site-content.ts`: replace old recommendation navigation and remove obsolete demo exports.
- `src/components/icons.tsx`: replace obsolete navigation IDs with `collections`.
- `src/components/chrome/top-nav.tsx`: keep nested-route active state compatible with new navigation IDs.
- `src/app/globals.css`: add collection, featured-project, editor-preview, and responsive styles.
- `docs/PROJECT_STATUS.md`: record implementation and verification state as work progresses.

## Task 1: Add The Server-Only Database Foundation

**Files:**
- Create: `supabase/migrations/202606140001_collections_featured_projects.sql`

- [ ] **Step 1: Define the shared visibility and collection content enums**

Add:

```sql
create type public.recommendation_visibility as enum (
  'draft',
  'public',
  'archived'
);

create type public.collection_content_type as enum (
  'article',
  'video'
);
```

Use one explicitly named visibility enum because both domains have the same lifecycle. Do not reuse `work_visibility`, which includes the unsupported `private` state.

- [ ] **Step 2: Define `collections` with database constraints**

Create `public.collections` with the fields from the approved specification. Enforce:

```sql
check (char_length(btrim(title)) between 1 and 120),
check (summary is null or char_length(summary) <= 320),
check (external_url is null or external_url ~ '^https://'),
check (
  cover_path is null
  or cover_path like '/%'
  or cover_path ~ '^https://'
),
check (sort_order >= 0),
check (
  visibility <> 'public'
  or (
    nullif(btrim(summary), '') is not null
    and external_url is not null
  )
)
```

- [ ] **Step 3: Define `featured_projects` with Star snapshot constraints**

Create `public.featured_projects` with the fields from the approved specification. Enforce:

```sql
check (char_length(btrim(name)) between 1 and 120),
check (repository_url is null or repository_url ~ '^https://github\.com/'),
check (summary is null or char_length(summary) <= 320),
check (recommendation is null or char_length(recommendation) <= 320),
check (star_count is null or star_count >= 0),
check (
  (star_count is null and star_recorded_on is null)
  or (star_count is not null and star_recorded_on is not null)
),
check (sort_order >= 0),
check (
  visibility <> 'public'
  or (
    repository_url is not null
    and nullif(btrim(summary), '') is not null
    and nullif(btrim(recommendation), '') is not null
  )
)
```

- [ ] **Step 4: Add indexes, shared updated-at trigger, RLS, revocations, grants, and comments**

Add public-listing indexes beginning with `visibility`, `deleted_at`, `featured desc`, `sort_order`, and `updated_at desc`. Add admin-listing indexes beginning with `deleted_at` and `updated_at desc`.

Enable RLS and apply:

```sql
revoke all on table public.collections, public.featured_projects
  from anon, authenticated;

grant all on table public.collections, public.featured_projects
  to service_role;
```

Revoke trigger-function execution from browser roles and add comments stating that public pages receive server-filtered records.

- [ ] **Step 5: Inspect migration safety**

Run:

```powershell
git diff --check -- supabase/migrations/202606140001_collections_featured_projects.sql
```

Expected: no output.

- [ ] **Step 6: Commit**

```powershell
git add supabase/migrations/202606140001_collections_featured_projects.sql
git commit -m "feat: add collections and featured projects schema"
```

## Task 2: Build And Test The Collections Domain

**Files:**
- Create: `src/lib/collections/constants.ts`
- Create: `src/lib/collections/types.ts`
- Create: `src/lib/collections/validation.ts`
- Create: `src/lib/collections/validation.test.ts`
- Create: `src/lib/collections/queries.ts`
- Create: `src/lib/collections/queries.test.ts`

- [ ] **Step 1: Write failing collection validation tests**

Cover:

```ts
it("allows a draft with only a title");
it("requires summary and https external url for public collections");
it("accepts only article or video content types");
it("accepts local or https covers and rejects unsafe paths");
it("normalizes tags case-insensitively");
it("rejects negative sort order and oversized text");
```

Use a `validCollectionInput()` factory whose public defaults include:

```ts
{
  title: "Reliable AI Notes",
  contentType: "article",
  sourceName: "Example",
  summary: "Why this article is worth revisiting.",
  externalUrl: "https://example.com/article",
  coverPath: "/collections/reliable-ai.jpg",
  tags: ["AI", "Engineering"],
  visibility: "public",
  featured: true,
  sortOrder: 0,
}
```

- [ ] **Step 2: Run the validation test to verify it fails**

Run:

```powershell
npm test -- src/lib/collections/validation.test.ts
```

Expected: FAIL because the collections modules do not exist.

- [ ] **Step 3: Implement collection constants, types, and validation**

Define:

```ts
export const COLLECTION_CONTENT_TYPES = ["article", "video"] as const;
export const RECOMMENDATION_VISIBILITIES = ["draft", "public", "archived"] as const;
```

Use these key types:

```ts
export type Collection = {
  id: string;
  title: string;
  contentType: CollectionContentType;
  sourceName: string | null;
  summary: string | null;
  externalUrl: string | null;
  coverPath: string | null;
  tags: string[];
  visibility: RecommendationVisibility;
  featured: boolean;
  sortOrder: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
```

Normalize optional text to `null`, normalize HTTPS URLs with `new URL()`, reuse the safe local/HTTPS image-path rule established in `src/lib/works/validation.ts`, and limit tags to 20 items of at most 30 characters.

- [ ] **Step 4: Run collection validation tests**

Run:

```powershell
npm test -- src/lib/collections/validation.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write failing collection query tests**

Cover:

```ts
it("normalizes public type, search, and tag filters");
it("ignores unknown public content types");
it("normalizes admin search, type, and visibility filters");
```

Define:

```ts
export type PublicCollectionQuery = {
  type: CollectionContentType;
  search: string | null;
  tag: string | null;
};

export type AdminCollectionQuery = {
  search: string | null;
  type: CollectionContentType | null;
  visibility: RecommendationVisibility | null;
};
```

Default the public type to `article` when the URL has no valid type.

- [ ] **Step 6: Implement and run collection query tests**

Run:

```powershell
npm test -- src/lib/collections
```

Expected: validation and query tests PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/lib/collections
git commit -m "feat: add collections domain rules"
```

## Task 3: Build And Test The Featured Projects Domain

**Files:**
- Create: `src/lib/featured-projects/constants.ts`
- Create: `src/lib/featured-projects/types.ts`
- Create: `src/lib/featured-projects/validation.ts`
- Create: `src/lib/featured-projects/validation.test.ts`
- Create: `src/lib/featured-projects/queries.ts`
- Create: `src/lib/featured-projects/queries.test.ts`

- [ ] **Step 1: Write failing featured-project validation tests**

Cover:

```ts
it("allows a draft with only a name");
it("requires repository, summary, and recommendation for public projects");
it("requires an https github repository url");
it("requires star count and recorded date together");
it("rejects negative star count and invalid recorded date");
it("normalizes language, tags, and optional text");
```

Use a `validProjectInput()` factory whose public defaults include:

```ts
{
  name: "Focused Toolkit",
  repositoryUrl: "https://github.com/example/focused-toolkit",
  summary: "A small toolkit with clear boundaries.",
  recommendation: "A useful example of controlled complexity.",
  language: "TypeScript",
  tags: ["Tools", "Architecture"],
  starCount: "12400",
  starRecordedOn: "2026-06-14",
  visibility: "public",
  featured: true,
  sortOrder: 0,
}
```

- [ ] **Step 2: Run the project validation test to verify it fails**

Run:

```powershell
npm test -- src/lib/featured-projects/validation.test.ts
```

Expected: FAIL because the featured-project modules do not exist.

- [ ] **Step 3: Implement featured-project constants, types, and validation**

Define:

```ts
export type FeaturedProject = {
  id: string;
  name: string;
  repositoryUrl: string | null;
  summary: string | null;
  recommendation: string | null;
  language: string | null;
  tags: string[];
  starCount: number | null;
  starRecordedOn: string | null;
  visibility: RecommendationVisibility;
  featured: boolean;
  sortOrder: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
```

Validate GitHub URLs by parsing the URL and requiring:

```ts
url.protocol === "https:" && url.hostname.toLowerCase() === "github.com"
```

Require `starCount` and `starRecordedOn` together. Parse Star count only when the trimmed input is non-empty.

- [ ] **Step 4: Run featured-project validation tests**

Run:

```powershell
npm test -- src/lib/featured-projects/validation.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write and implement featured-project query tests**

Define:

```ts
export type PublicFeaturedProjectQuery = {
  search: string | null;
  language: string | null;
  tag: string | null;
};

export type AdminFeaturedProjectQuery = {
  search: string | null;
  language: string | null;
  visibility: RecommendationVisibility | null;
};
```

Cover trimmed text, invalid visibility values, and repeated query-string values using the first value.

- [ ] **Step 6: Run all featured-project domain tests**

Run:

```powershell
npm test -- src/lib/featured-projects
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/lib/featured-projects
git commit -m "feat: add featured projects domain rules"
```

## Task 4: Build And Test Server Repositories And Protected Actions

**Files:**
- Create: `src/lib/collections/repository.ts`
- Create: `src/lib/collections/repository.test.ts`
- Create: `src/lib/collections/server-repository.ts`
- Create: `src/lib/collections/actions.ts`
- Create: `src/lib/collections/actions.test.ts`
- Create: `src/app/admin/(protected)/collections/actions.ts`
- Create: `src/lib/featured-projects/repository.ts`
- Create: `src/lib/featured-projects/repository.test.ts`
- Create: `src/lib/featured-projects/server-repository.ts`
- Create: `src/lib/featured-projects/actions.ts`
- Create: `src/lib/featured-projects/actions.test.ts`
- Create: `src/app/admin/(protected)/projects/actions.ts`

- [ ] **Step 1: Write failing collection repository tests**

Verify:

```ts
it("always filters public, active collections and limits to 100");
it("applies type, search, and tag filters");
it("sorts featured first, then sort order, then updated time");
it("lists active admin collections separately from trash");
it("restores trashed collections as drafts");
it("permanently deletes only trashed collections");
```

The public request must include:

```ts
{
  filters: [
    { column: "visibility", operator: "eq", value: "public" },
    { column: "deleted_at", operator: "is", value: null },
    { column: "content_type", operator: "eq", value: "article" },
  ],
  orders: [
    { column: "featured", ascending: false },
    { column: "sort_order", ascending: true },
    { column: "updated_at", ascending: false },
  ],
  limit: 100,
}
```

- [ ] **Step 2: Implement the collection repository and server adapter**

Expose:

```ts
type CollectionRepository = {
  listPublic(query: PublicCollectionQuery): Promise<CollectionListResult>;
  listFeatured(): Promise<Collection[]>;
  listAdmin(query: AdminCollectionQuery): Promise<CollectionListResult>;
  listTrash(): Promise<Collection[]>;
  getById(id: string): Promise<Collection | null>;
  save(id: string | null, input: ValidCollectionInput): Promise<Collection>;
  moveToTrash(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  permanentlyDelete(id: string): Promise<void>;
};
```

Use direct `insert`, `update`, and `delete` operations because each record is one table row and does not require an atomic multi-table RPC.

- [ ] **Step 3: Write and implement featured-project repository tests**

Apply the same lifecycle rules while testing language/tag filters, Star field mapping, and `listFeatured()`.

Expose:

```ts
type FeaturedProjectRepository = {
  listPublic(query: PublicFeaturedProjectQuery): Promise<FeaturedProjectListResult>;
  listFeatured(): Promise<FeaturedProject[]>;
  listAdmin(query: AdminFeaturedProjectQuery): Promise<FeaturedProjectListResult>;
  listTrash(): Promise<FeaturedProject[]>;
  getById(id: string): Promise<FeaturedProject | null>;
  save(id: string | null, input: ValidFeaturedProjectInput): Promise<FeaturedProject>;
  moveToTrash(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  permanentlyDelete(id: string): Promise<void>;
};
```

- [ ] **Step 4: Write failing action-service tests for both domains**

For each domain verify:

```ts
it("rejects anonymous and non-admin writes before repository calls");
it("returns field errors without writing invalid public input");
it("writes normalized valid input for the administrator");
it("uses repository trash, restore, and permanent-delete operations");
```

- [ ] **Step 5: Implement both action services and form-data Server Actions**

Every Server Action must call `requireAdmin()` before obtaining the server-only repository.

Use these revalidation paths:

```ts
// collections
["/", "/collections", "/admin/collections", "/admin/collections/trash"]

// featured projects
["/", "/projects", "/admin/projects", "/admin/projects/trash"]
```

Parse tags from hidden JSON fields. Parse Star count and sort order as strings and let domain validation decide whether they are valid.

- [ ] **Step 6: Run repository and action tests**

Run:

```powershell
npm test -- src/lib/collections src/lib/featured-projects
```

Expected: all domain, repository, and action tests PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/lib/collections src/lib/featured-projects "src/app/admin/(protected)/collections/actions.ts" "src/app/admin/(protected)/projects/actions.ts"
git commit -m "feat: add recommendation repositories and actions"
```

## Task 5: Build Administrator Collection Management

**Files:**
- Create: `src/app/admin/(protected)/collections/page.tsx`
- Create: `src/app/admin/(protected)/collections/new/page.tsx`
- Create: `src/app/admin/(protected)/collections/[id]/edit/page.tsx`
- Create: `src/app/admin/(protected)/collections/trash/page.tsx`
- Create: `src/components/admin/collections/collection-editor.tsx`
- Create: `src/components/admin/collections/collection-admin-card.tsx`
- Create: `src/components/admin/collections/collection-filters.tsx`
- Create: `src/components/admin/collections/collection-trash-card.tsx`
- Modify: `src/app/admin/(protected)/page.tsx`

- [ ] **Step 1: Add the collection admin list and filters**

Use `parseAdminCollectionQuery()` in the server page. Render:

- keyword search;
- content-type filter;
- visibility filter;
- migration/error state;
- true empty state;
- new-item and trash links.

- [ ] **Step 2: Build the shared create/edit collection editor**

Use controlled state for:

```ts
title, contentType, sourceName, summary, externalUrl, coverPath,
tagsText, visibility, featured, sortOrder
```

Submit tags as a hidden JSON field. Show a live `CollectionCard` preview inside the editor. On successful save, call:

```ts
router.replace("/admin/collections");
```

Add a `beforeunload` warning and an explicit confirm-before-leaving handler for the return link when the editor is dirty.

- [ ] **Step 3: Add collection admin cards and trash controls**

Move-to-trash, restore, and permanent-delete controls must show pending states. Permanent deletion requires a dialog confirmation. Restore success must report that the collection is now a draft.

- [ ] **Step 4: Add collection routes and backend entry**

Create server-rendered list/new/edit/trash routes. The edit route loads by active ID and calls `notFound()` for missing or deleted records.

Add:

```tsx
<Link className="btn" href="/admin/collections">
  管理内容收藏
</Link>
```

to the admin landing page.

- [ ] **Step 5: Run focused verification**

Run:

```powershell
npm test -- src/lib/collections
npx tsc --noEmit
```

Expected: both pass.

- [ ] **Step 6: Commit**

```powershell
git add "src/app/admin/(protected)/collections" src/components/admin/collections "src/app/admin/(protected)/page.tsx"
git commit -m "feat: add collections admin workspace"
```

## Task 6: Build Administrator Featured-Project Management

**Files:**
- Create: `src/app/admin/(protected)/projects/page.tsx`
- Create: `src/app/admin/(protected)/projects/new/page.tsx`
- Create: `src/app/admin/(protected)/projects/[id]/edit/page.tsx`
- Create: `src/app/admin/(protected)/projects/trash/page.tsx`
- Create: `src/components/admin/featured-projects/project-editor.tsx`
- Create: `src/components/admin/featured-projects/project-admin-card.tsx`
- Create: `src/components/admin/featured-projects/project-filters.tsx`
- Create: `src/components/admin/featured-projects/project-trash-card.tsx`
- Modify: `src/app/admin/(protected)/page.tsx`

- [ ] **Step 1: Add the project admin list and filters**

Use `parseAdminFeaturedProjectQuery()` and render keyword, language, and visibility filters. Keep language as free text in the editor and derive available language choices from current active records.

- [ ] **Step 2: Build the shared create/edit project editor**

Use controlled state for:

```ts
name, repositoryUrl, summary, recommendation, language, tagsText,
starCount, starRecordedOn, visibility, featured, sortOrder
```

Show a live `FeaturedProjectCard` preview. When either Star field changes, keep the other visible and let server validation enforce the pair. On successful save:

```ts
router.replace("/admin/projects");
```

- [ ] **Step 3: Add project admin cards and trash controls**

Match the collection admin behavior. Do not introduce a shared generic CRUD component; the fields and public previews differ enough that explicit components are clearer.

- [ ] **Step 4: Add project routes and backend entry**

Create list/new/edit/trash routes and add:

```tsx
<Link className="btn" href="/admin/projects">
  管理优秀项目
</Link>
```

to the admin landing page.

- [ ] **Step 5: Run focused verification**

Run:

```powershell
npm test -- src/lib/featured-projects
npx tsc --noEmit
```

Expected: both pass.

- [ ] **Step 6: Commit**

```powershell
git add "src/app/admin/(protected)/projects" src/components/admin/featured-projects "src/app/admin/(protected)/page.tsx"
git commit -m "feat: add featured projects admin workspace"
```

## Task 7: Build Public Pages, Navigation, And Permanent Redirects

**Files:**
- Create: `src/app/collections/page.tsx`
- Create: `src/components/collections/collection-card.tsx`
- Create: `src/components/collections/collection-filters.tsx`
- Create: `src/components/featured-projects/project-card.tsx`
- Create: `src/components/featured-projects/project-filters.tsx`
- Modify: `src/app/projects/page.tsx`
- Modify: `src/app/resources/page.tsx`
- Modify: `src/app/blogs/page.tsx`
- Modify: `src/data/site-content.ts`
- Modify: `src/components/icons.tsx`
- Modify: `src/components/chrome/top-nav.tsx`

- [ ] **Step 1: Add public collection cards and URL filters**

`CollectionCard` must be an external semantic link:

```tsx
<a href={collection.externalUrl!} rel="noreferrer noopener" target="_blank">
```

Show content type, title, source, summary, and at most three tags. Use a content-type placeholder when there is no cover.

The filter component updates `type`, `q`, and `tag` URL parameters. Always keep a valid `type` in the URL after visitor interaction.

- [ ] **Step 2: Add the `/collections` server page**

Parse the URL query, call `listPublic()`, and render:

- controlled error state when loading fails;
- true empty state when there are no matches;
- no demo fallback.

- [ ] **Step 3: Replace `/projects` with the real featured-project page**

`FeaturedProjectCard` opens `repositoryUrl` in a new tab and shows:

- name;
- summary;
- recommendation;
- language and at most three tags;
- Star count and recorded date only when both exist.

The project filter updates `q`, `language`, and `tag` URL parameters.

- [ ] **Step 4: Add permanent redirects for obsolete public routes**

Replace the old pages with:

```ts
import { permanentRedirect } from "next/navigation";

export default function ResourcesPage() {
  permanentRedirect("/collections");
}
```

Apply the equivalent redirect from `/blogs` to `/projects`.

- [ ] **Step 5: Update navigation and remove obsolete demo exports**

Change `NavId` and `navigation` so the active public entries are:

```ts
{ id: "collections", href: "/collections", label: "内容收藏" },
{ id: "projects", href: "/projects", label: "优秀项目" },
```

Remove `resources`, `blogs`, `projects`, and `DirectoryItem` demo exports only after confirming no remaining imports. Add a rounded line `collections` icon using `currentColor`.

- [ ] **Step 6: Add navigation/redirect regression tests**

Create focused tests near the relevant domain modules or route helpers that verify:

- navigation contains `/collections` and `/projects`;
- navigation no longer exposes `/resources` or `/blogs`;
- redirect destinations are `/collections` and `/projects`.

Prefer extracting tiny pure redirect-target constants only if required to test without rendering Next.js routes.

- [ ] **Step 7: Run public-route verification**

Run:

```powershell
npm test -- src/lib/collections src/lib/featured-projects
npx tsc --noEmit
```

Expected: both pass.

- [ ] **Step 8: Commit**

```powershell
git add src/app/collections src/app/projects src/app/resources src/app/blogs src/components/collections src/components/featured-projects src/data/site-content.ts src/components/icons.ts src/components/chrome/top-nav.tsx
git commit -m "feat: add public collections and featured projects"
```

## Task 8: Connect The Homepage Recommendation Module

**Files:**
- Create: `src/lib/recommendations/types.ts`
- Create: `src/lib/recommendations/queries.ts`
- Create: `src/lib/recommendations/queries.test.ts`
- Create: `src/lib/recommendations/server-repository.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/components/home/home-dashboard.tsx`

- [ ] **Step 1: Write failing recommendation mapping and selection tests**

Define:

```ts
export type HomeRecommendation = {
  id: string;
  type: "article" | "video" | "project";
  title: string;
  reason: string;
  href: string;
};
```

Cover:

```ts
it("maps public featured collections to article or video recommendations");
it("maps public featured projects to project recommendations");
it("returns null when there are no candidates");
it("uses the injected random function to select one candidate");
```

Inject randomness:

```ts
export function selectHomeRecommendation(
  candidates: HomeRecommendation[],
  random: () => number = Math.random,
) { /* ... */ }
```

- [ ] **Step 2: Implement recommendation mapping and the server repository**

The server repository loads `listFeatured()` from both domains in parallel, maps only complete public candidates, merges them, and returns one random candidate. If either domain query fails, the homepage loader catches the error and returns `null`.

- [ ] **Step 3: Update the homepage server page**

Load plans, site settings, and recommendation in one `Promise.all`:

```ts
const [planCandidates, configuration, recommendation] = await Promise.all([
  loadHomePlans(),
  loadConfiguration(),
  loadHomeRecommendation(),
]);
```

Pass `recommendation` to `HomeDashboard`.

- [ ] **Step 4: Replace the demo recommendation card**

Render the recommendation module only when:

```ts
visible.recommendation && recommendation
```

The card must display only type, title, and reason, and open `recommendation.href` in a new tab with safe `rel`. Do not show metrics or demo copy.

- [ ] **Step 5: Run recommendation and homepage verification**

Run:

```powershell
npm test -- src/lib/recommendations src/lib/collections src/lib/featured-projects
npx tsc --noEmit
```

Expected: both pass.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/recommendations src/app/page.tsx src/components/home/home-dashboard.tsx
git commit -m "feat: connect real homepage recommendations"
```

## Task 9: Add Confirmed Visual System And Responsive Behavior

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add public collection card styles**

Use existing tokens and shared `.glass`, `.card`, `.lift`, `.pill`, and `.btn` patterns. Add:

- 16:9 cover or type-placeholder area;
- compact information hierarchy;
- visible external-link focus state;
- three desktop columns, two tablet columns, one mobile column.

- [ ] **Step 2: Add featured-project card styles**

Use a compact project mark and text-first information hierarchy. Keep Star snapshot visually secondary and include the recorded date in the same metadata line.

- [ ] **Step 3: Add admin editor preview and responsive styles**

Keep editors usable at approximately 320px. At narrow widths:

- forms and previews become one column;
- filter controls become one column;
- action rows wrap without page-level overflow.

- [ ] **Step 4: Run low-cost visual-code verification**

Run:

```powershell
npm run lint
npx tsc --noEmit
git diff --check
```

Expected: all pass with no output from `git diff --check`.

- [ ] **Step 5: Commit**

```powershell
git add src/app/globals.css
git commit -m "style: add collection and project layouts"
```

## Task 10: Document Operations, Apply Migration, And Complete Acceptance

**Files:**
- Create: `docs/operations/collections-and-featured-projects.md`
- Modify: `docs/PROJECT_STATUS.md`
- Modify only implementation files required by confirmed defects.

- [ ] **Step 1: Write the operations guide**

Document:

- applying `supabase/migrations/202606140001_collections_featured_projects.sql` in Supabase SQL Editor;
- verifying both tables exist and have RLS enabled;
- verifying `anon` and `authenticated` cannot read or write either table;
- verifying the server Secret Key can create, read, update, and delete temporary test records;
- deleting verification records after testing;
- normal collection/project publishing and trash workflows;
- never recording keys, administrator IDs, session data, or private values.

- [ ] **Step 2: Run the full automated suite**

Run sequentially, not in parallel:

```powershell
npm test
npm run lint
npx tsc --noEmit
git diff --check
```

Expected:

- all tests pass;
- lint exits 0;
- TypeScript exits 0;
- `git diff --check` has no output.

- [ ] **Step 3: Apply and verify the migration against Supabase cloud**

Ask the user to execute the migration through the Supabase Dashboard SQL Editor. Do not install Supabase CLI or Docker.

Record only pass/fail outcomes for:

- migration execution;
- browser-role read/write denial;
- server-only create/read/update/delete;
- cleanup of temporary verification records.

- [ ] **Step 4: Run the single final production build**

Stop any local development server first. Run:

```powershell
npm run build
```

Expected: production build succeeds. If Windows reports an `.next` EPERM error, report it immediately and retry the same build once with narrow elevated permission. Do not repeat the build for unrelated reasons.

- [ ] **Step 5: Start one local acceptance server**

Use the existing dependencies; do not install anything. If the in-app browser cannot reach localhost, provide the URL for external-browser acceptance.

- [ ] **Step 6: Verify desktop and mobile acceptance**

Verify:

1. create and edit collection drafts;
2. reject invalid public collections;
3. article/video switching, search, tag filters, empty state, external links;
4. create and edit project drafts;
5. reject invalid project URLs and incomplete Star snapshots;
6. language/tag/search project filters and external links;
7. trash, restore-to-draft, and permanent delete for both domains;
8. public isolation for draft, archived, and deleted records;
9. homepage recommendation content and hide-on-empty/error behavior;
10. `/resources` and `/blogs` permanent redirects;
11. desktop, tablet, and approximately 320px layouts without horizontal scrolling.

- [ ] **Step 7: Fix only confirmed acceptance defects**

For each confirmed defect:

1. write or update the smallest relevant regression test;
2. verify it fails when practical;
3. make the narrow fix;
4. rerun the focused test, lint, and type check;
5. commit only the involved files.

- [ ] **Step 8: Update the project handoff**

Update `docs/PROJECT_STATUS.md` with:

- actual implementation state;
- migration and cloud permission verification outcome;
- final automated verification counts;
- browser acceptance outcome;
- active branch and Pull Request state;
- next roadmap step.

- [ ] **Step 9: Final review and publish readiness**

Run:

```powershell
git status --short --branch
git diff --check origin/main...HEAD
git log --oneline origin/main..HEAD
```

Use the `requesting-code-review` skill. Fix Critical and Important findings before pushing or creating a Pull Request.

- [ ] **Step 10: Commit documentation**

```powershell
git add docs/operations/collections-and-featured-projects.md docs/PROJECT_STATUS.md
git commit -m "docs: add recommendation content operations"
```
