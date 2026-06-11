# Administrator Authentication And Recovery

## Current Model

- Supabase Auth manages the sole administrator account and session.
- Public registration and anonymous sign-in are disabled.
- The Next.js server compares every protected session user ID with
  server-only `ADMIN_USER_ID`.
- Browser code uses only the publishable key.
- The secret key is restricted to server-only modules and environment variables.
- Backend writes must verify the administrator before using the server-only
  Supabase client.

## Local Environment

Create `.env.local` from `.env.example` and set:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
ADMIN_USER_ID=
```

Never add database passwords, administrator passwords, or real key values to
Git. Confirm `.env.local` is ignored with:

```powershell
git check-ignore -v .env.local
```

Local Next.js development caches under `.next/dev/cache` may contain server
environment values. The entire `.next` directory must remain ignored and must
never be uploaded as source code. Verify that the real secret is absent from
Git-tracked files, browser static assets, and production build output.

## Administrator Account

In the Supabase dashboard:

1. Disable **Allow new users to sign up**.
2. Disable **Allow anonymous sign-ins**.
3. Manually create the sole administrator under Authentication > Users.
4. Copy that user's ID into `ADMIN_USER_ID`.
5. Use a unique password with at least 12 characters.

## Password Recovery

1. Open `/admin/recover`.
2. Enter the administrator email.
3. Open the Supabase recovery email.
4. Set a new password.
5. Sign in with the new password.

The database project password does not change when the administrator Auth
password changes.

## Revoke Sessions

When a device or session may be compromised:

1. Open Supabase Dashboard > Authentication > Users.
2. Select the administrator.
3. Revoke the user's sessions.
4. Change the administrator password.
5. Review recent deployments and server logs.

## Rotate An Exposed Secret Key

If `SUPABASE_SECRET_KEY` may have been exposed:

1. Create a replacement secret key in Supabase.
2. Update the local and Vercel environment variables.
3. Redeploy the website.
4. Revoke the exposed key.
5. Re-run the cloud permission verification.

Never put the replacement key in chat, screenshots, Git, browser storage, or
client-side code.

## Vercel Environment Variables

Before deployment, add all four variables to the Vercel project. Keep
`SUPABASE_SECRET_KEY` and `ADMIN_USER_ID` server-only. Apply the variables to
Production and the intended Preview environments, then redeploy.

## Account Security

Enable platform-provided two-step verification for:

- GitHub
- Vercel
- Supabase
- the administrator email account
- the domain registrar

Store the database password, administrator password, recovery codes, and key
rotation notes in a password manager.

## Backup Basics

- Git history and a private GitHub repository protect source code history.
- Supabase-managed backups protect cloud database state according to the active
  plan.
- Export important database data periodically before major schema changes.
- Keep important media in an independent backup location.
- Test restoration instructions before relying on them.

## Verified On June 11, 2026

- Public registration was disabled.
- Supabase Auth contained exactly one user, matching the configured administrator.
- Administrator login and sign-out worked against the cloud project.
- Password recovery email, password update, and login with the new password
  worked.
- Publishable-key direct table read and write were denied.
- Authenticated browser-role direct table read and write were denied.
- Server-only direct table insert, read, and delete worked.
- No verification row remained after testing.
- The real secret key was absent from Git-tracked files, browser static assets,
  and production build output.

Not yet verified:

- Vercel deployment environment variables and production login.
- Private Storage permissions.
- External platform two-step verification settings.
