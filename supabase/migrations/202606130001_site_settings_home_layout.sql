create table public.site_settings (
  singleton boolean primary key default true check (singleton),
  site_title text not null check (char_length(btrim(site_title)) between 1 and 80),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 60),
  status_text text not null default '' check (char_length(status_text) <= 120),
  site_description text not null default '' check (char_length(site_description) <= 300),
  avatar_path text not null default '/avatar.svg',
  favicon_path text not null default '/favicon.ico',
  filing_number text not null default '' check (char_length(filing_number) <= 80),
  filing_url text,
  module_visibility jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.social_links (
  id text primary key,
  platform text not null check (char_length(btrim(platform)) between 1 and 40),
  label text not null check (char_length(btrim(label)) between 1 and 60),
  href text not null check (href ~ '^(https://|mailto:)'),
  position integer not null check (position >= 0),
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create unique index social_links_position_unique
  on public.social_links (position);

create table public.home_layout (
  module_key text primary key,
  grid_x integer not null check (grid_x >= 0),
  grid_y integer not null check (grid_y >= 0),
  grid_width integer not null check (grid_width > 0),
  grid_height integer not null check (grid_height > 0),
  updated_at timestamptz not null default now()
);

create or replace function public.publish_site_configuration(
  settings jsonb,
  links jsonb,
  layout jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.site_settings (
    singleton,
    site_title,
    display_name,
    status_text,
    site_description,
    avatar_path,
    favicon_path,
    filing_number,
    filing_url,
    module_visibility,
    updated_at
  )
  values (
    true,
    settings->>'site_title',
    settings->>'display_name',
    coalesce(settings->>'status_text', ''),
    coalesce(settings->>'site_description', ''),
    settings->>'avatar_path',
    settings->>'favicon_path',
    coalesce(settings->>'filing_number', ''),
    nullif(settings->>'filing_url', ''),
    settings->'module_visibility',
    now()
  )
  on conflict (singleton) do update set
    site_title = excluded.site_title,
    display_name = excluded.display_name,
    status_text = excluded.status_text,
    site_description = excluded.site_description,
    avatar_path = excluded.avatar_path,
    favicon_path = excluded.favicon_path,
    filing_number = excluded.filing_number,
    filing_url = excluded.filing_url,
    module_visibility = excluded.module_visibility,
    updated_at = now();

  delete from public.social_links where true;
  insert into public.social_links (id, platform, label, href, position, enabled)
  select item.id, item.platform, item.label, item.href, item.position, item.enabled
  from jsonb_to_recordset(links) as item(
    id text,
    platform text,
    label text,
    href text,
    position integer,
    enabled boolean
  );

  delete from public.home_layout where true;
  insert into public.home_layout (
    module_key,
    grid_x,
    grid_y,
    grid_width,
    grid_height
  )
  select
    item.module_key,
    item.grid_x,
    item.grid_y,
    item.grid_width,
    item.grid_height
  from jsonb_to_recordset(layout) as item(
    module_key text,
    grid_x integer,
    grid_y integer,
    grid_width integer,
    grid_height integer
  );
end;
$$;

insert into public.site_settings (
  singleton,
  site_title,
  display_name,
  status_text,
  site_description,
  avatar_path,
  favicon_path,
  filing_number,
  filing_url,
  module_visibility
)
values (
  true,
  'Theodore · Personal Space',
  'Theodore',
  '正在记录生活',
  'Theodore 的个人博客、项目、阅读和生活记录。',
  '/avatar.svg',
  '/favicon.ico',
  '',
  null,
  '{
    "navigation": true,
    "welcome": true,
    "socials": true,
    "album": true,
    "clock": true,
    "calendar": true,
    "recentPlans": true,
    "recommendation": true,
    "music": true
  }'::jsonb
)
on conflict (singleton) do nothing;

insert into public.social_links (id, platform, label, href, position, enabled)
values
  ('github', 'github', 'GitHub', 'https://github.com/', 0, true),
  ('xiaohongshu', 'xiaohongshu', '小红书', 'https://www.xiaohongshu.com/', 1, true),
  ('bilibili', 'bilibili', 'Bilibili', 'https://www.bilibili.com/', 2, true),
  ('twitter', 'twitter', 'X / Twitter', 'https://x.com/', 3, true)
on conflict (id) do nothing;

insert into public.home_layout (
  module_key,
  grid_x,
  grid_y,
  grid_width,
  grid_height
)
values
  ('navigation', 0, 1, 2, 5),
  ('album', 2, 0, 7, 2),
  ('welcome', 2, 2, 7, 3),
  ('socials', 2, 5, 7, 1),
  ('recommendation', 2, 6, 4, 2),
  ('recentPlans', 6, 6, 3, 2),
  ('clock', 9, 0, 3, 2),
  ('calendar', 9, 2, 3, 3),
  ('music', 9, 5, 3, 1)
on conflict (module_key) do nothing;

alter table public.site_settings enable row level security;
alter table public.social_links enable row level security;
alter table public.home_layout enable row level security;

revoke all on table public.site_settings, public.social_links, public.home_layout
  from anon, authenticated;

grant all on table public.site_settings, public.social_links, public.home_layout
  to service_role;

revoke execute on function public.publish_site_configuration(jsonb, jsonb, jsonb)
  from public, anon, authenticated;

grant execute on function public.publish_site_configuration(jsonb, jsonb, jsonb)
  to service_role;

comment on table public.site_settings is
  'Server-only singleton containing published site settings.';

comment on table public.social_links is
  'Server-only ordered social links published on the homepage.';

comment on table public.home_layout is
  'Server-only fixed-size desktop homepage module positions.';
