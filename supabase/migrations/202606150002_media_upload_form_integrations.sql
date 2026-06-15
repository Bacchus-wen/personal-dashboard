alter table public.works
  drop constraint if exists works_cover_path_check;

alter table public.works
  drop constraint if exists works_seo_image_path_check;

alter table public.work_screenshots
  drop constraint if exists work_screenshots_image_path_check;

alter table public.collections
  drop constraint if exists collections_cover_path_check;

alter table public.works
  add constraint works_cover_path_check
  check (
    cover_path is null
    or cover_path like '/%'
    or cover_path ~ '^https://'
    or cover_path ~ '^works/[A-Za-z0-9_-]+/cover/[0-9a-f-]+\.webp$'
  );

alter table public.works
  add constraint works_seo_image_path_check
  check (
    seo_image_path is null
    or seo_image_path like '/%'
    or seo_image_path ~ '^https://'
    or seo_image_path ~ '^works/[A-Za-z0-9_-]+/seo/[0-9a-f-]+\.webp$'
  );

alter table public.work_screenshots
  add constraint work_screenshots_image_path_check
  check (
    image_path like '/%'
    or image_path ~ '^https://'
    or image_path ~ '^works/[A-Za-z0-9_-]+/screenshots/[0-9a-f-]+\.webp$'
  );

alter table public.collections
  add constraint collections_cover_path_check
  check (
    cover_path is null
    or cover_path like '/%'
    or cover_path ~ '^https://'
    or cover_path ~ '^collections/[A-Za-z0-9_-]+/cover/[0-9a-f-]+\.webp$'
  );

alter table public.featured_projects
  add column if not exists cover_path text;

alter table public.featured_projects
  drop constraint if exists featured_projects_cover_path_check;

alter table public.featured_projects
  add constraint featured_projects_cover_path_check
  check (
    cover_path is null
    or cover_path like '/%'
    or cover_path ~ '^https://'
    or cover_path ~ '^projects/[A-Za-z0-9_-]+/cover/[0-9a-f-]+\.webp$'
  );

comment on column public.featured_projects.cover_path is
  'Optional project-local, HTTPS, or generated public-media cover path.';

comment on constraint works_cover_path_check on public.works is
  'Allows project-local, HTTPS, or generated public-media work cover paths.';

comment on constraint works_seo_image_path_check on public.works is
  'Allows project-local, HTTPS, or generated public-media work SEO image paths.';

comment on constraint work_screenshots_image_path_check
  on public.work_screenshots is
  'Allows project-local, HTTPS, or generated public-media work screenshot paths.';

comment on constraint collections_cover_path_check on public.collections is
  'Allows project-local, HTTPS, or generated public-media collection cover paths.';

comment on constraint featured_projects_cover_path_check
  on public.featured_projects is
  'Allows project-local, HTTPS, or generated public-media project cover paths.';
