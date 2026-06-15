# Theodore Personal Dashboard - Project Status

Last updated: 2026-06-15

This document is the primary handoff entry for a new Codex conversation. It
summarizes the current product direction, completed work, active Git state,
important constraints, and the source files that contain the detailed design
and operational decisions.

The information below is a snapshot. Before changing code, verify the current
repository, worktree, GitHub Pull Request, Supabase, and local server state.

## New Conversation Start Here

Ask the new conversation to:

1. Read `AGENTS.md`, `README.md`, and this file.
2. Read the relevant design specification and implementation plan listed below.
3. Run `git worktree list`, `git status --short --branch`, and
   `git log --oneline --decorate -15`.
4. Check the active GitHub Pull Request before assuming a feature is merged.
5. Confirm `.env.local` exists without printing or exposing its contents.
6. Report the verified current state before editing code.

Suggested opening message:

```text
Continue developing the Theodore personal dashboard in F:\网站制作.

First read AGENTS.md, README.md, and docs/PROJECT_STATUS.md. Then inspect the
real Git worktrees, current branch, uncommitted files, recent commits, and open
GitHub Pull Requests. Do not rely only on the status document because it may be
outdated. Report the verified state and recommended next step before editing.

Do not install dependencies, CLIs, Docker, or create large caches without first
explaining disk impact and receiving approval. Never expose .env.local or
server-only keys. Report the skills and verification commands used.
```

## Product Direction

The site is a real personal dashboard, blog, and portfolio rather than a static
visual prototype.

Main goals:

- manage private and public personal plans;
- present the owner's website portfolio;
- publish curated articles and videos;
- recommend noteworthy GitHub projects;
- present an internal resume page with PDF download;
- manage homepage content and layout;
- deploy the completed site to Vercel.

Current technology:

- Next.js 16 App Router;
- React 19 and TypeScript;
- Supabase Auth and PostgreSQL;
- server-only data repositories and Server Actions;
- Vitest;
- Vercel planned for production deployment.

## Roadmap And Progress

| Flow | Scope | State |
| --- | --- | --- |
| 1 | Authentication, security foundation, recent plans | Merged into `main` through PR #1 |
| 2 | Site settings and homepage layout management | Merged into `main` through PR #2 |
| 3 | My works management and public portfolio | Merged into `main` through PR #3 |
| 4 | Curated articles/videos and noteworthy GitHub projects | Merged into `main` through PR #4 |
| 5A | Public album and Storage foundation | Merged into `main` through PR #5 |
| 5B-1 | Shared avatar/favicon/content image upload foundation | Implemented locally on `codex/shared-media-upload-foundation`; cloud and external-browser acceptance pending |
| 5B-2 | Integrate uploads into site settings, works, collections, and projects forms | Not started |
| 6 | Internal resume page and PDF download | Not started |
| 7 | Vercel deployment, production verification, and launch | Not started |

## Current Git And GitHub State

Verified on 2026-06-15:

- GitHub repository:
  `https://github.com/Bacchus-wen/theodore-personal-dashboard`
- Main workspace: `F:\网站制作`
- Previous works feature worktree:
  `F:\网站制作\.worktrees\moderate-auth-foundation`
- Previous works branch: `codex/works-management`
- Merged Pull Request:
  `https://github.com/Bacchus-wen/theodore-personal-dashboard/pull/3`
- PR #3 state: merged into `main` as
  `96434a1 Add works management and public portfolio pages (#3)`.
- Previous flow 4 worktree:
  `F:\网站制作\.worktrees\collections-featured-projects`
- Previous flow 4 branch: `codex/collections-featured-projects`
- Merged flow 4 Pull Request:
  `https://github.com/Bacchus-wen/theodore-personal-dashboard/pull/4`

The previous works worktree may contain `.dev-server.out.log` and
`.dev-server.err.log` while the local server is running. They are local runtime
logs and must not be committed.

Flow 4 implementation and acceptance are complete. Pull Request #4 was squash
merged into `main` as `1e1572c Add collections and featured projects (#4)`.

Flow 5A state:

- worktree: `F:\网站制作\.worktrees\public-album-storage`;
- branch: `codex/public-album-storage`;
- approved design:
  `docs/superpowers/specs/2026-06-14-public-album-storage-design.md`;
- implementation plan:
  `docs/superpowers/plans/2026-06-14-public-album-storage.md`;
- draggable board adjustment design:
  `docs/superpowers/specs/2026-06-14-draggable-photo-board-design.md`;
- draggable board implementation plan:
  `docs/superpowers/plans/2026-06-14-draggable-photo-board.md`;
- local implementation, real Supabase migration, SQL security checks, automated
  verification, and external-browser public album layout acceptance are
  complete;
- Merged flow 5A Pull Request:
  `https://github.com/Bacchus-wen/theodore-personal-dashboard/pull/5`;
- PR #5 state: squash merged into `main` as
  `86e7762 Add public album storage and draggable photo board`.

Flow 5B-1 state:

- worktree: `F:\网站制作\.worktrees\shared-media-upload-foundation`;
- branch: `codex/shared-media-upload-foundation`;
- approved design:
  `docs/superpowers/specs/2026-06-15-media-upload-design.md`;
- implementation plan:
  `docs/superpowers/plans/2026-06-15-shared-media-upload-foundation.md`;
- local implementation is complete through the internal admin media test page;
- local full verification completed on 2026-06-15;
- Draft Pull Request:
  `https://github.com/Bacchus-wen/theodore-personal-dashboard/pull/6`;
- real Supabase migration, SQL security checks, and external-browser
  acceptance are still pending and must not be claimed complete yet.

## Completed Work

### Flow 1 - Authentication, Security, And Recent Plans

Implemented and verified:

- Supabase email/password login for one administrator;
- public signup and anonymous login disabled;
- server-side administrator identity checks;
- protected `/admin` routes and backend writes;
- login, sign-out, recovery email, password update, and new-password login;
- server-only database access boundary;
- recent plans database and management pages;
- categories, statuses, priorities, progress, visibility, and target dates;
- plan creation, editing, public listing, trash, restore, and permanent delete;
- public `/plans` page and homepage recent-plan widget;
- real Supabase cloud permission verification.

Primary references:

- `docs/superpowers/specs/2026-06-11-personal-dashboard-functional-foundation-design.md`
- `docs/superpowers/specs/2026-06-11-recent-plans-design.md`
- `docs/superpowers/plans/2026-06-11-authentication-security-foundation.md`
- `docs/superpowers/plans/2026-06-11-recent-plans.md`
- `docs/operations/supabase-cloud-setup.md`
- `docs/operations/authentication-and-recovery.md`
- `docs/operations/recent-plans.md`
- `supabase/migrations/202606110001_private_server_access.sql`
- `supabase/migrations/202606110002_recent_plans.sql`
- `src/lib/auth/`
- `src/lib/plans/`
- `src/app/admin/(protected)/plans/`

### Flow 2 - Site Settings And Homepage Layout

Implemented and verified:

- site identity and description settings;
- social-link management;
- homepage module enable/disable settings;
- homepage layout preview and drag editing;
- saved module offsets and reset-to-default behavior;
- public homepage reads published settings from Supabase;
- external-browser acceptance.

Real image uploads are not included yet. Avatar and favicon upload belong to
flow 5.

Primary references:

- `docs/superpowers/specs/2026-06-13-site-settings-home-layout-design.md`
- `docs/superpowers/plans/2026-06-13-site-settings-home-layout.md`
- `supabase/migrations/202606130001_site_settings_home_layout.sql`
- `supabase/migrations/202606130002_fix_site_configuration_publish.sql`
- `src/lib/site-settings/`
- `src/components/admin/settings/`
- `src/app/admin/(protected)/settings/`
- `src/components/home/`

### Flow 3 - My Works

Implemented, migrated in Supabase, and accepted in an external browser:

- `works` and `work_screenshots` database structures;
- RLS, browser-role revocation, and server-only writes;
- server-side validation, repository, query, and action layers;
- admin list, create, edit, protected preview, trash, restore, and permanent
  delete;
- draft, private, public, and archived visibility states;
- developing, maintained, completed, and stopped work statuses;
- public `/works` list and `/works/[slug]` detail pages;
- status and technology filters;
- compact responsive cards: three desktop columns, two tablet columns, and one
  mobile column;
- `16:10` website-preview cover ratio;
- successful saves return to `/admin/works`;
- public detail pages include a return-to-list control.

Supabase migration already executed successfully:

- `supabase/migrations/202606130003_works_management.sql`

Latest verified results before PR #3 was opened:

- `npm test`: 17 files and 91 tests passed;
- `npm run lint`: passed;
- `npx tsc --noEmit`: passed;
- `npm run build`: passed;
- external-browser acceptance: all requested scenarios passed.

Primary references:

- `docs/superpowers/specs/2026-06-13-works-management-design.md`
- `docs/superpowers/plans/2026-06-13-works-management.md`
- `supabase/migrations/202606130003_works_management.sql`
- `src/lib/works/`
- `src/components/works/`
- `src/components/admin/works/`
- `src/app/works/`
- `src/app/admin/(protected)/works/`

### Flow 4 - Collections And Featured Projects

Implemented locally:

- server-only `collections` and `featured_projects` schema migration;
- RLS, browser-role revocation, validation, queries, repositories, and
  protected Server Actions;
- administrator list, create, edit, live card preview, trash, restore-to-draft,
  and permanent-delete workflows for both domains;
- public `/collections` article/video page with type, search, and tag filters;
- public `/projects` noteworthy GitHub project page with search, language, and
  tag filters;
- external-link-only cards with no internal detail pages or embedded content;
- permanent redirects from `/resources` to `/collections` and `/blogs` to
  `/projects`;
- real homepage random recommendation candidates without demo-data fallback;
- responsive three-column, two-column, and one-column card layouts.

Cloud migration status:

- `supabase/migrations/202606140001_collections_featured_projects.sql` was
  executed successfully in the real Supabase SQL Editor on 2026-06-14;
- post-migration public server reads returned successfully without migration or
  loading errors;
- user-run SQL Editor verification confirmed both tables have RLS enabled and
  that `anon` and `authenticated` have no table privileges;
- user-run external-browser acceptance confirmed create, read, edit, trash,
  restore-to-draft, and permanent-delete workflows for both administrator
  domains;
- user-run external-browser acceptance confirmed public visibility isolation,
  homepage featured-only recommendations, original-site new-tab links, and
  desktop, tablet, and approximately 320px responsive layouts.

Flow 4 is merged and has no remaining implementation work in this flow.

Latest local automated verification:

- `npm test`: 27 files and 141 tests passed;
- `npm run lint`: passed;
- `npx tsc --noEmit`: passed;
- `git diff --check`: passed;
- `npm run build -- --webpack`: passed.

Build and local HTTP acceptance notes:

- default Turbopack build cannot follow the project-local `node_modules`
  directory junction because it points to another worktree;
- the official Next.js Webpack build mode passed after `.env.local` was copied
  without reading its contents from the previous worktree and confirmed
  ignored by Git;
- local production server HTTP checks passed for `/`, `/collections`, and
  `/projects`;
- `/resources` returned permanent redirect `308` to `/collections`;
- `/blogs` returned permanent redirect `308` to `/projects`;
- after the flow 4 cloud migration, `/collections` and `/projects` returned
  `200` without migration or loading errors;
- unauthenticated requests to `/admin/collections` and `/admin/projects`
  returned `307` redirects to `/admin/login`;
- in-app browser control was unavailable, so visual and interaction acceptance
  remains pending in an external browser.

Primary references:

- `docs/superpowers/specs/2026-06-14-collections-featured-projects-design.md`
- `docs/superpowers/plans/2026-06-14-collections-featured-projects.md`
- `docs/operations/collections-and-featured-projects.md`
- `supabase/migrations/202606140001_collections_featured_projects.sql`
- `src/lib/collections/`
- `src/lib/featured-projects/`
- `src/lib/recommendations/`

### Flow 5A - Public Album And Storage Foundation

Implemented locally:

- public `public-media` Storage bucket migration with WebP-only and 10 MB
  limits;
- server-only `photos` and `storage_cleanup_tasks` tables with RLS and browser
  role revocation;
- photo validation, deterministic grouping, repositories, Storage lifecycle,
  rollback tracking, and cleanup retry;
- protected JSON upload and replacement Route Handlers;
- browser resize and WebP conversion, ten-file selection, and two-worker upload
  queue;
- administrator photo list, status editing, replacement, trash, restore,
  permanent deletion, and cleanup pages;
- real public draggable photo board, single-photo lightbox, group navigation,
  keyboard close support, and controlled failure/empty states;
- real homepage album preview with at most three random public photos;
- responsive public album and administrator layouts without new dependencies.

Cloud verification completed:

- `supabase/migrations/202606140002_public_album_storage.sql` was executed
  successfully in the real Supabase SQL Editor;
- user-run SQL Editor verification confirmed RLS is enabled for `photos` and
  `storage_cleanup_tasks`;
- user-run SQL Editor verification confirmed `anon` and `authenticated` have no
  direct table privileges;
- user-run SQL Editor verification confirmed `public-media` is public, limited
  to 10 MB, and allows only `image/webp`;
- user-run SQL Editor verification found no existing browser-role
  `storage.objects` policies;
- post-migration HTTP checks confirmed `/` and `/album` return `200`, and
  `/admin/photos` and `/admin/photos/cleanup` redirect unauthenticated visitors
  to login.

Latest local automated verification:

- final `npm test`: 37 files and 191 tests passed;
- final `npm run lint`: passed;
- final `npx tsc --noEmit`: passed;
- final `git diff --check`: passed;
- final `npm run build -- --webpack`: passed;
- merge-readiness review led to commit `5032a16`, which added replacement
  compare-and-swap, lifecycle zero-row detection, stronger WebP structure
  validation, upload-queue deduplication, and upload/replacement cache
  revalidation.
- external-browser acceptance found the original album stack too large,
  vertically wasteful, and too hard to drag from the photo body;
- commits through `bd3f49d` refined `/album` into a one-screen desktop layout
  with side copy, smaller photos, wider board space, whole-photo dragging, and
  a minimal single-photo lightbox.

Flow 5A is merged and has no remaining implementation work in this flow.

Primary references:

- `docs/superpowers/specs/2026-06-14-public-album-storage-design.md`
- `docs/superpowers/plans/2026-06-14-public-album-storage.md`
- `docs/operations/public-album-storage.md`
- `supabase/migrations/202606140002_public_album_storage.sql`
- `src/lib/photos/`
- `src/components/photos/`
- `src/components/admin/photos/`
- `src/app/admin/(protected)/photos/`

### Flow 5B-1 - Shared Media Upload Foundation

Implemented locally:

- cleanup-task reason migration adding `delete_asset_file`;
- shared media purpose, variant, path, validation, Storage, API, and browser
  image-processing helpers;
- protected administrator upload and delete Route Handlers at
  `/api/admin/media/upload` and `/api/admin/media/delete`;
- browser-side WebP conversion, avatar square crop, favicon passthrough, and
  reusable `MediaUploadField`;
- internal protected `/admin/media/test` page for WebP and favicon upload and
  deletion checks;
- cleanup task display updated for `delete_asset_file`;
- operations guide for migration, SQL checks, test-page workflow, and cleanup
  retry.

Latest local automated verification:

- `npm test`: 42 files and 212 tests passed;
- `npm run lint`: passed;
- `npx tsc --noEmit`: passed;
- `git diff --check`: passed;
- `npm run build -- --webpack`: first normal run hit Windows `EPERM unlink`
  under `.next`; one elevated rerun passed.

Cloud and browser verification status:

- `supabase/migrations/202606150001_media_upload_cleanup_reasons.sql` was
  executed successfully in the real Supabase SQL Editor;
- user-run SQL screenshots confirmed both named cleanup constraints exist;
- user-run bucket verification confirmed `public-media` remains public, keeps
  the 10 MB limit, and includes the expanded WebP/favicon MIME configuration;
- user-run Storage policy query returned no rows, confirming no existing
  browser-role `storage.objects` policies;
- local HTTP verification confirmed `/admin/media/test` redirects
  unauthenticated visitors to `/admin/login`, both media APIs return `401`
  without an administrator session, and `/` returns `200`;
- the current Flow 5B-1 dev server is running at `http://localhost:3011`;
- in-app browser control was unavailable;
- user-run external-browser acceptance confirmed authenticated WebP/favicon
  upload, returned paths and previews, test-object deletion, safe invalid-file
  rejection, and desktop/narrow/approximately 320px layouts.

Primary references:

- `docs/superpowers/specs/2026-06-15-media-upload-design.md`
- `docs/superpowers/plans/2026-06-15-shared-media-upload-foundation.md`
- `docs/operations/media-upload.md`
- `supabase/migrations/202606150001_media_upload_cleanup_reasons.sql`
- `src/lib/media/`
- `src/components/admin/media/`
- `src/app/api/admin/media/`
- `src/app/admin/(protected)/media/test/`

## Approved Product Decisions

### Navigation And Page Roles

- `/works` is "我的作品" and displays the owner's portfolio.
- `/projects` is reserved for future "优秀项目".
- Do not expose "优秀项目" in navigation before flow 4 is implemented.
- "关于网站" remains a separate page explaining the site's purpose.
- The resume will be an internal `/resume` page with PDF download.
- The homepage greeting area will later provide the resume entry using a
  folded-corner interaction combined with a restrained Orb-style light effect.

### Flow 4 Direction

The approved flow 4 specification and implementation plan supersede the earlier
expectation notes below:

- `docs/superpowers/specs/2026-06-14-collections-featured-projects-design.md`
- `docs/superpowers/plans/2026-06-14-collections-featured-projects.md`

Approved decisions include `/collections` for external article/video
collections, `/projects` for manually maintained noteworthy GitHub projects,
external-link-only cards, protected server-only management, and a real
homepage recommendation source without demo-data fallback.

Flow 4 was designed and approved before implementation.

Earlier expected scope, retained for historical context:

- replace the current recommendation area with separate article and video
  collections;
- allow visitors to switch between articles and videos;
- replace "优秀博客" with "优秀项目";
- use "优秀项目" for noteworthy GitHub projects;
- add protected admin management and server-only data access;
- define public filtering and presentation rules.

Do not assume the existing `/resources`, `/blogs`, or `/projects` demo content
is the final data model. Review and selectively migrate only approved content.

### Visual And Responsive Direction

- preserve the light glass, soft gradient, mint-primary visual system;
- use existing tokens and shared classes before adding variants;
- keep homepage height controlled and avoid unnecessary vertical length;
- support approximately 320px width;
- never introduce page-level horizontal scrolling;
- use external browser acceptance if the in-app browser cannot access localhost.

## Security And Data Boundaries

The selected security level is intentionally moderate: appropriate for a
single-administrator portfolio, without enterprise-only complexity.

- Supabase Auth owns login sessions and password recovery.
- Public signup and anonymous login remain disabled.
- Every protected page and backend write rechecks the administrator server-side.
- `SUPABASE_SECRET_KEY` and `ADMIN_USER_ID` remain server-only.
- `.env.local` must never be printed, exposed, or committed.
- Browser roles cannot directly read or write backend-only business tables.
- Public data is selected and filtered by Next.js server code.
- New tables must enable RLS and revoke direct `anon` and `authenticated`
  privileges unless an approved design explicitly requires otherwise.
- Current development must not require Docker.
- PEM-file import is not part of the authentication design.

Security references:

- `AGENTS.md`
- `docs/superpowers/specs/2026-06-11-personal-dashboard-functional-foundation-design.md`
- `docs/operations/supabase-cloud-setup.md`
- `docs/operations/authentication-and-recovery.md`
- `.env.example`
- `src/lib/auth/`
- `src/lib/supabase/`

## Installation, Disk, And Performance Constraints

The user's C drive has limited space and some C-drive CLI locations may deny
write access.

Before installing or downloading dependencies, CLIs, Docker, or large caches:

1. explain why the operation is needed;
2. estimate disk usage;
3. identify the default write location;
4. state whether it may write to C drive;
5. provide a no-install alternative;
6. wait for explicit approval.

Prefer the F-drive workspace and project-local caches.

Known environment behavior:

- Windows may deny normal deletion or rename operations under `.next`.
- A final elevated `npm run build` has resolved this without code changes.
- Do not repeatedly run production builds during development.
- Run low-cost focused tests, lint, and type checks first.
- Avoid parallel high-memory builds and unnecessary subagents.
- GitHub CLI may be unavailable in `PATH`; local Git plus the GitHub connector
  can push and create Pull Requests without reinstalling it.

## Development And Verification Rules

Before implementing a new flow:

1. inspect the real repository and GitHub state;
2. use `brainstorming` to confirm the design;
3. write an approved specification and implementation plan;
4. use focused tests for important behaviors;
5. make narrowly scoped changes;
6. perform external-browser acceptance;
7. report modified files, verification commands, errors, commits, and skills.

Standard verification:

```powershell
npm test
npm run lint
npx tsc --noEmit
npm run build
git diff --check
```

Run the final production build once near completion. Browser acceptance must
cover desktop and narrow/mobile widths.

## Project Structure References

General:

- `AGENTS.md`: project rules, structure, security, and verification requirements.
- `README.md`: basic local-development entry.
- `prototype/`: independently generated visual source; never copy wholesale.
- `src/styles/design-tokens.css`: design-system source of truth.
- `src/app/globals.css`: shared production styles and responsive rules.
- `src/data/site-content.ts`: typed static display content and navigation.

Application:

- `src/app/`: App Router pages and layouts.
- `src/components/chrome/`: navigation and shared page controls.
- `src/components/home/`: homepage modules.
- `src/components/ui/`: reusable UI.
- `src/lib/auth/`: administrator and route access rules.
- `src/lib/supabase/`: browser/server Supabase boundaries.
- `src/lib/plans/`: recent-plans domain and repository.
- `src/lib/site-settings/`: site-settings domain and repository.
- `src/lib/works/`: works domain and repository.
- `src/lib/photos/`: public album, Storage lifecycle, and photo actions.

Database:

- `supabase/migrations/202606110001_private_server_access.sql`
- `supabase/migrations/202606110002_recent_plans.sql`
- `supabase/migrations/202606130001_site_settings_home_layout.sql`
- `supabase/migrations/202606130002_fix_site_configuration_publish.sql`
- `supabase/migrations/202606130003_works_management.sql`
- `supabase/migrations/202606140001_collections_featured_projects.sql`
- `supabase/migrations/202606140002_public_album_storage.sql`
- `supabase/migrations/202606150001_media_upload_cleanup_reasons.sql`

## Immediate Next Step

1. Flow 5B-1 verification is complete; PR #6 is ready for final review and
   merge decision.
2. Start Flow 5B-2 only after Flow 5B-1 is merged.
3. Keep using the project-local GitHub CLI at
   `F:\网站制作\.local-tools\github-cli\bin\gh.exe` if `gh` is not in `PATH`.
