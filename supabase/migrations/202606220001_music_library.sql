create table public.music_tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  audio_path text not null,
  cover_path text,
  is_active boolean not null default false,
  sort_order integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index music_tracks_single_active_idx
  on public.music_tracks (is_active)
  where is_active = true and deleted_at is null;

create index music_tracks_active_sort_idx
  on public.music_tracks (deleted_at, is_active desc, sort_order asc, created_at desc);

create or replace function public.set_music_tracks_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_music_tracks_updated_at
before update on public.music_tracks
for each row execute function public.set_music_tracks_updated_at();

alter table public.music_tracks enable row level security;

revoke all on table public.music_tracks from anon, authenticated;
grant all on table public.music_tracks to service_role;
revoke execute on function public.set_music_tracks_updated_at()
  from anon, authenticated;
grant execute on function public.set_music_tracks_updated_at()
  to service_role;

comment on table public.music_tracks is
  'Server-only homepage music library. Public reads are performed through server repositories.';

comment on function public.set_music_tracks_updated_at() is
  'Maintains updated_at for server-only homepage music tracks.';
