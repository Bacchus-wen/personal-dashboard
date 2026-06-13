# Theodore Personal Dashboard - Project Status

Last updated: 2026-06-14

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
| 4 | Curated articles/videos and noteworthy GitHub projects | Design approved; specification in review |
| 5 | Media storage, album management, real avatar and favicon uploads | Not started |
| 6 | Internal resume page and PDF download | Not started |
| 7 | Vercel deployment, production verification, and launch | Not started |

## Current Git And GitHub State

Verified on 2026-06-14:

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
- Active flow 4 worktree:
  `F:\网站制作\.worktrees\collections-featured-projects`
- Active flow 4 branch: `codex/collections-featured-projects`
- Open Pull Requests: none at the time of this update.

The previous works worktree may contain `.dev-server.out.log` and
`.dev-server.err.log` while the local server is running. They are local runtime
logs and must not be committed.

Flow 4 design is approved. Review its written specification before creating the
implementation plan or changing production code.

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

The approved flow 4 specification supersedes the earlier expectation notes
below:

- `docs/superpowers/specs/2026-06-14-collections-featured-projects-design.md`

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

Database:

- `supabase/migrations/202606110001_private_server_access.sql`
- `supabase/migrations/202606110002_recent_plans.sql`
- `supabase/migrations/202606130001_site_settings_home_layout.sql`
- `supabase/migrations/202606130002_fix_site_configuration_publish.sql`
- `supabase/migrations/202606130003_works_management.sql`

## Immediate Next Step

1. Review and approve the written flow 4 design specification.
2. After specification approval, create the detailed implementation plan.
3. Implement flow 4 in the isolated `codex/collections-featured-projects`
   worktree without installing new dependencies.
4. Apply and verify the new migration against the real Supabase cloud project.
5. Update this file whenever a flow is merged, materially redesigned, or moved
   to a new active Pull Request.
