create type public.work_status as enum (
  'developing',
  'maintained',
  'completed',
  'stopped'
);

create type public.work_visibility as enum (
  'draft',
  'private',
  'public',
  'archived'
);

create table public.works (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  slug text,
  summary text,
  description text,
  cover_path text,
  tech_stack text[] not null default '{}',
  status public.work_status not null default 'developing',
  visibility public.work_visibility not null default 'draft',
  started_on date,
  completed_on date,
  website_url text,
  github_url text,
  website_available boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  seo_title text,
  seo_description text,
  seo_image_path text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    slug is null
    or slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  check (
    cover_path is null
    or cover_path like '/%'
    or cover_path ~ '^https://'
  ),
  check (
    seo_image_path is null
    or seo_image_path like '/%'
    or seo_image_path ~ '^https://'
  ),
  check (website_url is null or website_url ~ '^https://'),
  check (github_url is null or github_url ~ '^https://'),
  check (
    completed_on is null
    or started_on is null
    or completed_on >= started_on
  ),
  check (
    visibility <> 'public'
    or (
      slug is not null
      and nullif(btrim(summary), '') is not null
      and nullif(btrim(description), '') is not null
      and website_url is not null
    )
  )
);

create unique index works_slug_ci_unique
  on public.works (lower(slug))
  where slug is not null;

create index works_public_listing_idx
  on public.works (visibility, deleted_at, sort_order, updated_at desc);

create index works_admin_listing_idx
  on public.works (deleted_at, updated_at desc);

create table public.work_screenshots (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  image_path text not null check (
    image_path like '/%'
    or image_path ~ '^https://'
  ),
  caption text,
  sort_order integer not null check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (work_id, sort_order)
);

create index work_screenshots_work_id_idx
  on public.work_screenshots (work_id, sort_order);

create or replace function public.set_works_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_works_updated_at
before update on public.works
for each row execute function public.set_works_updated_at();

create trigger set_work_screenshots_updated_at
before update on public.work_screenshots
for each row execute function public.set_works_updated_at();

create or replace function public.save_work_with_screenshots(
  work_id uuid,
  work_payload jsonb,
  screenshots_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_work_id uuid := coalesce(work_id, gen_random_uuid());
begin
  insert into public.works (
    id,
    name,
    slug,
    summary,
    description,
    cover_path,
    tech_stack,
    status,
    visibility,
    started_on,
    completed_on,
    website_url,
    github_url,
    website_available,
    featured,
    sort_order,
    seo_title,
    seo_description,
    seo_image_path
  )
  values (
    saved_work_id,
    work_payload->>'name',
    nullif(work_payload->>'slug', ''),
    nullif(work_payload->>'summary', ''),
    nullif(work_payload->>'description', ''),
    nullif(work_payload->>'cover_path', ''),
    coalesce(
      array(select jsonb_array_elements_text(work_payload->'tech_stack')),
      '{}'
    ),
    (work_payload->>'status')::public.work_status,
    (work_payload->>'visibility')::public.work_visibility,
    nullif(work_payload->>'started_on', '')::date,
    nullif(work_payload->>'completed_on', '')::date,
    nullif(work_payload->>'website_url', ''),
    nullif(work_payload->>'github_url', ''),
    coalesce((work_payload->>'website_available')::boolean, true),
    coalesce((work_payload->>'featured')::boolean, false),
    coalesce((work_payload->>'sort_order')::integer, 0),
    nullif(work_payload->>'seo_title', ''),
    nullif(work_payload->>'seo_description', ''),
    nullif(work_payload->>'seo_image_path', '')
  )
  on conflict (id) do update set
    name = excluded.name,
    slug = excluded.slug,
    summary = excluded.summary,
    description = excluded.description,
    cover_path = excluded.cover_path,
    tech_stack = excluded.tech_stack,
    status = excluded.status,
    visibility = excluded.visibility,
    started_on = excluded.started_on,
    completed_on = excluded.completed_on,
    website_url = excluded.website_url,
    github_url = excluded.github_url,
    website_available = excluded.website_available,
    featured = excluded.featured,
    sort_order = excluded.sort_order,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description,
    seo_image_path = excluded.seo_image_path,
    updated_at = now();

  delete from public.work_screenshots
  where public.work_screenshots.work_id = saved_work_id;

  insert into public.work_screenshots (
    work_id,
    image_path,
    caption,
    sort_order
  )
  select
    saved_work_id,
    item.image_path,
    nullif(item.caption, ''),
    item.sort_order
  from jsonb_to_recordset(coalesce(screenshots_payload, '[]'::jsonb)) as item(
    image_path text,
    caption text,
    sort_order integer
  );

  return saved_work_id;
end;
$$;

alter table public.works enable row level security;
alter table public.work_screenshots enable row level security;

revoke all on table public.works, public.work_screenshots
  from anon, authenticated;

grant all on table public.works, public.work_screenshots
  to service_role;

revoke execute on function public.set_works_updated_at()
  from public, anon, authenticated;

revoke execute on function public.save_work_with_screenshots(uuid, jsonb, jsonb)
  from public, anon, authenticated;

grant execute on function public.set_works_updated_at()
  to service_role;

grant execute on function public.save_work_with_screenshots(uuid, jsonb, jsonb)
  to service_role;

comment on table public.works is
  'Server-only portfolio works. Public pages receive filtered results from Next.js.';

comment on table public.work_screenshots is
  'Ordered screenshots for server-only portfolio works.';

comment on function public.save_work_with_screenshots(uuid, jsonb, jsonb) is
  'Atomically creates or updates one work and replaces its ordered screenshots.';
