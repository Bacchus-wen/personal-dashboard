# Supabase Cloud Setup And Access Verification

This project uses the Supabase cloud dashboard directly. It does not require
Docker or the Supabase CLI.

## Required Project Settings

- Authentication > Sign In / Providers > Allow new users to sign up: off
- Authentication > Sign In / Providers > Allow anonymous sign-ins: off
- Authentication > Users: exactly one intended administrator
- `.env.local`: contains the four required variables from `.env.example`
- `.env.local`: remains ignored by Git

Never paste passwords or API keys into documentation, Git, chat, screenshots, or
browser code.

## Apply The Verification Migration

1. Open the Supabase project dashboard.
2. Open **SQL Editor**.
3. Choose **New query**.
4. Copy the complete contents of
   `supabase/migrations/202606110001_private_server_access.sql`.
5. Paste the SQL into the editor.
6. Review that it only references `public.private_access_probe`.
7. Click **Run**.

The migration creates one temporary verification table. It enables Row Level
Security, gives no policy to browser roles, explicitly revokes browser-role
privileges, and keeps server-only access available.

## Expected Verification Results

- A client using the publishable key cannot select from or insert into
  `private_access_probe`.
- A signed-in browser client cannot select from or insert into
  `private_access_probe`.
- The Next.js server client using `SUPABASE_SECRET_KEY` can insert, select, and
  delete verification rows.

Record only pass/fail outcomes. Never record key values, user IDs, or private
data.

## Verification Record

Verified against the Supabase cloud project on June 11, 2026:

- Required environment variables were present and matched their expected formats.
- Public email signup and anonymous sign-in were disabled.
- Supabase Auth contained one user, matching the configured administrator ID.
- A publishable-key client could not read or write `private_access_probe`.
- An authenticated browser-role client could not read or write
  `private_access_probe`.
- A server-only secret-key client could insert, read, and delete a verification
  row.
- The verification row was deleted after the test.

Still requiring separate verification:

- Private Storage objects are not publicly accessible.

## Remove The Verification Table

After the permission boundary has been verified and no test row is needed, run:

```sql
drop table if exists public.private_access_probe;
```

Do not remove the migration file from Git. It documents the security boundary
that was verified during development.
