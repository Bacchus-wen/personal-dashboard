# Theodore — Personal Dashboard, Blog & Portfolio

A self-hosted personal website that doubles as a private content manager. The
public site presents your writing, plans, portfolio, curated links, photo
album, and music; a protected admin area lets a single owner manage all of it.
Built with the Next.js App Router and Supabase, with a switchable visual theme
system (including a warm editorial look).

> This is an open-source personal site. The default content is the author's
> ("Theodore"); fork it and replace the content with your own through the admin
> area and site settings.

## Features

- **Dashboard homepage** — greeting, social links, clock/calendar widgets, an
  album preview, recent plans, rotating recommendations, and a music player.
- **Editorial articles** (`/articles`) — a writing log grouped by year with
  day/week/month/year and category filters.
- **Recent plans** (`/plans`) — public plan list with categories, status,
  priority, progress, and target dates.
- **Portfolio** (`/works`) — your own projects with covers, screenshots, tech
  tags, and status/visibility states.
- **Collections** (`/collections`) — curated external articles and videos.
- **Featured projects** (`/projects`) — noteworthy GitHub projects worth sharing.
- **Photo album** (`/album`) — a draggable photo board backed by Supabase Storage.
- **Music** — upload MP3s and pick the active homepage track.
- **Theme system** — switch the site's visual theme from admin settings.
- **Admin area** (`/admin`) — a unified dashboard for single-administrator CRUD
  over everything above, including image/audio uploads, trash/restore, homepage
  layout editing, and theme selection.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Supabase** — Auth (email/password), PostgreSQL, and Storage
- Server-only data access with per-request administrator verification
- **Vitest** for unit tests

## Prerequisites

- **Node.js 20+** and npm
- A free **Supabase** account (https://supabase.com) — no local Docker required

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local        # PowerShell: Copy-Item .env.example .env.local
# then fill in the four values (see "Supabase setup" below)

# 3. Run the dev server
npm run dev
```

Open http://localhost:3000. The public pages render once the database is set
up; the admin area lives at `/admin`.

## Supabase setup

This project uses Supabase cloud (the free tier is enough). No Docker needed.

### 1. Create a project

Create a new project at https://supabase.com. Once it is ready, open
**Project Settings → API** and copy these into `.env.local`:

| `.env.local` variable                   | Where to find it                          |
| --------------------------------------- | ----------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`              | Project URL                               |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`  | Project API keys → publishable / anon key |
| `SUPABASE_SECRET_KEY`                   | Project API keys → secret / service_role key |

`SUPABASE_SECRET_KEY` is server-only — never expose it to the browser.

### 2. Run the migrations

Open **SQL Editor** in the Supabase dashboard and run each file in
`supabase/migrations/` **in filename order** (the timestamp prefix is the
order). Paste the contents of one file, run it, then move to the next:

```
202606110001_private_server_access.sql
202606110002_recent_plans.sql
202606130001_site_settings_home_layout.sql
202606130002_fix_site_configuration_publish.sql
202606130003_works_management.sql
202606140001_collections_featured_projects.sql
202606140002_public_album_storage.sql
202606150001_media_upload_cleanup_reasons.sql
202606150002_media_upload_form_integrations.sql
202606160001_navigation_visibility.sql
202606220001_music_library.sql
202606220002_music_storage_mime.sql
202606230001_site_theme.sql
```

These create the tables, enable Row Level Security, revoke direct browser-role
access to backend tables, provision the public `public-media` Storage bucket
(images and audio) used by the album, image uploads, and music, and add the
theme setting.

### 3. Create the administrator

This site has exactly one administrator and public sign-up is disabled.

1. In Supabase, go to **Authentication → Users → Add user** and create your
   admin account with an email and password.
2. Copy that user's **User UID** and set it as `ADMIN_USER_ID` in `.env.local`.

Restart `npm run dev` after editing `.env.local`, then sign in at `/admin`.

## Scripts

```bash
npm run dev      # start the dev server
npm run build    # production build
npm run start    # serve the production build
npm run lint     # ESLint
npm test         # Vitest unit tests
```

## Project structure

- `src/app/` — App Router routes, layouts, and global CSS entry.
- `src/components/` — `chrome/` (nav/page tools), `home/`, `ui/`, and admin
  components per domain (including `admin/music/` and the admin shell).
- `src/lib/` — server-only domains and repositories (`auth`, `supabase`,
  `plans`, `works`, `collections`, `featured-projects`, `photos`, `media`,
  `music`, `site-settings`, `navigation`, `admin`).
- `src/data/site-content.ts` — typed static display content and navigation.
- `src/styles/design-tokens.css` — the design-system source of truth.
- `supabase/migrations/` — ordered SQL migrations.

See `AGENTS.md` for the full structure, design-system rules, component
conventions, and security boundaries.

## Security model

Designed for a single-owner site, intentionally moderate (not enterprise):

- Supabase Auth owns login and password recovery; public sign-up is disabled.
- Every protected page and backend write re-verifies the administrator on the
  server.
- `SUPABASE_SECRET_KEY` and `ADMIN_USER_ID` stay server-only.
- Backend tables enable RLS and deny direct `anon` / `authenticated` access;
  public data is read and filtered by Next.js server code.
- `.env.local` is git-ignored and must never be committed.

## Deployment

Deploy to any Node host that supports Next.js (e.g. Vercel). Set the same four
environment variables in the host's project settings. Point it at the same
Supabase project whose migrations you have already run.
