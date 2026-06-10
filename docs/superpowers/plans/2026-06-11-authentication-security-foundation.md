# Authentication and Security Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-administrator Supabase authentication foundation with password login, mandatory TOTP MFA, protected `/admin` routes, database-enforced administrator authorization, and repeatable security tests.

**Architecture:** Next.js uses Supabase SSR clients and `proxy.ts` only to refresh authentication cookies. Every protected server route independently validates claims, requires `aal2`, and asks the database whether the current user is registered in `admin_users`. PostgreSQL RLS remains the final authorization boundary; the browser receives only the Supabase publishable key.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase Auth/PostgreSQL, `@supabase/ssr`, Vitest, Supabase CLI, pgTAP

---

## Scope And Boundaries

This plan implements only the approved first step:

- Supabase project and local-development structure.
- One administrator account, with no public registration UI.
- Email/password login and mandatory TOTP MFA.
- Protected `/admin` shell.
- `admin_users` and `audit_logs` tables.
- Database function and RLS policies that require both administrator membership and `aal2`.
- Unit, database-policy, build, lint, and browser verification.
- Setup and recovery documentation without real secrets.

This plan does not create plans, works, collections, photos, layout editing, or media buckets.

## Planned File Structure

```text
.
├── .env.example
├── package.json
├── proxy.ts
├── scripts/
│   └── bootstrap-admin.mjs
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── (protected)/
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   └── (public)/
│   │   │       ├── login/page.tsx
│   │   │       ├── mfa/page.tsx
│   │   │       └── unauthorized/page.tsx
│   │   └── globals.css
│   ├── components/admin/
│   │   ├── login-form.tsx
│   │   ├── mfa-panel.tsx
│   │   └── sign-out-button.tsx
│   └── lib/
│       ├── auth/
│       │   ├── access.ts
│       │   └── access.test.ts
│       └── supabase/
│           ├── client.ts
│           ├── proxy.ts
│           └── server.ts
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   └── 202606110001_auth_foundation.sql
│   └── tests/database/
│       └── auth_foundation.test.sql
└── docs/
    └── operations/
        └── authentication-and-recovery.md
```

## Task 1: Install And Configure The Authentication Toolchain

**Files:**
- Modify: `package.json`
- Create: `.env.example`
- Create: `supabase/config.toml`

- [ ] **Step 1: Install runtime and test dependencies**

Run:

```powershell
npm install @supabase/supabase-js @supabase/ssr
npm install --save-dev vitest supabase
```

Expected: `package.json` contains the four packages and installation exits with code `0`.

- [ ] **Step 2: Add repeatable scripts**

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest",
    "supabase:start": "supabase start",
    "supabase:stop": "supabase stop",
    "test:db": "supabase test db"
  }
}
```

- [ ] **Step 3: Initialize local Supabase configuration**

Verify that Docker Desktop is installed and running:

```powershell
docker version
```

Expected: both Client and Server sections are printed. Local Supabase and pgTAP verification cannot run until Docker is available.

Run:

```powershell
npx supabase init
```

Expected: `supabase/config.toml` is created. Do not overwrite it if the CLI reports it already exists.

- [ ] **Step 4: Disable signup in the local Supabase configuration**

Set the Auth signup option in `supabase/config.toml`:

```toml
[auth]
enable_signup = false
```

The hosted Supabase project's equivalent setting must also be disabled before cloud verification.

- [ ] **Step 5: Document environment variable names without secrets**

Create `.env.example`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
ADMIN_EMAIL=
ADMIN_INITIAL_PASSWORD=
```

`SUPABASE_SECRET_KEY`, `ADMIN_EMAIL`, and `ADMIN_INITIAL_PASSWORD` are used only by the local administrator bootstrap script. They must not use the `NEXT_PUBLIC_` prefix or be configured as browser-readable values.

- [ ] **Step 6: Verify configuration**

Run:

```powershell
npm run lint
npm test
git diff --check
```

Expected: lint exits `0`; Vitest exits `0` with no test files or the currently existing tests; `git diff --check` prints nothing.

- [ ] **Step 7: Commit**

```powershell
git add package.json package-lock.json .env.example supabase/config.toml
git commit -m "chore: add Supabase auth toolchain"
```

## Task 2: Create And Test The Database Authorization Boundary

**Files:**
- Create: `supabase/migrations/202606110001_auth_foundation.sql`
- Create: `supabase/tests/database/auth_foundation.test.sql`

- [ ] **Step 1: Write the failing pgTAP policy tests**

Create `supabase/tests/database/auth_foundation.test.sql`:

```sql
begin;

create extension if not exists pgtap with schema extensions;
select plan(10);

select has_table('public', 'admin_users', 'admin_users exists');
select has_table('public', 'audit_logs', 'audit_logs exists');
select has_function('public', 'is_admin_aal2', array[]::text[], 'is_admin_aal2 exists');

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000001', 'admin@example.test'),
  ('20000000-0000-0000-0000-000000000002', 'user@example.test');

insert into public.admin_users (user_id)
values ('10000000-0000-0000-0000-000000000001');

set local role authenticated;

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}',
  true
);
select is(public.is_admin_aal2(), false, 'administrator without MFA is rejected');
select throws_ok(
  $$ insert into public.audit_logs (action) values ('blocked-aal1') $$,
  '42501',
  null,
  'administrator without MFA cannot write audit logs'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal2"}',
  true
);
select is(public.is_admin_aal2(), false, 'non-administrator with MFA is rejected');
select throws_ok(
  $$ insert into public.audit_logs (action) values ('blocked-user') $$,
  '42501',
  null,
  'non-administrator cannot write audit logs'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}',
  true
);
select is(public.is_admin_aal2(), true, 'administrator with MFA is accepted');
select lives_ok(
  $$ insert into public.audit_logs (action) values ('admin-login') $$,
  'administrator with MFA can write audit logs'
);
select results_eq(
  $$ select count(*)::bigint from public.audit_logs $$,
  $$ values (1::bigint) $$,
  'administrator with MFA can read audit logs'
);

select * from finish();
rollback;
```

- [ ] **Step 2: Run the database test and confirm RED**

Run:

```powershell
npm run supabase:start
npm run test:db
```

Expected: FAIL because `admin_users`, `audit_logs`, and `is_admin_aal2` do not exist.

- [ ] **Step 3: Implement the migration**

Create `supabase/migrations/202606110001_auth_foundation.sql`:

```sql
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid not null default auth.uid() references auth.users(id),
  action text not null check (char_length(action) between 1 and 120),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.is_admin_aal2()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.jwt()->>'aal') = 'aal2'
    and exists (
      select 1
      from public.admin_users
      where user_id = (select auth.uid())
    );
$$;

revoke all on function public.is_admin_aal2() from public;
grant execute on function public.is_admin_aal2() to authenticated;

create policy "admin_users_are_private"
on public.admin_users
for select
to authenticated
using (public.is_admin_aal2());

create policy "admins_read_audit_logs"
on public.audit_logs
for select
to authenticated
using (public.is_admin_aal2());

create policy "admins_insert_audit_logs"
on public.audit_logs
for insert
to authenticated
with check (
  public.is_admin_aal2()
  and actor_id = (select auth.uid())
);
```

- [ ] **Step 4: Reset local database and confirm GREEN**

Run:

```powershell
npx supabase db reset
npm run test:db
```

Expected: all 10 pgTAP assertions pass.

- [ ] **Step 5: Commit**

```powershell
git add supabase/migrations/202606110001_auth_foundation.sql supabase/tests/database/auth_foundation.test.sql
git commit -m "feat: enforce administrator MFA in database"
```

## Task 3: Add Supabase SSR Clients And Session Refresh Proxy

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/proxy.ts`
- Create: `proxy.ts`

- [ ] **Step 1: Create the browser client**

Create `src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
```

- [ ] **Step 2: Create the server client**

Create `src/lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot write cookies; proxy.ts refreshes them.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 3: Create session refresh logic**

Create `src/lib/supabase/proxy.ts` using Supabase's SSR cookie pattern and `getClaims()`:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  await supabase.auth.getClaims();
  return response;
}
```

Create root `proxy.ts`:

```ts
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

- [ ] **Step 4: Verify types and lint**

Run:

```powershell
npm run lint
npm run build
```

Expected: both commands exit `0`. No secret key appears in these files.

- [ ] **Step 5: Commit**

```powershell
git add proxy.ts src/lib/supabase/client.ts src/lib/supabase/server.ts src/lib/supabase/proxy.ts
git commit -m "feat: add Supabase SSR session clients"
```

## Task 4: Implement A Testable Server Authorization Gate

**Files:**
- Create: `src/lib/auth/access.ts`
- Create: `src/lib/auth/access.test.ts`

- [ ] **Step 1: Write failing access-decision tests**

Create `src/lib/auth/access.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { decideAdminAccess } from "./access";

describe("decideAdminAccess", () => {
  it("sends anonymous visitors to login", () => {
    expect(decideAdminAccess({ authenticated: false, aal: null, isAdmin: false })).toBe("/admin/login");
  });

  it("sends aal1 administrators to MFA", () => {
    expect(decideAdminAccess({ authenticated: true, aal: "aal1", isAdmin: false })).toBe("/admin/mfa");
  });

  it("rejects aal2 users that are not administrators", () => {
    expect(decideAdminAccess({ authenticated: true, aal: "aal2", isAdmin: false })).toBe("/admin/unauthorized");
  });

  it("allows aal2 administrators", () => {
    expect(decideAdminAccess({ authenticated: true, aal: "aal2", isAdmin: true })).toBe(null);
  });
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run:

```powershell
npm test -- src/lib/auth/access.test.ts
```

Expected: FAIL because `access.ts` does not exist.

- [ ] **Step 3: Implement the pure decision and server lookup**

Create `src/lib/auth/access.ts`:

```ts
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type AccessState = {
  authenticated: boolean;
  aal: "aal1" | "aal2" | null;
  isAdmin: boolean;
};

export function decideAdminAccess(state: AccessState) {
  if (!state.authenticated) return "/admin/login";
  if (state.aal !== "aal2") return "/admin/mfa";
  if (!state.isAdmin) return "/admin/unauthorized";
  return null;
}

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const authenticated = Boolean(claimsData?.claims?.sub);
  const aal = (claimsData?.claims?.aal as AccessState["aal"]) ?? null;
  const { data: isAdmin } = authenticated && aal === "aal2"
    ? await supabase.rpc("is_admin_aal2")
    : { data: false };

  const destination = decideAdminAccess({ authenticated, aal, isAdmin: isAdmin === true });
  if (destination) redirect(destination);
}
```

- [ ] **Step 4: Run tests and confirm GREEN**

Run:

```powershell
npm test -- src/lib/auth/access.test.ts
npm run lint
```

Expected: four tests pass and lint exits `0`.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/auth/access.ts src/lib/auth/access.test.ts
git commit -m "feat: add administrator access gate"
```

## Task 5: Build Password Login, Protected Admin Shell, And Sign Out

**Files:**
- Create: `src/app/admin/(public)/login/page.tsx`
- Create: `src/app/admin/(protected)/layout.tsx`
- Create: `src/app/admin/(protected)/page.tsx`
- Create: `src/app/admin/(public)/unauthorized/page.tsx`
- Create: `src/components/admin/login-form.tsx`
- Create: `src/components/admin/sign-out-button.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Create the login form**

Implement `src/components/admin/login-form.tsx` as a client component that:

```ts
const { error } = await supabase.auth.signInWithPassword({ email, password });
if (!error) router.replace("/admin");
```

The rendered form must contain:

```tsx
<form onSubmit={handleSubmit}>
  <label>邮箱<input name="email" type="email" autoComplete="username" required /></label>
  <label>密码<input name="password" type="password" autoComplete="current-password" required /></label>
  <button type="submit" disabled={pending}>{pending ? "登录中..." : "登录"}</button>
  <p role="alert">{errorMessage}</p>
</form>
```

Do not provide a registration link.

- [ ] **Step 2: Create login and protected admin pages**

`src/app/admin/(public)/login/page.tsx` renders `LoginForm`.

`src/app/admin/(protected)/layout.tsx` must call `await requireAdmin()` before rendering children.

`src/app/admin/(protected)/page.tsx` renders a minimal dashboard heading and security status.

`src/app/admin/(public)/unauthorized/page.tsx` explains that the current account is not the configured administrator.

- [ ] **Step 3: Add sign out**

Create `src/components/admin/sign-out-button.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const signOut = async () => {
    await createClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };
  return <button onClick={signOut}>退出登录</button>;
}
```

- [ ] **Step 4: Add focused admin styles**

Add `.admin-shell`, `.auth-card`, `.auth-form`, `.auth-error`, and `.admin-header` styles to `src/app/globals.css`. Reuse existing design tokens, `.glass`, `.card`, and focus styles. Do not modify public-page layouts.

- [ ] **Step 5: Verify**

Run:

```powershell
npm test
npm run lint
npm run build
```

Expected: all commands exit `0`.

- [ ] **Step 6: Commit**

```powershell
git add src/app/admin src/components/admin src/app/globals.css
git commit -m "feat: add protected administrator login shell"
```

## Task 6: Add Mandatory TOTP MFA Enrollment And Challenge

**Files:**
- Create: `src/app/admin/(public)/mfa/page.tsx`
- Create: `src/components/admin/mfa-panel.tsx`

- [ ] **Step 1: Build the MFA panel**

Create `src/components/admin/mfa-panel.tsx` as a client component with two flows:

1. Call `supabase.auth.mfa.listFactors()`.
2. If no verified TOTP factor exists, call:

```ts
await supabase.auth.mfa.enroll({
  factorType: "totp",
  friendlyName: "Theodore Admin",
});
```

Display the returned QR code and secret, accept the six-digit code, then call:

```ts
const challenge = await supabase.auth.mfa.challenge({ factorId });
await supabase.auth.mfa.verify({
  factorId,
  challengeId: challenge.data.id,
  code,
});
```

3. If a verified factor exists, challenge and verify that factor directly.
4. After successful verification, call `router.replace("/admin")` and `router.refresh()`.

The panel must display errors in an element with `role="alert"` and must never log the TOTP secret or code.

- [ ] **Step 2: Create the MFA route outside the protected admin layout**

Create `src/app/admin/(public)/mfa/page.tsx`. It must:

- Verify that the visitor has a valid authenticated claim.
- Redirect anonymous visitors to `/admin/login`.
- Render `MfaPanel` without calling `requireAdmin()`, because an `aal1` administrator must be able to reach it.

The `(public)` route group keeps `/admin/mfa`, `/admin/login`, and `/admin/unauthorized` outside the protected layout while preserving their final URLs.

- [ ] **Step 3: Verify the MFA routing logic**

Run:

```powershell
npm test
npm run lint
npm run build
```

Expected: all commands exit `0`; `/admin/mfa` builds without redirect loops.

- [ ] **Step 4: Commit**

```powershell
git add src/app/admin src/components/admin/mfa-panel.tsx
git commit -m "feat: require TOTP MFA for administrator access"
```

## Task 7: Bootstrap The Single Administrator Safely

**Files:**
- Create: `scripts/bootstrap-admin.mjs`
- Modify: `.env.example`

- [ ] **Step 1: Create the local-only bootstrap script**

Create `scripts/bootstrap-admin.mjs`:

```js
import { createClient } from "@supabase/supabase-js";

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "ADMIN_EMAIL",
  "ADMIN_INITIAL_PASSWORD",
];

for (const name of required) {
  if (!process.env[name]) throw new Error(`Missing ${name}`);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const { data, error } = await supabase.auth.admin.createUser({
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_INITIAL_PASSWORD,
  email_confirm: true,
});

if (error) throw error;

const { error: insertError } = await supabase
  .from("admin_users")
  .insert({ user_id: data.user.id });

if (insertError) throw insertError;
console.log(`Administrator created: ${data.user.id}`);
```

This script must never print the password or secret key.

- [ ] **Step 2: Add an explicit bootstrap command**

Add to `package.json`:

```json
"admin:bootstrap": "node --env-file=.env.local scripts/bootstrap-admin.mjs"
```

- [ ] **Step 3: Verify the script fails safely without secrets**

Run:

```powershell
node scripts/bootstrap-admin.mjs
```

Expected: exits non-zero with `Missing NEXT_PUBLIC_SUPABASE_URL` or the first missing variable; no secret value is printed.

- [ ] **Step 4: Commit**

```powershell
git add scripts/bootstrap-admin.mjs package.json package-lock.json .env.example
git commit -m "chore: add single administrator bootstrap"
```

## Task 8: Document Cloud Setup, Recovery, And Security Verification

**Files:**
- Create: `docs/operations/authentication-and-recovery.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Write the operational guide**

Create `docs/operations/authentication-and-recovery.md` with these concrete procedures:

```markdown
# Authentication And Recovery

## Initial Setup
1. Create one Supabase project.
2. Disable public user signups in Supabase Auth settings.
3. Copy the project URL, publishable key, and secret key into `.env.local`.
4. Run migrations with `npx supabase db push`.
5. Run `npm run admin:bootstrap` once.
6. Remove `ADMIN_INITIAL_PASSWORD` and `SUPABASE_SECRET_KEY` from `.env.local` after bootstrap unless another local administrative operation requires them.
7. Log in at `/admin/login` and enroll a TOTP authenticator.
8. Configure only the URL and publishable key in Vercel. Do not put the bootstrap password or secret key in browser-readable variables.

## Lost Password
Use the Supabase dashboard to send a password reset or set a new administrator password. Do not create a second administrator.

## Lost MFA Device
Verify account ownership through the Supabase dashboard, remove the lost TOTP factor, sign in with the password, and enroll a new factor immediately.

## Suspected Account Compromise
Change the administrator password, remove unknown MFA factors, revoke active sessions, rotate Supabase keys if exposed, inspect audit logs, and redeploy.

## Security Verification
- Anonymous visitor cannot open `/admin`.
- Password-only administrator is redirected to `/admin/mfa`.
- MFA-authenticated non-admin is rejected.
- MFA-authenticated administrator can open `/admin`.
- `npm run test:db`, `npm test`, `npm run lint`, and `npm run build` pass.
```

- [ ] **Step 2: Add authentication rules to `AGENTS.md`**

Add:

```markdown
## Authentication and data security

- Never expose Supabase secret keys or service-role credentials to browser code.
- Protect admin behavior in both server-side route checks and database RLS.
- Require `aal2` for every administrator data mutation.
- Public registration remains disabled; the project supports one administrator.
- Run `npm run test:db` after every migration or RLS policy change.
- Follow `docs/operations/authentication-and-recovery.md` for setup and recovery.
```

- [ ] **Step 3: Run complete automated verification**

Run:

```powershell
npm run test:db
npm test
npm run lint
npm run build
git diff --check
```

Expected: database tests pass; unit tests pass; lint and build exit `0`; diff check prints nothing.

- [ ] **Step 4: Perform browser verification**

Using the in-app browser, verify:

1. Anonymous `/admin` access reaches `/admin/login`.
2. The login page has no registration link.
3. Password-only administrator access reaches `/admin/mfa`.
4. Successful TOTP verification reaches `/admin`.
5. Signing out returns to `/admin/login`.
6. Public routes still render at desktop and mobile widths.

Record any cloud-only step that cannot be completed locally. Do not claim the cloud security configuration is verified until the Supabase dashboard settings and hosted RLS policies are checked.

- [ ] **Step 5: Commit**

```powershell
git add docs/operations/authentication-and-recovery.md AGENTS.md
git commit -m "docs: add authentication operations guide"
```

## Final Acceptance Checklist

- [ ] No public registration UI exists.
- [ ] Anonymous users cannot enter `/admin`.
- [ ] Password-only sessions cannot enter the protected admin shell.
- [ ] An `aal2` session that is not listed in `admin_users` cannot enter the protected admin shell.
- [ ] The sole administrator with `aal2` can enter `/admin`.
- [ ] pgTAP proves RLS rejects `aal1` administrators and `aal2` non-admin users.
- [ ] Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are browser-readable.
- [ ] No real secret, password, TOTP seed, or administrator identifier is committed.
- [ ] Recovery and compromise-response procedures are documented.
- [ ] Public-site routes remain functional.

## Implementation References

- Supabase SSR clients and cookie refresh: <https://supabase.com/docs/guides/auth/server-side/nextjs>
- Supabase MFA and `aal2`: <https://supabase.com/docs/guides/auth/auth-mfa>
- Supabase TOTP: <https://supabase.com/docs/guides/auth/auth-mfa/totp>
- Supabase RLS: <https://supabase.com/docs/guides/database/postgres/row-level-security>
- Supabase database testing: <https://supabase.com/docs/guides/local-development/testing/overview>
- Next.js authentication guide: `node_modules/next/dist/docs/01-app/02-guides/authentication.md`
- Next.js Proxy convention: `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`
