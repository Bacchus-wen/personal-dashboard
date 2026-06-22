# Unified Admin Shell and Public Page Cleanup

## Goal

Create one consistent protected admin interface and remove the obsolete edit control from every public content page.

## Admin Shell

- Implement the shell in `src/app/admin/(protected)/layout.tsx` so every protected admin route shares it.
- Use a desktop sidebar and a responsive compact navigation on smaller screens.
- Keep the existing glass, mint, rounded-corner visual language and existing design tokens.
- Include links for overview, recent plans, site settings, works, collections, featured projects, public album, music library, and media test.
- Include return-to-site and sign-out actions in the shell.
- Highlight the active admin section based on the current pathname.
- Keep route pages responsible only for their page content; do not duplicate sidebar markup in each page.

## Admin Overview

- Replace the current button pile with a concise overview panel inside the shared shell.
- Do not introduce analytics, counts, or new backend queries.

## Public Pages

- Remove `PageAction` from the shared `PageShell`.
- Remove the direct `PageAction` usage from the album route.
- Do not replace these controls with another public edit shortcut. Admin access remains available through the avatar entry and direct `/admin` routes.

## Responsive Behavior

- Desktop: persistent sidebar beside the admin content area.
- Tablet and mobile: navigation becomes a compact horizontally scrollable or wrapped header area without page-level horizontal overflow.
- Existing admin forms, cards, dialogs, and route behavior remain unchanged.

## Verification

- TypeScript passes.
- Focused tests covering affected shared components pass when available.
- Public routes no longer render the edit control.
- Admin overview, list, new, edit, trash, settings, music, photo, and media-test routes render inside the shared shell.
- Desktop and mobile layouts are inspected in the browser.

## Out of Scope

- New permissions or authentication behavior.
- New dashboard analytics.
- Changes to public navigation configuration.
- Refactoring individual admin feature pages beyond integration with the shell.
