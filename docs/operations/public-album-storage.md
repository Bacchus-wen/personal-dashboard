# Public Album And Storage Operations

This guide covers the public album and `public-media` Storage foundation
introduced in flow 5A. Never record or share Supabase keys, administrator IDs,
session values, or `.env.local` contents while following it.

## Apply The Migration

1. Open the real Supabase project Dashboard.
2. Open SQL Editor.
3. Run the complete contents of:
   `supabase/migrations/202606140002_public_album_storage.sql`.
4. Record only whether execution passed or failed.

Docker and the Supabase CLI are optional and are not required for this flow.

## Verify Tables And RLS

Run:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('photos', 'storage_cleanup_tasks')
order by tablename;
```

Expected: both tables exist and `rowsecurity` is `true`.

Verify browser roles do not have direct table privileges:

```sql
select
  grantee,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('photos', 'storage_cleanup_tasks')
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;
```

Expected: no rows.

## Verify The Public Storage Bucket

Run:

```sql
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'public-media';
```

Expected:

- one `public-media` row;
- `public` is `true`;
- `file_size_limit` is `10485760`;
- `allowed_mime_types` contains only `image/webp`.

The migration intentionally creates no browser-role `insert`, `update`, or
`delete` policy on `storage.objects`. Verify direct uploads, replacements, and
deletes using browser Supabase credentials fail. Do not share those credentials
or request payloads in chat or project documentation.

## Verify Protected Administrator Operations

Use:

- `/admin/photos`
- `/admin/photos/new`
- `/admin/photos/trash`
- `/admin/photos/cleanup`

Verify:

1. An unauthenticated visitor is redirected away from protected pages.
2. An unauthenticated upload or replacement request returns JSON `401`.
3. A non-administrator authenticated user receives JSON `403`.
4. The administrator can upload supported photos.
5. Each successful upload creates a draft photo record.
6. The administrator can edit visibility and sort order.
7. The administrator can replace the current file.
8. The administrator can move a photo to trash.
9. Restoring a photo changes visibility to `draft`.
10. Permanent deletion removes the current Storage object before deleting the
    database record.

## Verify Public Isolation

Create temporary draft, public, archived, and trashed photos through the
protected administrator pages.

- Only public, non-trashed photos may appear on `/album`.
- Only public, non-trashed photos may appear in the homepage album module.
- Draft, archived, and trashed photos must remain absent.
- The public photo result must not expose original filenames or Storage paths.

Delete all temporary verification records and objects after testing.

## Verify Cleanup Retry

If a failed old-file cleanup task is safely available:

1. Open `/admin/photos/cleanup`.
2. Confirm the task shows a safe object path, reason, and error summary.
3. Retry cleanup.
4. Confirm the Storage object is absent.
5. Confirm the cleanup-task record is removed.

Do not deliberately damage production Storage permissions solely to create a
cleanup task.

## Normal Content Operations

1. Upload up to ten supported images at a time.
2. Confirm every successful image appears as a draft.
3. Review the full and polaroid previews.
4. Set sort order and publish only photos intended for public sharing.
5. Archive or move obsolete photos to trash.
6. Permanently delete trashed photos only after confirming they are no longer
   needed.

Important photos must also exist in an independent backup location.
