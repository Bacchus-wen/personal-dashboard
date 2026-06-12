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

revoke execute on function public.publish_site_configuration(jsonb, jsonb, jsonb)
  from public, anon, authenticated;

grant execute on function public.publish_site_configuration(jsonb, jsonb, jsonb)
  to service_role;
