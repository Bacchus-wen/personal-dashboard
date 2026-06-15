alter table public.storage_cleanup_tasks
  drop constraint if exists storage_cleanup_tasks_reason_check;

alter table public.storage_cleanup_tasks
  drop constraint if exists storage_cleanup_tasks_object_path_check;

alter table public.storage_cleanup_tasks
  add constraint storage_cleanup_tasks_reason_check
  check (
    reason in (
      'create_rollback',
      'replace_old_file',
      'delete_asset_file'
    )
  );

alter table public.storage_cleanup_tasks
  add constraint storage_cleanup_tasks_object_path_check
  check (
    object_path ~ (
      '^(album/[0-9a-f-]+/[0-9a-f-]+\.webp'
      || '|site/avatar/[0-9a-f-]+\.webp'
      || '|site/favicon/[0-9a-f-]+\.(ico|png|svg)'
      || '|works/[A-Za-z0-9_-]+/(cover|seo)/[0-9a-f-]+\.webp'
      || '|works/[A-Za-z0-9_-]+/screenshots/[0-9a-f-]+\.webp'
      || '|collections/[A-Za-z0-9_-]+/cover/[0-9a-f-]+\.webp'
      || '|projects/[A-Za-z0-9_-]+/cover/[0-9a-f-]+\.webp'
      || '|test/[0-9a-f-]+\.(webp|ico|png|svg))$'
    )
  );

update storage.buckets
set allowed_mime_types = array[
  'image/webp',
  'image/x-icon',
  'image/vnd.microsoft.icon',
  'image/png',
  'image/svg+xml'
]
where id = 'public-media';

comment on constraint storage_cleanup_tasks_reason_check
  on public.storage_cleanup_tasks is
  'Allowed cleanup reasons for public-media object cleanup retries.';

comment on constraint storage_cleanup_tasks_object_path_check
  on public.storage_cleanup_tasks is
  'Allowed generated public-media object paths for cleanup retries.';
