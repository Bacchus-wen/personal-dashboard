<!-- BEGIN:nextjs-agent-rules -->
# Next.js project rules

This project uses Next.js 16 App Router. Read relevant guides in `node_modules/next/dist/docs/` before using unfamiliar APIs or conventions.
<!-- END:nextjs-agent-rules -->

## Project roles

- `prototype/` is the Agent-generated visual design source. It can be updated independently and must not directly overwrite production code.
- `src/` is the production Next.js website.
- `docs/superpowers/specs/` and `docs/superpowers/plans/` record approved design decisions and implementation plans.
- `docs/PROJECT_STATUS.md` is the current roadmap and cross-conversation handoff entry. Verify its Git and GitHub claims before relying on them, and update it after each merged flow or major scope change.

## Production structure

- `src/app/`: route pages, root layout, metadata, and global CSS entry.
- `src/components/chrome/`: shared navigation and floating page tools.
- `src/components/home/`: homepage-only dashboard components.
- `src/components/ui/`: reusable content and interactive UI components.
- `src/data/site-content.ts`: typed display content for articles, projects, resources, blogs, navigation, and social links.
- `src/styles/design-tokens.css`: the source of truth for colors, typography, spacing, radii, shadows, and motion.

## Route map

- `/`: dashboard homepage
- `/articles`: article timeline
- `/projects`: project cards
- `/resources`: searchable resources
- `/blogs`: searchable blog directory
- `/album`: interactive photo stack
- `/about`: about page
- `/plans`: public recent plans list

## Design system rules

- Reuse existing tokens before adding colors, radii, shadows, spacing, or motion values.
- Use `.glass`, `.card`, `.lift`, `.pill`, `.btn`, and the shared grid/list patterns before creating new variants.
- Keep mint green for primary interaction, cyan for secondary state, and yellow/pink for restrained accents.
- Icons must use rounded line SVGs with `currentColor`.
- Every interactive control needs visible hover, active, and focus states.
- Preserve support for 320px widths and avoid page-level horizontal scrolling.

## Component rules

- Keep route pages mostly declarative and server-rendered.
- Isolate state, event handlers, timers, and browser APIs in focused client components.
- Put repeated content in `src/data/site-content.ts`; do not duplicate card markup across routes.
- Prefer semantic links, buttons, headings, and sections. Icon-only buttons require an `aria-label`.

## Prototype synchronization

When the Agent updates the visual prototype:

1. Commit or stash the current production state.
2. Review changes with `git diff -- prototype`.
3. Identify token, component, page-layout, and copy changes separately.
4. Selectively implement approved changes in `src/`; never copy the whole prototype over production code.
5. Run `npm run lint` and `npm run build`.
6. Compare the affected Next.js pages against the prototype in the browser.
7. Commit the synchronized change separately.

## Verification

Before considering frontend work complete:

- Run `npm run lint`.
- Run `npm run build`.
- Inspect affected routes in the browser at desktop and mobile widths.
- Verify navigation, filters, search, quiet mode, scroll-to-top, player, and album interactions when changed.

## Installation and disk safety

- The user's C drive has limited free space, and CLI tools may not have write permission for some C-drive directories.
- Before any install, download, new dependency, CLI, Docker, or large-cache operation, explain what is needed, why, likely disk impact, default write location, whether it may write to C drive, and the no-install alternative.
- Do not run the operation until the user explicitly approves it.
- Prefer project-local caches and the F-drive workspace.
- The current authentication phase must not require Docker.

## Authentication and data safety

- Never commit real passwords, Supabase keys, administrator IDs, or `.env.local`.
- Browser code may use only `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- `SUPABASE_SECRET_KEY` must remain in server-only modules and server environment
  variables.
- Every backend write must verify the administrator before using the server-only
  Supabase client.
- Backend-only tables must deny direct `anon` and `authenticated` browser-role
  access.
- Do not claim cloud authentication, database, Storage, or deployment security
  works until it has been verified against the real service.

## Recent plans safety

- `plans` and `plan_categories` remain server-only tables. Browser code must
  never query or mutate them directly.
- Every planning mutation must revalidate the current administrator before
  using the server-only Supabase client.
- Public planning queries must enforce approved visibility, status, and
  `deleted_at` filters on the server.
- Every new planning migration must enable RLS, revoke `anon` and
  `authenticated` table access, and be verified against the real cloud project.
- Do not install planning-related dependencies or tools without the user's
  prior approval.
