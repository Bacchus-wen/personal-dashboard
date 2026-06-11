# Recent Plans Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Do not dispatch subagents unless the user explicitly approves them. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a secure, maintainable recent-plans workflow with administrator CRUD, categories, trash recovery, a public `/plans` page, and an interactive homepage plan preview.

**Architecture:** Next.js Server Components read planning data through focused server-only repository functions. Every Server Action revalidates the single administrator before using the Supabase Secret Key. Domain validation, sorting, date labels, and URL safety are implemented as pure tested functions; browser components only own interaction state.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase PostgreSQL, Server Actions, Vitest, `react-markdown`, `remark-gfm`, existing CSS design tokens

---

## Execution Rules

- Work in `F:\网站制作\.worktrees\moderate-auth-foundation` on `feature/moderate-auth-foundation`.
- Before installing `react-markdown` and `remark-gfm`, explain purpose, expected disk use, npm cache location, possible C-drive impact, and the no-install fallback; wait for explicit approval.
- Use the project-local F-drive npm cache configuration already present. Do not install Docker or Supabase CLI.
- Apply cloud SQL through the Supabase Dashboard SQL Editor only after showing the migration to the user.
- Never print `.env.local`, Secret Key, publishable key, administrator ID, or authenticated session tokens.
- Use TDD for domain rules, query parsing, authorization wrappers, and repository mapping.
- Reuse existing visual tokens and shared `.glass`, `.card`, `.pill`, `.btn`, filter, and pagination patterns.
- Keep route pages server-rendered; isolate timers, hover state, dialog state, filters, and unsaved-form behavior in focused client components.
- Commit after each completed task. Do not merge or mark the draft PR ready without user approval.

## Planned Structure

```text
src/
├── app/
│   ├── admin/(protected)/
│   │   ├── page.tsx
│   │   └── plans/
│   │       ├── actions.ts
│   │       ├── page.tsx
│   │       ├── new/page.tsx
│   │       ├── [id]/edit/page.tsx
│   │       └── trash/page.tsx
│   ├── page.tsx
│   ├── plans/page.tsx
│   └── globals.css
├── components/
│   ├── admin/plans/
│   │   ├── category-manager.tsx
│   │   ├── delete-plan-button.tsx
│   │   ├── plan-admin-card.tsx
│   │   ├── plan-editor.tsx
│   │   ├── plan-filters.tsx
│   │   └── trash-plan-card.tsx
│   ├── home/
│   │   ├── home-dashboard.tsx
│   │   └── recent-plan-widget.tsx
│   └── plans/
│       ├── deadline-label.tsx
│       ├── markdown-content.tsx
│       ├── plan-card.tsx
│       ├── plan-filters.tsx
│       └── plan-pagination.tsx
└── lib/plans/
    ├── actions.ts
    ├── constants.ts
    ├── date-label.test.ts
    ├── date-label.ts
    ├── queries.test.ts
    ├── queries.ts
    ├── repository.ts
    ├── types.ts
    ├── validation.test.ts
    └── validation.ts
supabase/migrations/202606110002_recent_plans.sql
docs/operations/recent-plans.md
```

## Task 1: Approve Markdown Dependencies And Establish A Green Baseline

**Files:**
- Modify after approval: `package.json`
- Modify after approval: `package-lock.json`

- [ ] **Step 1: Explain the dependency request and wait for approval**

Explain that:

- `react-markdown` safely renders Markdown without enabling embedded raw HTML by default.
- `remark-gfm` adds tables, task lists, strikethrough, and link support.
- Both install into project-local `node_modules` on F drive; npm may use the configured project-local `.npm-cache`.
- The no-install fallback is a plain-text editor and plain-text display, which does not meet the approved Markdown design.

- [ ] **Step 2: Record the pre-install disk state**

Run:

```powershell
Get-ChildItem node_modules -Recurse -File | Measure-Object Length -Sum
Get-ChildItem .npm-cache -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum
```

Expected: commands report current F-drive project dependency and cache sizes without reading C-drive content.

- [ ] **Step 3: Install only after explicit approval**

Run:

```powershell
npm install react-markdown remark-gfm
```

Expected: installation succeeds without adding unrelated packages explicitly.

- [ ] **Step 4: Measure and report the actual disk change**

Run the same measurement commands and report the before/after difference.

- [ ] **Step 5: Verify the existing baseline**

Run:

```powershell
npm test
npm run lint
npm run build
git diff --check
```

Expected: all commands pass before recent-plans implementation begins.

- [ ] **Step 6: Commit dependencies**

```powershell
git add package.json package-lock.json
git commit -m "chore: add plan markdown dependencies"
```

## Task 2: Create The Database Schema And Deny Browser Access

**Files:**
- Create: `supabase/migrations/202606110002_recent_plans.sql`
- Create: `docs/operations/recent-plans.md`

- [ ] **Step 1: Create the migration**

Create enums, tables, constraints, indexes, timestamp triggers, and permissions:

```sql
create type public.plan_status as enum (
  'not_started',
  'in_progress',
  'paused',
  'completed',
  'cancelled'
);

create type public.plan_visibility as enum ('draft', 'private', 'public');
create type public.plan_priority as enum ('high', 'medium', 'low');

create table public.plan_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index plan_categories_name_ci_unique
  on public.plan_categories (lower(btrim(name)));

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  title text,
  summary text,
  description text,
  status public.plan_status not null default 'not_started',
  visibility public.plan_visibility not null default 'draft',
  priority public.plan_priority not null default 'medium',
  progress integer not null default 0 check (progress between 0 and 100),
  deadline date,
  related_url text,
  category_id uuid references public.plan_categories(id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    visibility = 'draft'
    or (
      nullif(btrim(title), '') is not null
      and nullif(btrim(summary), '') is not null
    )
  ),
  check (
    (status = 'not_started' and progress = 0)
    or (status = 'in_progress' and progress between 1 and 99)
    or (status = 'completed' and progress = 100)
    or status in ('paused', 'cancelled')
  )
);

create index plans_public_listing_idx
  on public.plans (visibility, deleted_at, status, priority, deadline);
create index plans_updated_at_idx on public.plans (updated_at desc);
create index plans_category_id_idx on public.plans (category_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_plan_categories_updated_at
before update on public.plan_categories
for each row execute function public.set_updated_at();

create trigger set_plans_updated_at
before update on public.plans
for each row execute function public.set_updated_at();

alter table public.plan_categories enable row level security;
alter table public.plans enable row level security;

revoke all on table public.plan_categories, public.plans from anon, authenticated;
grant all on table public.plan_categories, public.plans to service_role;
```

- [ ] **Step 2: Run static migration checks**

Run:

```powershell
rg -n "enable row level security|revoke all|grant all.*service_role|on delete set null" supabase/migrations/202606110002_recent_plans.sql
git diff --check
```

Expected: both tables enable RLS, browser roles are revoked, service role is granted access, and category deletion sets plans to uncategorized.

- [ ] **Step 3: Document the cloud application and rollback procedure**

Document:

- copying the full migration into Supabase Dashboard SQL Editor;
- confirming both tables exist in Table Editor;
- checking RLS is enabled;
- verifying `anon` and `authenticated` cannot select or insert;
- verifying Secret Key server access succeeds;
- a rollback section that drops triggers, tables, enums, and `set_updated_at()` only if no planning data must be retained.

- [ ] **Step 4: Ask the user to apply the migration**

Do not run a CLI or install tooling. Wait for the user to report that Supabase SQL Editor completed successfully.

- [ ] **Step 5: Commit the schema**

```powershell
git add supabase/migrations/202606110002_recent_plans.sql docs/operations/recent-plans.md
git commit -m "feat: add recent plans database schema"
```

## Task 3: Test And Implement The Planning Domain Rules

**Files:**
- Create: `src/lib/plans/constants.ts`
- Create: `src/lib/plans/types.ts`
- Create: `src/lib/plans/validation.test.ts`
- Create: `src/lib/plans/validation.ts`
- Create: `src/lib/plans/date-label.test.ts`
- Create: `src/lib/plans/date-label.ts`

- [ ] **Step 1: Define stable domain types**

Create literal constants and derived types:

```ts
export const PLAN_STATUSES = [
  "not_started",
  "in_progress",
  "paused",
  "completed",
  "cancelled",
] as const;

export const PLAN_VISIBILITIES = ["draft", "private", "public"] as const;
export const PLAN_PRIORITIES = ["high", "medium", "low"] as const;

export type PlanStatus = (typeof PLAN_STATUSES)[number];
export type PlanVisibility = (typeof PLAN_VISIBILITIES)[number];
export type PlanPriority = (typeof PLAN_PRIORITIES)[number];
```

Define `Plan`, `PlanCategory`, `PlanInput`, `PlanFieldErrors`, and `PlanActionResult` in `types.ts`. Keep database enum strings identical to the migration.

- [ ] **Step 2: Write failing validation tests**

Cover:

```ts
it("forces not-started progress to zero", () => {
  expect(validatePlanInput(validInput({ status: "not_started", progress: 72 })).data?.progress).toBe(0);
});

it("forces completed progress to one hundred", () => {
  expect(validatePlanInput(validInput({ status: "completed", progress: 72 })).data?.progress).toBe(100);
});

it("rejects an in-progress value outside one through ninety-nine", () => {
  expect(validatePlanInput(validInput({ status: "in_progress", progress: 100 })).errors.progress).toBeDefined();
});

it("allows incomplete drafts but rejects incomplete public plans", () => {
  expect(validatePlanInput(validInput({ visibility: "draft", title: "", summary: "" })).ok).toBe(true);
  expect(validatePlanInput(validInput({ visibility: "public", title: "", summary: "" })).ok).toBe(false);
});

it("accepts safe internal and HTTP links and rejects executable protocols", () => {
  expect(validateRelatedUrl("/works/site")).toBe("/works/site");
  expect(validateRelatedUrl("https://example.com")).toBe("https://example.com/");
  expect(validateRelatedUrl("javascript:alert(1)")).toBeNull();
});
```

- [ ] **Step 3: Run focused tests and confirm failure**

Run:

```powershell
npx vitest run src/lib/plans/validation.test.ts
```

Expected: FAIL because domain validation is not implemented.

- [ ] **Step 4: Implement minimal normalization and validation**

Implement:

- trim title, summary, description, category ID, and URL;
- normalize blank optional values to `null`;
- parse and clamp only valid integer progress values;
- enforce enum membership;
- force `not_started` to `0` and `completed` to `100`;
- require `1..99` for `in_progress`;
- require title and summary for private/public;
- accept only `/safe-relative-path`, `http:`, and `https:`;
- reject `//host`, backslashes, and control characters in internal paths.

- [ ] **Step 5: Write failing local-date label tests**

Use explicit local dates to avoid machine-time dependence:

```ts
expect(getDeadlineLabel("2026-06-10", new Date(2026, 5, 11))).toEqual({
  tone: "danger",
  text: "已逾期 1 天",
});
expect(getDeadlineLabel("2026-06-11", new Date(2026, 5, 11)).text).toBe("今天截止");
expect(getDeadlineLabel("2026-06-14", new Date(2026, 5, 11)).text).toBe("剩余 3 天");
expect(getDeadlineLabel(null, new Date(2026, 5, 11)).text).toBe("暂未设定截止日期");
```

- [ ] **Step 6: Implement local-date parsing without UTC drift**

Parse `YYYY-MM-DD` into `new Date(year, month - 1, day)` and compare local calendar-day numbers. Do not call `new Date("YYYY-MM-DD")`, because browsers interpret that form as UTC.

- [ ] **Step 7: Run domain tests and commit**

Run:

```powershell
npx vitest run src/lib/plans
npm test
git diff --check
```

Expected: all domain tests pass.

```powershell
git add src/lib/plans
git commit -m "feat: add recent plan domain rules"
```

## Task 4: Test And Implement Query Parsing, Sorting, And Pagination

**Files:**
- Create: `src/lib/plans/queries.test.ts`
- Create: `src/lib/plans/queries.ts`

- [ ] **Step 1: Write failing query-rule tests**

Test:

- invalid page values become page `1`;
- public page size is `9`, admin page size is `12`;
- only allowed status, priority, visibility, category, overdue, and search values survive parsing;
- public sorting places high before medium before low;
- equal priorities place dated plans before undated plans;
- equal priority/date uses newest `updated_at`;
- homepage candidate selection chooses the most recently overdue plan before future plans using an explicit local date.

Use this homepage selection fixture:

```ts
const result = chooseHomePlan([
  plan({ id: "old-overdue", deadline: "2026-06-01" }),
  plan({ id: "recent-overdue", deadline: "2026-06-10" }),
  plan({ id: "future", deadline: "2026-06-12" }),
], "2026-06-11");

expect(result?.id).toBe("recent-overdue");
```

- [ ] **Step 2: Run focused tests and confirm failure**

Run:

```powershell
npx vitest run src/lib/plans/queries.test.ts
```

Expected: FAIL because query helpers do not exist.

- [ ] **Step 3: Implement query helpers**

Export:

```ts
export const PUBLIC_PLAN_PAGE_SIZE = 9;
export const ADMIN_PLAN_PAGE_SIZE = 12;

export function parsePublicPlanQuery(params: Record<string, string | string[] | undefined>): PublicPlanQuery;
export function parseAdminPlanQuery(params: Record<string, string | string[] | undefined>): AdminPlanQuery;
export function comparePublicPlans(a: Plan, b: Plan): number;
export function chooseHomePlan(plans: Plan[], today: string): Plan | null;
```

Keep helpers pure. Query parsing must ignore unknown values rather than forwarding them to Supabase.

- [ ] **Step 4: Run tests and commit**

```powershell
npx vitest run src/lib/plans/queries.test.ts
npm test
git diff --check
git add src/lib/plans/queries.ts src/lib/plans/queries.test.ts
git commit -m "feat: add recent plan query rules"
```

## Task 5: Build The Server-Only Repository

**Files:**
- Create: `src/lib/plans/repository.test.ts`
- Create: `src/lib/plans/repository.ts`

- [ ] **Step 1: Write failing repository mapping tests with an injected client**

Test that:

- public queries always include `visibility = public`, `deleted_at is null`, and allowed public statuses;
- public category queries return only categories used by currently public valid plans;
- home queries exclude paused and deadline-less records;
- admin queries include deleted rows only for trash mode;
- database errors become a typed `PlanRepositoryError`;
- public results expose no administrator-only fields beyond the approved `Plan` display shape.

- [ ] **Step 2: Run focused tests and confirm failure**

```powershell
npx vitest run src/lib/plans/repository.test.ts
```

Expected: FAIL because the repository is absent.

- [ ] **Step 3: Implement server-only repository functions**

Start the module with:

```ts
import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
```

Implement `createPlanRepository(client)` for tests, then export a production repository created with `createSupabaseAdminClient()`. The repository exposes focused functions:

```ts
export type PlanRepository = {
  listPublicPlans(query: PublicPlanQuery): Promise<PaginatedPlans>;
  listPublicCategories(): Promise<PlanCategory[]>;
  getHomePlanCandidates(): Promise<Plan[]>;
  listAdminPlans(query: AdminPlanQuery): Promise<PaginatedPlans>;
  listTrashPlans(page: number): Promise<PaginatedPlans>;
  getPlanById(id: string): Promise<Plan | null>;
  listCategories(): Promise<PlanCategory[]>;
  countPlansForCategory(id: string): Promise<number>;
  createPlan(input: ValidPlanInput): Promise<Plan>;
  updatePlan(id: string, input: ValidPlanInput): Promise<Plan>;
  movePlanToTrash(id: string): Promise<void>;
  restorePlan(id: string): Promise<void>;
  permanentlyDeletePlan(id: string): Promise<void>;
  createCategory(name: string): Promise<PlanCategory>;
  renameCategory(id: string, name: string): Promise<PlanCategory>;
  deleteCategory(id: string): Promise<void>;
};

export function createPlanRepository(client: PlansDatabaseClient): PlanRepository;
export const planRepository: PlanRepository;
```

Use explicit selected columns, `{ count: "exact" }`, and `.range(from, to)`. Never expose the Supabase client to components.

- [ ] **Step 4: Run repository tests and full checks**

```powershell
npx vitest run src/lib/plans/repository.test.ts
npm test
npm run lint
git diff --check
```

- [ ] **Step 5: Commit**

```powershell
git add src/lib/plans/repository.ts src/lib/plans/repository.test.ts
git commit -m "feat: add server-only recent plan repository"
```

## Task 6: Build Protected Server Actions

**Files:**
- Create: `src/lib/plans/actions.test.ts`
- Create: `src/lib/plans/actions.ts`
- Create: `src/app/admin/(protected)/plans/actions.ts`

- [ ] **Step 1: Write failing action-service tests**

Using injected current-user ID and repository operations, prove that:

- anonymous and non-admin requests fail before repository calls;
- invalid inputs return structured field errors;
- valid admin writes call the intended repository function;
- restore forces visibility to draft;
- the revalidation-path helper returns `/`, `/plans`, `/admin/plans`, and `/admin/plans/trash`.

- [ ] **Step 2: Run focused tests and confirm failure**

```powershell
npx vitest run src/lib/plans/actions.test.ts
```

Expected: FAIL because action services do not exist.

- [ ] **Step 3: Implement testable protected action services**

Use `runProtectedAdminOperation()` around validation and repository calls. Return:

```ts
export type PlanActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
  planId?: string;
};
```

Keep framework-specific redirects and revalidation outside the pure action service. Export and test a small `getPlanMutationRevalidationPaths()` helper so every successful mutation refreshes the same approved paths.

- [ ] **Step 4: Implement Server Action wrappers**

Start the route action file with `"use server"`. Each exported action must:

1. call `requireAdmin()` or obtain and verify the authenticated user inside the action;
2. parse `FormData` or explicit bound IDs;
3. call the tested action service;
4. call `revalidatePath("/")`, `revalidatePath("/plans")`, `revalidatePath("/admin/plans")`, and `revalidatePath("/admin/plans/trash")` only after success;
5. return a serializable `PlanActionResult`.

- [ ] **Step 5: Run checks and commit**

```powershell
npx vitest run src/lib/plans/actions.test.ts
npm test
npm run lint
npm run build
git diff --check
git add src/lib/plans/actions.ts src/lib/plans/actions.test.ts "src/app/admin/(protected)/plans/actions.ts"
git commit -m "feat: add protected recent plan actions"
```

## Task 7: Build The Administrator Plan List And Category Manager

**Files:**
- Modify: `src/app/admin/(protected)/page.tsx`
- Create: `src/app/admin/(protected)/plans/page.tsx`
- Create: `src/components/admin/plans/plan-admin-card.tsx`
- Create: `src/components/admin/plans/plan-filters.tsx`
- Create: `src/components/admin/plans/category-manager.tsx`
- Create: `src/components/plans/plan-pagination.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add an administrator navigation entry**

Update the protected admin landing page with a semantic link to `/admin/plans`. Keep sign-out available.

- [ ] **Step 2: Build the server-rendered list route**

The page must:

- await Next.js 16 `searchParams`;
- parse only approved query values with `parseAdminPlanQuery`;
- load plans and categories through the repository;
- render a real error state instead of an empty list when loading fails;
- show 12 cards per page;
- preserve active query parameters in pagination links.

- [ ] **Step 3: Build URL-backed filters**

Create a focused client component that uses `useRouter()`, `usePathname()`, and `useSearchParams()` to update:

- `q`
- `status`
- `visibility`
- `priority`
- `overdue`
- `page`

Every filter change must set `page=1`. Use a normal search submit or a short local debounce; do not query the database directly from the browser.

- [ ] **Step 4: Build administrator cards**

Each card shows:

- title or “未命名规划”;
- status, visibility, priority, progress, category, and deadline;
- edit link;
- single-record trash action.

- [ ] **Step 5: Build category management dialog**

The dialog must:

- list categories;
- create and rename with a maximum length of 20;
- show the affected-plan count before deleting;
- invoke protected Server Actions;
- show structured success and error messages;
- use a native `<dialog>` or an accessible dialog pattern with labelled controls.

- [ ] **Step 6: Style and verify**

Run:

```powershell
npm test
npm run lint
npm run build
git diff --check
```

Verify manually that `/admin/plans` redirects when logged out and renders list/filter empty states when logged in.

- [ ] **Step 7: Commit**

```powershell
git add src/app/admin src/components/admin/plans src/components/plans/plan-pagination.tsx src/app/globals.css
git commit -m "feat: add administrator recent plan list"
```

## Task 8: Build New/Edit Forms And Safe Markdown Preview

**Files:**
- Create: `src/app/admin/(protected)/plans/new/page.tsx`
- Create: `src/app/admin/(protected)/plans/[id]/edit/page.tsx`
- Create: `src/components/admin/plans/plan-editor.tsx`
- Create: `src/components/plans/markdown-content.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Build the reusable Markdown renderer**

Use:

```tsx
<ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
  {content}
</ReactMarkdown>
```

Override link rendering so only `validateRelatedUrl()` approved links render as anchors. External anchors use `target="_blank"` and `rel="noreferrer noopener"`. Invalid links render as plain text.

- [ ] **Step 2: Build the client plan editor**

The same editor handles new and edit routes. It includes:

- title;
- summary;
- Markdown description plus preview tab;
- status;
- visibility;
- priority;
- progress;
- deadline;
- related link;
- category;
- explicit Save button;
- pending, success, page-level error, and field-level error states.

When status changes to `not_started` or `completed`, update the visible progress immediately to `0` or `100`; server validation remains authoritative.

- [ ] **Step 3: Add unsaved-change protection**

Track whether current values differ from initial values. When dirty:

- register `beforeunload`;
- intercept links inside the editor action area with an explicit confirmation;
- clear dirty state only after a successful save.

Do not attempt to globally patch Next.js router behavior.

- [ ] **Step 4: Build the routes**

- `/admin/plans/new` provides default values.
- `/admin/plans/[id]/edit` awaits `params`, loads the record, and calls `notFound()` when absent or trashed.
- Both routes load categories server-side.

- [ ] **Step 5: Verify and commit**

Run:

```powershell
npm test
npm run lint
npm run build
git diff --check
```

Manually verify new draft, incomplete-public validation, state/progress correction, Markdown preview, save feedback, and unsaved-navigation warning.

```powershell
git add "src/app/admin/(protected)/plans" src/components/admin/plans/plan-editor.tsx src/components/plans/markdown-content.tsx src/app/globals.css
git commit -m "feat: add recent plan editor"
```

## Task 9: Build Trash Recovery And Permanent Deletion

**Files:**
- Create: `src/app/admin/(protected)/plans/trash/page.tsx`
- Create: `src/components/admin/plans/trash-plan-card.tsx`
- Create: `src/components/admin/plans/delete-plan-button.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Build the trash route**

Load only `deleted_at is not null` records, 12 per page. Show title fallback, deletion time, former status, and former visibility.

- [ ] **Step 2: Build restore behavior**

Restore calls the protected action, clears `deleted_at`, forces `visibility = draft`, refreshes affected paths, and shows a clear success or failure result.

- [ ] **Step 3: Build permanent-delete confirmation**

Use an accessible confirmation dialog with:

- the planning title;
- explicit “删除后无法恢复” text;
- neutral Cancel button;
- visually dangerous “永久删除” button;
- disabled duplicate submission while pending.

- [ ] **Step 4: Verify and commit**

Manually verify trash, restore-to-draft, and permanent deletion. Confirm trashed records disappear immediately from `/plans` and the homepage.

```powershell
npm test
npm run lint
npm run build
git diff --check
git add "src/app/admin/(protected)/plans/trash" src/components/admin/plans src/app/globals.css
git commit -m "feat: add recent plan trash workflow"
```

## Task 10: Build The Public Plans Page

**Files:**
- Create: `src/app/plans/page.tsx`
- Create: `src/components/plans/deadline-label.tsx`
- Create: `src/components/plans/plan-card.tsx`
- Create: `src/components/plans/plan-filters.tsx`
- Modify: `src/components/chrome/page-shell.tsx`
- Modify: `src/data/site-content.ts`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add `/plans` to public navigation**

Update the navigation data and icon typing so “近日规划” links to `/plans`. Preserve existing routes not yet migrated; do not remove unrelated navigation items in this task.

- [ ] **Step 2: Build the server-rendered page**

The route:

- awaits `searchParams`;
- parses status, priority, category, and page;
- loads only public valid statuses through the repository;
- loads only categories currently used by public valid plans;
- renders 9 cards per page;
- renders an error state on repository failure;
- renders an empty state when filters match no plans.

- [ ] **Step 3: Build public filters and pagination**

Filters are URL-backed and combinable. Changing a filter resets `page=1`. Pagination preserves filters.

- [ ] **Step 4: Build expandable public cards**

Cards initially show summary and metadata. “展开详情” reveals `MarkdownContent` and the validated related link in place; “收起详情” closes it. Only the card’s expanded state is client-side.

- [ ] **Step 5: Build local deadline labels**

`DeadlineLabel` computes its text after mount using the visitor’s local date and the tested `getDeadlineLabel()` helper. Before hydration, render the plain stored date or “暂未设定截止日期” to avoid showing an incorrect server-time relative label.

- [ ] **Step 6: Verify and commit**

Run:

```powershell
npm test
npm run lint
npm run build
git diff --check
```

Manually verify filters, pagination, expanded Markdown, external-link behavior, empty state, error state, and 320px layout.

```powershell
git add src/app/plans src/components/plans src/components/chrome/page-shell.tsx src/data/site-content.ts src/app/globals.css
git commit -m "feat: add public recent plans page"
```

## Task 11: Replace The Homepage Player With The Recent Plan Widget

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/home/home-dashboard.tsx`
- Create: `src/components/home/recent-plan-widget.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Move homepage data loading to the server page**

Make `src/app/page.tsx` load only eligible public home candidates through the repository and pass the candidates or an unavailable/empty result into `HomeDashboard`. The browser widget uses the tested `chooseHomePlan()` helper with the visitor’s local calendar date to choose the displayed item.

Do not let a planning database failure break the rest of the homepage.

- [ ] **Step 2: Remove the demo Player component**

Delete only the homepage demo player implementation and replace its position with `RecentPlanWidget`. Leave unrelated clock, calendar, and dashboard components unchanged.

- [ ] **Step 3: Build desktop hover preview**

The widget:

- starts a 300 ms timer on pointer enter;
- cancels the timer on early pointer leave;
- keeps the preview open while pointer is over either trigger or preview;
- closes after leaving the combined interaction region;
- links a desktop trigger click to `/plans`;
- shows title, category, status, priority, progress, deadline, summary, safe plain-text description preview, and related link.

- [ ] **Step 4: Build mobile dialog behavior**

For coarse-pointer/mobile interaction, trigger click opens a dialog instead of navigating immediately. The dialog closes by close button, backdrop, or Escape/back behavior and provides a “查看全部规划” link to `/plans`.

- [ ] **Step 5: Handle empty and unavailable states**

- Empty: “近期暂无公开规划”.
- Repository unavailable: “规划暂时无法加载，请稍后重试”.
- Both states preserve the widget’s footprint and do not open a meaningless preview.

- [ ] **Step 6: Verify and commit**

Run:

```powershell
npm test
npm run lint
npm run build
git diff --check
```

Use the in-app browser to verify desktop hover timing/retention, click navigation, mobile dialog behavior, and that the homepage does not regain unwanted vertical overflow.

```powershell
git add src/app/page.tsx src/components/home src/app/globals.css
git commit -m "feat: add homepage recent plan preview"
```

## Task 12: Cloud Permission Verification, Operations Documentation, And Final Review

**Files:**
- Modify: `docs/operations/recent-plans.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Verify actual Supabase cloud permissions without exposing secrets**

Using the existing `.env.local` values only inside a temporary local verification command:

- publishable-key anonymous select and insert on `plans` fail;
- authenticated browser-role select and insert fail;
- Secret Key create/read/update/delete succeeds on a uniquely marked temporary draft;
- the temporary draft and category are removed afterward.

Record pass/fail outcomes only. Do not record keys, user IDs, tokens, or project URLs.

- [ ] **Step 2: Document operator workflows**

Document:

- applying the migration;
- creating and publishing a plan;
- changing a public plan to private;
- managing categories;
- restoring and permanently deleting;
- interpreting page-level database errors;
- checking permissions after future schema changes;
- backup expectations before destructive migration changes.

- [ ] **Step 3: Update project guidance**

Add focused rules to `AGENTS.md`:

- planning tables remain server-only;
- every planning mutation revalidates admin identity;
- public queries must enforce visibility/status/deleted filters server-side;
- new migrations must revoke browser roles and be cloud-verified;
- installs still require prior user approval.

- [ ] **Step 4: Run complete automated verification**

Run:

```powershell
npm test
npm run lint
npm run build
git diff --check
git status --short
```

Expected: tests, lint, build, and diff checks pass; only intended documentation changes remain before the final commit.

- [ ] **Step 5: Run browser verification**

Verify at desktop and mobile widths:

- anonymous `/admin/plans` redirect;
- administrator list, filters, pagination, category management, new/edit, validation, trash, restore, permanent delete;
- public `/plans` filters, pagination, expansion, date labels, external links, empty/error states;
- homepage recent-plan hover and mobile dialog;
- no page-level horizontal scrolling at 320px.

- [ ] **Step 6: Commit final documentation**

```powershell
git add docs/operations/recent-plans.md AGENTS.md
git commit -m "docs: record recent plans operations"
```

- [ ] **Step 7: Review the complete branch**

Use the `requesting-code-review` skill. Resolve verified findings, then rerun:

```powershell
npm test
npm run lint
npm run build
git diff --check
git status --short --branch
```

- [ ] **Step 8: Update the existing draft Pull Request**

Use `github:yeet` only after the user approves publishing the completed branch. Push `feature/moderate-auth-foundation` and update PR #1 with:

- implemented scope;
- cloud permission verification results;
- automated verification commands;
- manual browser verification summary;
- explicit remaining limitations.
