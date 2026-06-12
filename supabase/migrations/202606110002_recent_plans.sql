create type public.plan_status as enum (
  'not_started',
  'in_progress',
  'paused',
  'completed',
  'cancelled'
);

create type public.plan_visibility as enum (
  'draft',
  'private',
  'public'
);

create type public.plan_priority as enum (
  'high',
  'medium',
  'low'
);

create table public.plan_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index plan_categories_name_ci_unique
  on public.plan_categories (lower(btrim(name)));

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  title text,
  summary text,
  description text,
  status public.plan_status not null default 'not_started',
  visibility public.plan_visibility not null default 'draft',
  priority public.plan_priority not null default 'medium',
  progress integer not null default 0 check (progress between 0 and 100),
  deadline date,
  related_url text,
  category_id uuid references public.plan_categories(id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    visibility = 'draft'
    or (
      nullif(btrim(title), '') is not null
      and nullif(btrim(summary), '') is not null
    )
  ),
  check (
    (status = 'not_started' and progress = 0)
    or (status = 'in_progress' and progress between 1 and 99)
    or (status = 'completed' and progress = 100)
    or status in ('paused', 'cancelled')
  )
);

create index plans_public_listing_idx
  on public.plans (visibility, deleted_at, status, priority, deadline);

create index plans_updated_at_idx
  on public.plans (updated_at desc);

create index plans_category_id_idx
  on public.plans (category_id);

create or replace function public.set_recent_plans_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_plan_categories_updated_at
before update on public.plan_categories
for each row execute function public.set_recent_plans_updated_at();

create trigger set_plans_updated_at
before update on public.plans
for each row execute function public.set_recent_plans_updated_at();

alter table public.plan_categories enable row level security;
alter table public.plans enable row level security;

revoke all on table public.plan_categories, public.plans
  from anon, authenticated;

grant all on table public.plan_categories, public.plans
  to service_role;

revoke execute on function public.set_recent_plans_updated_at()
  from public, anon, authenticated;

grant execute on function public.set_recent_plans_updated_at()
  to service_role;

comment on table public.plan_categories is
  'Server-only categories used by the recent plans feature.';

comment on table public.plans is
  'Server-only recent plans. Public pages receive filtered results from Next.js.';
