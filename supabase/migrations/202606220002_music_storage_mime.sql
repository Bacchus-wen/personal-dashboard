alter table public.storage_cleanup_tasks
  drop constraint if exists storage_cleanup_tasks_object_path_check;

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
      || '|music/[A-Za-z0-9_-]+/audio/[0-9a-f-]+\.mp3'
      || '|test/[0-9a-f-]+\.(webp|ico|png|svg))$'
    )
  );

update storage.buckets
set allowed_mime_types = (
  select array_agg(distinct mime_type)
  from unnest(
    coalesce(allowed_mime_types, array[]::text[]) || array['audio/mpeg']
  ) as mime_type
)
where id = 'public-media';

comment on constraint storage_cleanup_tasks_object_path_check
  on public.storage_cleanup_tasks is
  'Allowed generated public-media object paths for cleanup retries.';
