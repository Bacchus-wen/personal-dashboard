alter table public.storage_cleanup_tasks
  drop constraint if exists storage_cleanup_tasks_reason_check;

alter table public.storage_cleanup_tasks
  add constraint storage_cleanup_tasks_reason_check
  check (
    reason in (
      'create_rollback',
      'replace_old_file',
      'delete_asset_file'
    )
  );

comment on constraint storage_cleanup_tasks_reason_check
  on public.storage_cleanup_tasks is
  'Allowed cleanup reasons for public-media object cleanup retries.';
