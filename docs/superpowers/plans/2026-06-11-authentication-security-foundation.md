# Moderate Authentication Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a maintainable single-administrator login and protected backend using Supabase Auth, Next.js server-side authorization, and server-only database access without Docker, mandatory MFA, or pgTAP.

**Architecture:** Supabase Auth manages email/password accounts and sessions. Every protected page, Server Action, and Route Handler verifies the current user on the Next.js server and compares the user ID with server-only `ADMIN_USER_ID`. Browser roles are denied direct access to backend tables and private files; verified server code uses `SUPABASE_SECRET_KEY` for database and Storage operations.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase Auth/PostgreSQL/Storage, `@supabase/supabase-js`, `@supabase/ssr`, Vitest, Vercel

---

## Execution Rules

- Start implementation from clean `master` in a new feature branch. Do not merge the abandoned `feature/auth-security-foundation` branch.
- Before any `npm install`, CLI installation, download, or command likely to write outside `F:\网站制作`, explain its purpose, likely disk impact, and write location, then wait for user approval.
- Do not install Docker.
- Use TDD for authorization decisions and server mutation guards.
- Do not claim cloud authentication or database permissions work until verified against the actual Supabase cloud project.

## Planned Structure

```text
src/
├── app/admin/
│   ├── (protected)/layout.tsx
│   ├── (protected)/page.tsx
│   ├── login/page.tsx
│   └── recover/page.tsx
├── components/admin/
│   ├── login-form.tsx
│   └── sign-out-button.tsx
└── lib/
    ├── auth/
    │   ├── access.ts
    │   └── access.test.ts
    └── supabase/
        ├── browser.ts
        ├── server-auth.ts
        └── server-admin.ts
proxy.ts
supabase/migrations/202606110001_private_server_access.sql
docs/operations/authentication-and-recovery.md
```

## Task 1: Clean Branch And Dependency Approval

**Files:**
- Modify after approval: `package.json`
- Modify after approval: `package-lock.json`
- Create: `.env.example`

- [ ] Confirm `master` is clean and create a new feature branch.
- [ ] Explain before installation that `@supabase/supabase-js`, `@supabase/ssr`, and Vitest will be added to project-local `node_modules` on F drive; npm may still use its configured cache. State the observed package-lock and disk impact after installation.
- [ ] Wait for explicit user approval before running installation.
- [ ] Add scripts:

```json
"test": "vitest run --passWithNoTests",
"test:watch": "vitest"
```

- [ ] Create `.env.example` without real values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
ADMIN_USER_ID=
```

- [ ] Run `npm test`, `npm run lint`, and `git diff --check`.
- [ ] Commit: `chore: add moderate auth dependencies`

## Task 2: Test And Implement Server Authorization Decision

**Files:**
- Create: `src/lib/auth/access.test.ts`
- Create: `src/lib/auth/access.ts`

- [ ] Write failing tests for:
  - anonymous user redirects to `/admin/login`;
  - authenticated non-admin redirects to `/admin/unauthorized`;
  - configured administrator is allowed.
- [ ] Run the focused test and confirm it fails because implementation is absent.
- [ ] Implement a pure authorization decision:

```ts
export function decideAdminAccess(userId: string | null, adminUserId: string) {
  if (!userId) return "/admin/login";
  if (userId !== adminUserId) return "/admin/unauthorized";
  return null;
}
```

- [ ] Run the focused test and full unit suite.
- [ ] Commit: `feat: add single administrator access decision`

## Task 3: Add Supabase Browser And Server Clients

**Files:**
- Create: `src/lib/supabase/browser.ts`
- Create: `src/lib/supabase/server-auth.ts`
- Create: `src/lib/supabase/server-admin.ts`
- Create: `src/lib/supabase/env.ts`
- Create: `proxy.ts`

- [ ] Create environment validation that fails clearly when required variables are missing and never prints secret values.
- [ ] Create a browser client using only URL and publishable key.
- [ ] Create a server auth client using URL, publishable key, and request cookies.
- [ ] Create a server-only admin client using `SUPABASE_SECRET_KEY`, with session persistence disabled.
- [ ] Add `import "server-only"` to the admin client module.
- [ ] Add Next.js `proxy.ts` only for Supabase session-cookie refresh.
- [ ] Search production client code and confirm `SUPABASE_SECRET_KEY` appears only in server-only modules.
- [ ] Run tests, lint, and build.
- [ ] Commit: `feat: add server-only Supabase access`

## Task 4: Protect Admin Routes And Server Operations

**Files:**
- Modify: `src/lib/auth/access.ts`
- Modify: `src/lib/auth/access.test.ts`
- Create: `src/app/admin/(protected)/layout.tsx`
- Create: `src/app/admin/(protected)/page.tsx`
- Create: `src/app/admin/unauthorized/page.tsx`

- [ ] Write failing tests for the server authorization guard using injected user ID and configured administrator ID.
- [ ] Implement `requireAdmin()`:
  - obtain the current authenticated user from the server auth client;
  - compare its ID with server-only `ADMIN_USER_ID`;
  - redirect anonymous and non-admin users appropriately.
- [ ] Make the protected admin layout call `requireAdmin()` before rendering.
- [ ] Add a minimal admin dashboard showing no private data yet.
- [ ] Create one sample protected server operation and test that it rejects unauthenticated and non-admin calls before using the admin database client.
- [ ] Run tests, lint, and build.
- [ ] Commit: `feat: protect administrator routes and operations`

## Task 5: Build Login, Logout, And Recovery

**Files:**
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/recover/page.tsx`
- Create: `src/components/admin/login-form.tsx`
- Create: `src/components/admin/sign-out-button.tsx`
- Modify: `src/app/globals.css`

- [ ] Build an email/password login form using Supabase Auth.
- [ ] Do not provide a registration link.
- [ ] Build sign-out behavior and return to `/admin/login`.
- [ ] Build password-recovery request flow using Supabase Auth.
- [ ] Reuse existing design tokens and glass-card styles.
- [ ] Verify keyboard navigation, visible errors, loading states, and no public-site layout regressions.
- [ ] Run tests, lint, build, and browser checks.
- [ ] Commit: `feat: add administrator login and recovery`

## Task 6: Deny Direct Browser Data Access

**Files:**
- Create: `supabase/migrations/202606110001_private_server_access.sql`
- Create: `docs/operations/supabase-cloud-setup.md`

- [ ] Create a migration that revokes direct table access from `anon` and `authenticated` for backend-only tables.
- [ ] Do not add complex per-row business RLS policies in this phase.
- [ ] Document how to apply the migration using the Supabase dashboard SQL editor, avoiding local Docker and CLI requirements.
- [ ] In a dedicated non-production table, verify through the actual cloud project:
  - publishable-key browser client cannot read or write;
  - authenticated browser client cannot read or write;
  - verified server-only admin client can read and write.
- [ ] Record the exact cloud verification result without including keys or private IDs.
- [ ] Commit: `feat: deny direct browser database access`

## Task 7: Document Operations And Complete Verification

**Files:**
- Create: `docs/operations/authentication-and-recovery.md`
- Modify: `AGENTS.md`

- [ ] Document:
  - disabling public registration;
  - manually creating the sole administrator in Supabase Dashboard;
  - locating and configuring `ADMIN_USER_ID`;
  - setting Vercel environment variables;
  - password recovery;
  - revoking sessions;
  - rotating exposed keys;
  - platform-account two-step verification;
  - backup and restore basics.
- [ ] Add project rules:
  - no secret keys in browser code or Git;
  - all backend writes require `requireAdmin()`;
  - no installation/download without prior user approval;
  - no Docker requirement for this phase.
- [ ] Run:

```powershell
npm test
npm run lint
npm run build
git diff --check
```

- [ ] Verify using the actual Supabase cloud project:
  - anonymous user cannot access `/admin`;
  - non-admin account cannot access `/admin`;
  - administrator can log in and sign out;
  - password recovery request works;
  - browser cannot directly access protected data;
  - server-only protected operation succeeds for administrator.
- [ ] Inspect the production browser bundle and network responses for secret leakage.
- [ ] Commit: `docs: add moderate authentication operations guide`

## Acceptance Checklist

- [ ] Public registration is disabled.
- [ ] Only the configured administrator ID can access `/admin`.
- [ ] Every management write operation calls the server authorization guard.
- [ ] Browser code and responses never contain `SUPABASE_SECRET_KEY`.
- [ ] Browser Supabase clients cannot directly read or modify protected data.
- [ ] Private Storage objects are not publicly accessible.
- [ ] Login, logout, expiration, and recovery work against the cloud project.
- [ ] GitHub, Vercel, Supabase, email, and domain accounts use platform two-step verification.
- [ ] No Docker or pgTAP dependency remains.
- [ ] No real secrets are committed.

## References

- Supabase Next.js SSR authentication: <https://supabase.com/docs/guides/auth/server-side/nextjs>
- Supabase API keys: <https://supabase.com/docs/guides/api/api-keys>
- Vercel environment variables: <https://vercel.com/docs/environment-variables>
- Next.js authentication guide: `node_modules/next/dist/docs/01-app/02-guides/authentication.md`
