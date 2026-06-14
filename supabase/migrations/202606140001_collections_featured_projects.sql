create type public.recommendation_visibility as enum (
  'draft',
  'public',
  'archived'
);

create type public.collection_content_type as enum (
  'article',
  'video'
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  content_type public.collection_content_type not null default 'article',
  source_name text check (source_name is null or char_length(source_name) <= 120),
  summary text check (summary is null or char_length(summary) <= 320),
  external_url text check (external_url is null or external_url ~ '^https://'),
  cover_path text check (
    cover_path is null
    or cover_path like '/%'
    or cover_path ~ '^https://'
  ),
  tags text[] not null default '{}',
  visibility public.recommendation_visibility not null default 'draft',
  featured boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    visibility <> 'public'
    or (
      nullif(btrim(summary), '') is not null
      and external_url is not null
    )
  )
);

create table public.featured_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  repository_url text check (
    repository_url is null
    or repository_url ~ '^https://github\.com/'
  ),
  summary text check (summary is null or char_length(summary) <= 320),
  recommendation text check (
    recommendation is null
    or char_length(recommendation) <= 320
  ),
  language text check (language is null or char_length(language) <= 60),
  tags text[] not null default '{}',
  star_count integer check (star_count is null or star_count >= 0),
  star_recorded_on date,
  visibility public.recommendation_visibility not null default 'draft',
  featured boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (star_count is null and star_recorded_on is null)
    or (star_count is not null and star_recorded_on is not null)
  ),
  check (
    visibility <> 'public'
    or (
      repository_url is not null
      and nullif(btrim(summary), '') is not null
      and nullif(btrim(recommendation), '') is not null
    )
  )
);

create index collections_public_listing_idx
  on public.collections (
    visibility,
    deleted_at,
    featured desc,
    sort_order,
    updated_at desc
  );

create index collections_admin_listing_idx
  on public.collections (deleted_at, updated_at desc);

create index featured_projects_public_listing_idx
  on public.featured_projects (
    visibility,
    deleted_at,
    featured desc,
    sort_order,
    updated_at desc
  );

create index featured_projects_admin_listing_idx
  on public.featured_projects (deleted_at, updated_at desc);

create or replace function public.set_recommendation_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_collections_updated_at
before update on public.collections
for each row execute function public.set_recommendation_updated_at();

create trigger set_featured_projects_updated_at
before update on public.featured_projects
for each row execute function public.set_recommendation_updated_at();

alter table public.collections enable row level security;
alter table public.featured_projects enable row level security;

revoke all on table public.collections, public.featured_projects
  from anon, authenticated;

grant all on table public.collections, public.featured_projects
  to service_role;

revoke execute on function public.set_recommendation_updated_at()
  from public, anon, authenticated;

grant execute on function public.set_recommendation_updated_at()
  to service_role;

comment on table public.collections is
  'Server-only external article and video collections. Public pages receive filtered records from Next.js.';

comment on table public.featured_projects is
  'Server-only manually maintained GitHub projects. Public pages receive filtered records from Next.js.';

comment on function public.set_recommendation_updated_at() is
  'Updates the timestamp for server-only collection and featured-project records.';
