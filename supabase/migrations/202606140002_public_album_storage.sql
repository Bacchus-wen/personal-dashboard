create type public.photo_visibility as enum (
  'draft',
  'public',
  'archived'
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique check (
    storage_path ~ '^album/[0-9a-f-]+/[0-9a-f-]+\.webp$'
  ),
  original_filename text not null check (
    char_length(btrim(original_filename)) between 1 and 255
  ),
  visibility public.photo_visibility not null default 'draft',
  sort_order integer not null default 0 check (sort_order >= 0),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.storage_cleanup_tasks (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null default 'public-media'
    check (bucket_id = 'public-media'),
  object_path text not null unique check (
    object_path ~ '^album/[0-9a-f-]+/[0-9a-f-]+\.webp$'
  ),
  reason text not null check (
    reason in ('create_rollback', 'replace_old_file')
  ),
  last_error text check (
    last_error is null or char_length(last_error) <= 320
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index photos_public_listing_idx
  on public.photos (visibility, deleted_at, sort_order, created_at desc);

create index photos_admin_listing_idx
  on public.photos (deleted_at, updated_at desc);

create index storage_cleanup_tasks_created_idx
  on public.storage_cleanup_tasks (created_at desc);

create or replace function public.set_photo_storage_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_photos_updated_at
before update on public.photos
for each row execute function public.set_photo_storage_updated_at();

create trigger set_storage_cleanup_tasks_updated_at
before update on public.storage_cleanup_tasks
for each row execute function public.set_photo_storage_updated_at();

alter table public.photos enable row level security;
alter table public.storage_cleanup_tasks enable row level security;

revoke all on table public.photos, public.storage_cleanup_tasks
  from anon, authenticated;

grant all on table public.photos, public.storage_cleanup_tasks
  to service_role;

revoke execute on function public.set_photo_storage_updated_at()
  from public, anon, authenticated;

grant execute on function public.set_photo_storage_updated_at()
  to service_role;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'public-media',
  'public-media',
  true,
  10485760,
  array['image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

comment on table public.photos is
  'Server-only public album photo records. Public pages receive filtered records from Next.js.';

comment on table public.storage_cleanup_tasks is
  'Server-only manual retry queue for failed public-media object cleanup.';

comment on function public.set_photo_storage_updated_at() is
  'Updates timestamps for server-only photo and Storage cleanup records.';
