# Theodore Blog Next.js Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the complete Theodore HTML/CSS prototype into a reusable, responsive Next.js website while preserving `prototype/` as the design source.

**Architecture:** Static content remains in typed data modules and server-rendered pages. Shared interactive behavior is isolated in small client components. A single tokenized CSS system provides the visual source of truth for all routes.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS, ESLint

---

### Task 1: Establish the design system and content model

**Files:**
- Create: `src/styles/design-tokens.css`
- Create: `src/data/site-content.ts`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] Extract the prototype colors, typography, spacing, radii, shadows, motion, glass surfaces, and breakpoints into CSS variables.
- [ ] Define typed navigation, article, project, resource, blog, social, and calendar data with repaired Chinese copy.
- [ ] Replace the starter metadata, fonts, body classes, and starter global styles.
- [ ] Run `npm run lint`; expected result: exit code `0`.

### Task 2: Build reusable chrome and UI components

**Files:**
- Create: `src/components/icons.tsx`
- Create: `src/components/chrome/top-nav.tsx`
- Create: `src/components/chrome/floating-tools.tsx`
- Create: `src/components/chrome/page-shell.tsx`
- Create: `src/components/ui/filterable-grid.tsx`

- [ ] Implement reusable rounded line icons using `currentColor`.
- [ ] Implement route-aware top navigation with a hover glider.
- [ ] Implement quiet-background and scroll-to-top tools.
- [ ] Implement the shared page heading and content shell.
- [ ] Implement reusable client-side search and category filtering.
- [ ] Run `npm run lint`; expected result: exit code `0`.

### Task 3: Migrate the dashboard homepage

**Files:**
- Create: `src/components/home/home-dashboard.tsx`
- Modify: `src/app/page.tsx`

- [ ] Implement the profile sidebar and route links.
- [ ] Implement album preview, greeting, social links, story, and recommendation cards.
- [ ] Implement live clock, calendar, and demo music player as isolated interactive components.
- [ ] Preserve the desktop three-column dashboard and mobile document-flow reorder.
- [ ] Run `npm run lint`; expected result: exit code `0`.

### Task 4: Migrate all content routes

**Files:**
- Create: `src/app/articles/page.tsx`
- Create: `src/app/projects/page.tsx`
- Create: `src/app/resources/page.tsx`
- Create: `src/app/blogs/page.tsx`
- Create: `src/app/album/page.tsx`
- Create: `src/app/about/page.tsx`
- Create: `src/components/ui/album-stack.tsx`

- [ ] Build the article timeline from shared data.
- [ ] Build project cards from shared data.
- [ ] Build searchable/filterable resource and blog grids from shared data.
- [ ] Build the interactive polaroid album.
- [ ] Build the readable about card.
- [ ] Run `npm run lint`; expected result: exit code `0`.

### Task 5: Document project conventions

**Files:**
- Modify: `AGENTS.md`
- Modify: `README.md`

- [ ] Document the formal project structure and route map.
- [ ] Document design-token ownership and component reuse rules.
- [ ] Document the `prototype/` to `src/` Git synchronization workflow.
- [ ] Document local development and verification commands.

### Task 6: Verify and compare

**Files:**
- Modify only files required by verification findings.

- [ ] Run `npm run lint`; expected result: exit code `0`.
- [ ] Run `npm run build`; expected result: exit code `0` and all seven routes generated.
- [ ] Start the local server and inspect every route in the browser.
- [ ] Compare the homepage and one content page against the prototype at desktop width.
- [ ] Inspect the homepage and one content page at mobile width.
- [ ] Verify search, filters, navigation, quiet mode, scroll-to-top, player, and album stacking.
- [ ] Commit the completed migration with a focused message.

