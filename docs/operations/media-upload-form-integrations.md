# Flow 5B-2 Media Upload Form Integrations Operations

## Safety

- Do not paste `.env.local`, keys, administrator IDs, sessions, or request
  headers into SQL Editor or chat.
- Apply the migration only to the intended Theodore Supabase project.
- The migration does not change RLS or browser-role grants.

## Apply Migration

Run this file in Supabase SQL Editor:

```text
supabase/migrations/202606150002_media_upload_form_integrations.sql
```

Expected result:

```text
Success. No rows returned
```

## Verify Featured Project Cover Column

```sql
select
  table_schema,
  table_name,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'featured_projects'
  and column_name = 'cover_path';
```

Expected: one nullable `text` column.

## Verify Image Path Constraints

```sql
select
  conrelid::regclass as table_name,
  conname,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conname in (
  'works_cover_path_check',
  'works_seo_image_path_check',
  'work_screenshots_image_path_check',
  'collections_cover_path_check',
  'featured_projects_cover_path_check'
)
order by conname;
```

Expected: five rows. Each definition must retain project-local and HTTPS paths
and include the matching generated `public-media` object path.

## Verify RLS Remains Enabled

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'works',
    'work_screenshots',
    'collections',
    'featured_projects',
    'storage_cleanup_tasks'
  )
order by tablename;
```

Expected: every row has `rowsecurity = true`.

## Verify Browser Roles Remain Denied

```sql
select
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'works',
    'work_screenshots',
    'collections',
    'featured_projects',
    'storage_cleanup_tasks'
  )
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;
```

Expected: no rows.

Use the existing Storage policy inspection query in
`docs/operations/media-upload.md` to confirm browser roles still cannot write
to `public-media`.

## Browser Acceptance

As administrator, verify:

1. New Works, Collections, and Featured Projects show the first-save upload
   hint.
2. Edit pages upload and save generated media paths.
3. Site avatar and favicon update after publishing.
4. Works cover, SEO image, and multiple screenshots display publicly.
5. Collections and Featured Projects covers display publicly.
6. Replacing or clearing a saved system image removes the old object or creates
   a cleanup task.
7. Moving a record to trash preserves images.
8. Permanently deleting a record removes associated system images or creates
   cleanup tasks.
9. HTTPS and project-local image paths remain supported.

## Cleanup Verification

Inspect pending cleanup tasks:

```sql
select
  id,
  bucket_id,
  object_path,
  reason,
  last_error,
  created_at,
  updated_at
from public.storage_cleanup_tasks
order by created_at desc;
```

Expected cleanup reasons for this flow:

```text
replace_old_file
delete_asset_file
```
