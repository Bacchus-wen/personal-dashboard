# Media Upload Operations

This guide covers Flow 5B-1 shared media upload infrastructure. Do not share
Supabase keys, administrator IDs, session values, `.env.local`, or browser
credential payloads while following it.

## Apply The Migration

1. Open the real Supabase project Dashboard.
2. Open SQL Editor.
3. Run the complete contents of:
   `supabase/migrations/202606150001_media_upload_cleanup_reasons.sql`.
4. Record only whether execution passed or failed.

Docker and the Supabase CLI are optional and are not required for this flow.

## Local Verification Status

Verified locally on 2026-06-15:

- `npm test`: 42 files and 212 tests passed;
- `npm run lint`: passed;
- `npx tsc --noEmit`: passed;
- `git diff --check`: passed;
- `npm run build -- --webpack`: passed after one elevated rerun resolved a
  Windows `.next` `EPERM unlink` cleanup issue.

The build used an ignored `.env.local` copied from an existing local worktree
without reading or displaying its contents.

## Verify Cleanup Reason Constraint

Run:

```sql
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.storage_cleanup_tasks'::regclass
  and conname in (
    'storage_cleanup_tasks_reason_check',
    'storage_cleanup_tasks_object_path_check'
  )
order by conname;
```

Expected:

- `storage_cleanup_tasks_reason_check` includes `create_rollback`,
  `replace_old_file`, and `delete_asset_file`;
- `storage_cleanup_tasks_object_path_check` accepts the approved generated
  album, site, works, collections, projects, and test object paths.

## Verify Bucket And Browser-Role Isolation

Reuse the bucket query from `docs/operations/public-album-storage.md`.
Expected: the `public-media` bucket exists, is public, has a 10 MB limit, and
allows WebP plus favicon ICO, PNG, and SVG MIME types.

Inspect Storage policies for `storage.objects`. Expected: no policy permits
`anon` or `authenticated` direct insert, update, or delete access to
`public-media`. Browser-role writes must go through protected administrator
Route Handlers.

## Verify Admin Test Page

In an external browser:

1. Log in as the administrator.
2. Open `/admin/media/test`.
3. Upload a supported WebP test image.
4. Upload a favicon ICO, PNG, or SVG.
5. Confirm each upload returns a system `path` and `publicUrl`.
6. Confirm the preview renders for the uploaded object.
7. Delete the uploaded test objects from the page.
8. Confirm invalid type, empty file, oversized file, and invalid target fail
   safely.
9. Confirm unauthenticated API requests return `401`.
10. Confirm non-administrator authenticated API requests return `403`.

The test page is internal. It validates upload plumbing only and must not be
used as a media library.

## Verify Cleanup Retry

If a failed media cleanup task exists:

1. Open `/admin/photos/cleanup`.
2. Confirm the task shows a safe object path, reason, and error summary.
3. Retry cleanup.
4. Confirm the Storage object is absent.
5. Confirm the cleanup-task record is removed.

Do not deliberately damage production Storage permissions solely to create a
cleanup task.

## Normal Development Use

- Non-favicon uploads are converted to WebP in the browser before upload.
- Avatar uploads are square-cropped in the browser before upload.
- Favicon uploads are passed through only when the MIME type and extension are
  one of ICO, PNG, or SVG.
- Uploading a file fills the returned system path and preview in the calling
  UI. It must not auto-save the larger business form.
- Manual HTTPS URL or existing local path fields remain supported by business
  forms in Flow 5B-2.
