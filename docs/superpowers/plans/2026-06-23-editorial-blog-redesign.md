# Editorial Blog Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Theodore from a glass-card dashboard into a configurable editorial personal blog template with two public themes and a denser admin workspace.

**Architecture:** Keep the existing Next.js 16 App Router routes, Supabase repositories, and media/auth behavior. Add a closed theme model to site settings, normalize homepage module order into storage-compatible layout rows, and replace public surfaces incrementally with editorial sections.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Supabase RPC/migrations, Vitest, existing CSS token system.

## Global Constraints

- Do not read or expose `.env.local`.
- Do not install dependencies, CLIs, Docker images, browser binaries, or large caches.
- Use low-consumption validation: focused Vitest, `tsc --noEmit`, `git diff --check`, and targeted browser inspection only.
- Supabase schema changes must be provided as migration files for the user to run in Supabase SQL Editor.
- Public browser code may only use public Supabase environment variables.
- Every backend write remains admin-verified before server-only Supabase use.
- `src/` is production code; `prototype/` must not be copied wholesale into production.
- Admin remains fixed neutral light and does not inherit public themes.
- Resume/PDF features, new article publishing backend, arbitrary theme builders, and drag-resize homepage editing are out of scope.

---

## File Structure

- `supabase/migrations/202606230001_site_theme.sql`: add `theme_id` to `site_settings` and update `publish_site_configuration` RPC to persist it.
- `src/lib/site-settings/theme.ts`: closed theme union, default theme, labels, and `normalizeThemeId`.
- `src/lib/site-settings/theme.test.ts`: theme fallback and union tests.
- `src/lib/site-settings/types.ts`: add `ThemeId` and `themeId` to settings types.
- `src/lib/site-settings/defaults.ts`: set default `paper-editorial` theme and canonical editorial module order.
- `src/lib/site-settings/layout.ts`: add order-only helpers that normalize modules into existing `HomeLayoutItem` coordinates.
- `src/lib/site-settings/layout.test.ts`: verify order normalization and hidden module behavior.
- `src/lib/site-settings/validation.ts`: validate `themeId` and normalize layout through canonical order.
- `src/lib/site-settings/repository.ts`: read/write `theme_id`.
- `src/lib/site-settings/server-repository.ts`: select `theme_id`.
- `src/components/admin/settings/theme-selector.tsx`: replace placeholder with real two-option selector.
- `src/components/admin/settings/settings-workspace.tsx`: wire theme selector and order-only homepage layout editor.
- `src/components/admin/settings/home-layout-editor.tsx`: remove free x/y/width/height controls; expose visibility and simple ordering.
- `src/app/layout.tsx`: apply public theme data attribute to the document root or body.
- `src/components/home/home-dashboard.tsx`: replace grid-driven composition with named editorial slots using ordered modules.
- `src/components/chrome/top-nav.tsx`: add visible hover/focus labels while keeping icon navigation.
- `src/components/chrome/page-shell.tsx`: shorten public page title regions.
- `src/app/works/page.tsx`, `src/components/works/*`: editorial works directory.
- `src/app/about/page.tsx`: two-column editorial profile.
- `src/app/plans/page.tsx`, `src/app/collections/page.tsx`, `src/app/projects/page.tsx`, `src/components/*`: content-led rows and compact filters.
- `src/components/admin/admin-shell.tsx`, `src/app/admin/(protected)/**`, `src/app/globals.css`: denser neutral admin workspace and shared admin primitives.

---

### Task 1: Theme Model and Persistence

**Files:**
- Create: `supabase/migrations/202606230001_site_theme.sql`
- Create: `src/lib/site-settings/theme.ts`
- Create: `src/lib/site-settings/theme.test.ts`
- Modify: `src/lib/site-settings/types.ts`
- Modify: `src/lib/site-settings/defaults.ts`
- Modify: `src/lib/site-settings/validation.ts`
- Modify: `src/lib/site-settings/repository.ts`
- Modify: `src/lib/site-settings/server-repository.ts`

**Interfaces:**
- Produces: `type ThemeId = "paper-editorial" | "night-radio"`.
- Produces: `normalizeThemeId(value: unknown): ThemeId`.
- Produces: `settings.themeId` in `PublishedSiteConfiguration`.

- [ ] **Step 1: Write theme model test**

```ts
// src/lib/site-settings/theme.test.ts
import { describe, expect, it } from "vitest";
import { DEFAULT_THEME_ID, isThemeId, normalizeThemeId, SITE_THEMES } from "./theme";

describe("site theme model", () => {
  it("accepts only published theme ids", () => {
    expect(isThemeId("paper-editorial")).toBe(true);
    expect(isThemeId("night-radio")).toBe(true);
    expect(isThemeId("custom-purple")).toBe(false);
  });

  it("falls back to the default paper editorial theme", () => {
    expect(DEFAULT_THEME_ID).toBe("paper-editorial");
    expect(normalizeThemeId(null)).toBe("paper-editorial");
    expect(normalizeThemeId("night-radio")).toBe("night-radio");
  });

  it("keeps exactly two public theme choices", () => {
    expect(SITE_THEMES.map((theme) => theme.id)).toEqual([
      "paper-editorial",
      "night-radio",
    ]);
  });
});
```

- [ ] **Step 2: Run failing test**

Run: `F:\网站制作\node_modules\.bin\vitest.cmd run --pool=threads --maxWorkers=1 src/lib/site-settings/theme.test.ts`

Expected: FAIL because `src/lib/site-settings/theme.ts` does not exist.

- [ ] **Step 3: Add theme model**

```ts
// src/lib/site-settings/theme.ts
export const SITE_THEMES = [
  {
    id: "paper-editorial",
    label: "纸墨编辑部",
    description: "暖纸背景、炭黑正文、砖红强调，适合默认个人博客模板。",
  },
  {
    id: "night-radio",
    label: "夜间电台",
    description: "深蓝夜读、琥珀播放状态，适合更有音乐和夜晚氛围的版本。",
  },
] as const;

export type ThemeId = (typeof SITE_THEMES)[number]["id"];

export const DEFAULT_THEME_ID: ThemeId = "paper-editorial";

const themeIds = new Set<string>(SITE_THEMES.map((theme) => theme.id));

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && themeIds.has(value);
}

export function normalizeThemeId(value: unknown): ThemeId {
  return isThemeId(value) ? value : DEFAULT_THEME_ID;
}
```

- [ ] **Step 4: Wire types, defaults, validation, and repository mapping**

Add `themeId: ThemeId` to `SiteSettingsInput`. Include it in `DEFAULT_SITE_CONFIGURATION.settings`, validation output, `SettingsRow`, Supabase select list, and `toPublishInput`.

The publish payload must include:

```ts
theme_id: input.settings.themeId,
```

The read path must use:

```ts
themeId: normalizeThemeId(settings.theme_id),
```

- [ ] **Step 5: Add Supabase migration**

```sql
alter table public.site_settings
  add column if not exists theme_id text not null default 'paper-editorial';

alter table public.site_settings
  drop constraint if exists site_settings_theme_id_check;

alter table public.site_settings
  add constraint site_settings_theme_id_check
  check (theme_id in ('paper-editorial', 'night-radio'));

create or replace function public.publish_site_configuration(
  settings jsonb,
  links jsonb,
  layout jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.site_settings (
    singleton,
    site_title,
    display_name,
    status_text,
    site_description,
    avatar_path,
    favicon_path,
    filing_number,
    filing_url,
    module_visibility,
    navigation_visibility,
    theme_id,
    updated_at
  )
  values (
    true,
    settings ->> 'site_title',
    settings ->> 'display_name',
    settings ->> 'status_text',
    settings ->> 'site_description',
    settings ->> 'avatar_path',
    settings ->> 'favicon_path',
    settings ->> 'filing_number',
    nullif(settings ->> 'filing_url', ''),
    coalesce(settings -> 'module_visibility', '{}'::jsonb),
    coalesce(settings -> 'navigation_visibility', '{}'::jsonb),
    coalesce(nullif(settings ->> 'theme_id', ''), 'paper-editorial'),
    now()
  )
  on conflict (singleton) do update set
    site_title = excluded.site_title,
    display_name = excluded.display_name,
    status_text = excluded.status_text,
    site_description = excluded.site_description,
    avatar_path = excluded.avatar_path,
    favicon_path = excluded.favicon_path,
    filing_number = excluded.filing_number,
    filing_url = excluded.filing_url,
    module_visibility = excluded.module_visibility,
    navigation_visibility = excluded.navigation_visibility,
    theme_id = excluded.theme_id,
    updated_at = now();

  delete from public.social_links;
  insert into public.social_links (id, platform, label, href, position, enabled)
  select
    value ->> 'id',
    value ->> 'platform',
    value ->> 'label',
    value ->> 'href',
    (value ->> 'position')::integer,
    (value ->> 'enabled')::boolean
  from jsonb_array_elements(links);

  delete from public.home_layout;
  insert into public.home_layout (module_key, grid_x, grid_y, grid_width, grid_height)
  select
    value ->> 'module_key',
    (value ->> 'grid_x')::integer,
    (value ->> 'grid_y')::integer,
    (value ->> 'grid_width')::integer,
    (value ->> 'grid_height')::integer
  from jsonb_array_elements(layout);
end;
$$;
```

- [ ] **Step 6: Verify Task 1**

Run:

```powershell
F:\网站制作\node_modules\.bin\vitest.cmd run --pool=threads --maxWorkers=1 src/lib/site-settings/theme.test.ts src/lib/site-settings/validation.test.ts src/lib/site-settings/repository.test.ts
F:\网站制作\node_modules\.bin\tsc.cmd --noEmit
git diff --check
```

Expected: all tests and TypeScript pass. Tell the user to execute `supabase/migrations/202606230001_site_theme.sql` in Supabase SQL Editor before browser testing settings publish.

---

### Task 2: Theme Selector and Public Theme Attribute

**Files:**
- Create: `src/components/admin/settings/theme-selector.tsx`
- Modify: `src/components/admin/settings/settings-workspace.tsx`
- Modify: `src/components/admin/settings/theme-placeholder.tsx` or remove it if unused
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `SITE_THEMES`, `ThemeId`, `settings.themeId`.
- Produces: `data-theme="paper-editorial"` or `data-theme="night-radio"` on public pages.

- [ ] **Step 1: Add selector component**

```tsx
"use client";

import { SITE_THEMES, type ThemeId } from "@/lib/site-settings/theme";
import type { SiteConfigurationFieldErrors } from "@/lib/site-settings/types";

export function ThemeSelector({
  value,
  errors,
  onChange,
}: {
  value: ThemeId;
  errors: SiteConfigurationFieldErrors;
  onChange: (themeId: ThemeId) => void;
}) {
  return (
    <section className="admin-panel theme-selector">
      <div>
        <p className="eyebrow">PUBLIC THEME</p>
        <h2>主题外观</h2>
        <p className="muted">只影响公开网站；后台保持固定浅色工作区。</p>
      </div>
      <div className="theme-options" role="radiogroup" aria-label="公开网站主题">
        {SITE_THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            className={value === theme.id ? "theme-option active" : "theme-option"}
            aria-pressed={value === theme.id}
            onClick={() => onChange(theme.id)}
          >
            <span className={`theme-swatch ${theme.id}`} aria-hidden="true" />
            <strong>{theme.label}</strong>
            <span>{theme.description}</span>
          </button>
        ))}
      </div>
      {errors.themeId?.length ? <p className="field-error">{errors.themeId[0]}</p> : null}
    </section>
  );
}
```

- [ ] **Step 2: Replace placeholder tab**

In `settings-workspace.tsx`, replace `ThemePlaceholder` with `ThemeSelector` and update draft via:

```tsx
<ThemeSelector
  value={draft.settings.themeId}
  errors={result.fieldErrors ?? {}}
  onChange={(themeId) =>
    setDraft({ ...draft, settings: { ...draft.settings, themeId } })
  }
/>
```

- [ ] **Step 3: Apply theme attribute**

In `src/app/layout.tsx`, fetch site settings as it already does and set the public root attribute:

```tsx
<body data-theme={configuration.settings.themeId}>
```

If the current layout body already has classes or props, preserve them and add only `data-theme`.

- [ ] **Step 4: Add focused CSS variables**

Add theme-scoped variables in `src/app/globals.css`:

```css
:root,
body[data-theme="paper-editorial"] {
  --theme-bg: #f6f0e5;
  --theme-surface: #fffaf0;
  --theme-text: #24231f;
  --theme-muted: #6f685d;
  --theme-accent: #9d3f31;
  --theme-secondary: #7b7746;
}

body[data-theme="night-radio"] {
  --theme-bg: #101827;
  --theme-surface: #172235;
  --theme-text: #f4ead8;
  --theme-muted: #b8c3d6;
  --theme-accent: #f0aa45;
  --theme-secondary: #84b8d8;
}
```

- [ ] **Step 5: Verify Task 2**

Run:

```powershell
F:\网站制作\node_modules\.bin\tsc.cmd --noEmit
git diff --check
```

Expected: TypeScript passes and the settings page can render the two choices after the SQL migration is applied.

---

### Task 3: Order-Only Homepage Layout

**Files:**
- Modify: `src/lib/site-settings/defaults.ts`
- Modify: `src/lib/site-settings/layout.ts`
- Modify: `src/lib/site-settings/layout.test.ts`
- Modify: `src/components/admin/settings/home-layout-editor.tsx`
- Modify: `src/components/home/home-dashboard.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: `EDITORIAL_HOME_MODULE_ORDER: HomeModuleId[]`.
- Produces: `normalizeHomeLayoutOrder(layout: HomeLayoutItem[], visibility: ModuleVisibility): HomeLayoutItem[]`.
- Produces: order-only admin layout editor with move up/down controls.

- [ ] **Step 1: Add failing layout tests**

```ts
import { describe, expect, it } from "vitest";
import { normalizeHomeLayoutOrder } from "./layout";
import { DEFAULT_SITE_CONFIGURATION } from "./defaults";

describe("normalizeHomeLayoutOrder", () => {
  it("keeps every module while normalizing to canonical storage coordinates", () => {
    const reversed = [...DEFAULT_SITE_CONFIGURATION.layout].reverse();
    const normalized = normalizeHomeLayoutOrder(
      reversed,
      DEFAULT_SITE_CONFIGURATION.settings.moduleVisibility,
    );
    expect(normalized.map((item) => item.moduleId)).toEqual([
      "navigation",
      "welcome",
      "recentPlans",
      "recommendation",
      "album",
      "music",
      "socials",
      "clock",
      "calendar",
    ]);
  });

  it("keeps hidden modules at the end for storage compatibility", () => {
    const normalized = normalizeHomeLayoutOrder(
      DEFAULT_SITE_CONFIGURATION.layout,
      { ...DEFAULT_SITE_CONFIGURATION.settings.moduleVisibility, album: false },
    );
    expect(normalized.at(-1)?.moduleId).toBe("album");
  });
});
```

- [ ] **Step 2: Implement canonical order helpers**

```ts
export const EDITORIAL_HOME_MODULE_ORDER: HomeModuleId[] = [
  "navigation",
  "welcome",
  "recentPlans",
  "recommendation",
  "album",
  "music",
  "socials",
  "clock",
  "calendar",
];
```

`normalizeHomeLayoutOrder` must return every module exactly once and copy canonical dimensions from `HOME_MODULES`; hidden optional modules sort after visible modules.

- [ ] **Step 3: Replace free grid controls**

In `home-layout-editor.tsx`, remove x/y/width/height editing UI. Keep:

- module visibility checkbox
- module label
- move up button
- move down button
- restore defaults

Use `normalizeHomeLayoutOrder(nextLayout, visibility)` after every reorder or visibility change.

- [ ] **Step 4: Render homepage by editorial sections**

In `home-dashboard.tsx`, stop relying on CSS grid coordinates for desktop placement. Use module order to decide section sequence and render named zones:

- left rail: navigation
- hero: welcome and socials
- primary stream: recentPlans and recommendation
- secondary journal: album and music
- utility strip: clock and calendar

Hidden modules must not render blank spaces.

- [ ] **Step 5: Verify Task 3**

Run:

```powershell
F:\网站制作\node_modules\.bin\vitest.cmd run --pool=threads --maxWorkers=1 src/lib/site-settings/layout.test.ts src/lib/site-settings/validation.test.ts
F:\网站制作\node_modules\.bin\tsc.cmd --noEmit
git diff --check
```

Expected: module ordering is validated, no TypeScript errors, and no large first-screen blank areas remain when modules are hidden.

---

### Task 4: Public Editorial Surfaces

**Files:**
- Modify: `src/components/chrome/top-nav.tsx`
- Modify: `src/components/chrome/page-shell.tsx`
- Modify: `src/app/works/page.tsx`
- Modify: `src/components/works/work-gallery.tsx`
- Modify: `src/components/works/work-card.tsx`
- Modify: `src/app/about/page.tsx`
- Modify: `src/app/plans/page.tsx`
- Modify: `src/app/collections/page.tsx`
- Modify: `src/app/projects/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: visible navigation from current server helpers.
- Produces: public pages using editorial rows, compact filters, shorter headers, and visible nav labels.

- [ ] **Step 1: Add top-nav labels**

In each `TopNav` link, keep icon content and add:

```tsx
<span className="nav-link-label">{item.label}</span>
```

CSS must reveal the label on hover, focus-visible, and active states without causing horizontal overflow.

- [ ] **Step 2: Shorten public page shell**

Change `.page-head` spacing and typography in CSS so content enters the first screen earlier. Keep existing semantic `<header>`, `<h1>`, and description structure.

- [ ] **Step 3: Rework works page hierarchy**

Use first available work as featured. Remaining works render as compact editorial rows/cards with cover, status, technology tags, and summary. Empty media should be a compact placeholder, not repeated identical cards.

- [ ] **Step 4: Rework about page**

Use a two-column desktop layout:

- left: identity, avatar/signature, status
- right: introduction, site purpose, interests, restrained quote

Mobile stacks in natural reading order.

- [ ] **Step 5: Rework plans, collections, and projects**

Replace equal-weight grids with content-led rows. Preserve existing filtering/search behavior and links.

- [ ] **Step 6: Verify Task 4**

Run:

```powershell
F:\网站制作\node_modules\.bin\tsc.cmd --noEmit
git diff --check
```

Then inspect `/`, `/works`, `/about`, `/plans`, `/collections`, `/projects`, and `/album` at desktop and mobile widths if a dev server is available.

---

### Task 5: Admin Workspace Density Pass

**Files:**
- Modify: `src/components/admin/admin-shell.tsx`
- Modify: `src/app/admin/(protected)/page.tsx`
- Modify: selected list/editor pages under `src/app/admin/(protected)/**`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: existing admin routes and actions.
- Produces: fixed neutral admin shell with compact lists/forms and secondary development-tools grouping.

- [ ] **Step 1: Define shared admin CSS primitives**

Add classes for:

- `.admin-panel`
- `.admin-list`
- `.admin-list-row`
- `.admin-form-grid`
- `.admin-toolbar`
- `.admin-dev-tools`

Use neutral light tokens; do not use public theme variables.

- [ ] **Step 2: Update admin overview**

Group content routes separately from development tools:

- content: plans, works, collections, projects, photos, music
- settings: site settings
- development tools: media upload internal test

- [ ] **Step 3: Apply compact list styling to one representative list**

Start with `/admin/music` because it is new and low-risk. If the pattern works, apply to plans/works/projects/collections/photos without changing action behavior.

- [ ] **Step 4: Verify Task 5**

Run:

```powershell
F:\网站制作\node_modules\.bin\tsc.cmd --noEmit
git diff --check
```

Inspect `/admin`, `/admin/settings`, `/admin/music`, and one editor page at desktop and mobile widths.

---

### Task 6: Focused Browser Acceptance and Cleanup

**Files:**
- Modify only files with defects found during acceptance.
- Update: `docs/PROJECT_STATUS.md` only after the implementation is completed and ready for handoff.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: final verified redesign slice ready for review/PR.

- [ ] **Step 1: Run focused unit and type checks**

Run:

```powershell
F:\网站制作\node_modules\.bin\vitest.cmd run --pool=threads --maxWorkers=1 src/lib/site-settings/theme.test.ts src/lib/site-settings/layout.test.ts src/lib/site-settings/validation.test.ts src/lib/site-settings/repository.test.ts src/lib/admin/navigation.test.ts src/lib/music/validation.test.ts src/lib/music/upload.test.ts src/lib/music/actions.test.ts
F:\网站制作\node_modules\.bin\tsc.cmd --noEmit
git diff --check
```

- [ ] **Step 2: Browser inspect affected routes**

Use an existing dev server or ask the user to start:

```powershell
cd "F:\网站制作\.worktrees\music-library-module"
F:\网站制作\node_modules\.bin\next.cmd dev --webpack -p 3015
```

Inspect:

- `/`
- `/works`
- `/about`
- `/plans`
- `/collections`
- `/projects`
- `/album`
- `/admin`
- `/admin/settings`
- `/admin/music`

Check both `paper-editorial` and `night-radio` public themes after SQL migration and settings save.

- [ ] **Step 3: Fix only acceptance defects**

Allowed fixes:

- overflow at 320px
- unreadable contrast in either theme
- hidden module leaving visible blank space
- nav labels covering content
- admin mobile layout blocking form actions
- broken TypeScript or focused tests

Do not add new features during this step.

- [ ] **Step 4: Final handoff**

Update `docs/PROJECT_STATUS.md` with:

- branch name
- completed slices
- SQL file the user executed
- focused validations run
- routes visually inspected
- known residual risks

---

## Self-Review

- Spec coverage: Theme model, theme selector, homepage ordering, public shell/pages, admin density, browser acceptance, and SQL handoff are covered.
- Placeholder scan: No task uses TBD/TODO/fill later instructions.
- Type consistency: `ThemeId`, `themeId`, `normalizeThemeId`, and `normalizeHomeLayoutOrder` are introduced before later tasks consume them.
- Scope control: No resume, PDF, new article backend, arbitrary theme builder, or drag-resize editor is included.
