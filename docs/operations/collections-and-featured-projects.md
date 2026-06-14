# Collections And Featured Projects Operations

This guide covers the server-only collections and featured-projects data
introduced in flow 4. Never record or share Supabase keys, administrator IDs,
session values, or `.env.local` contents while following it.

## Apply The Migration

1. Open the real Supabase project Dashboard.
2. Open SQL Editor.
3. Run the complete contents of:
   `supabase/migrations/202606140001_collections_featured_projects.sql`.
4. Record only whether execution passed or failed. Do not paste private project
   values into project documentation.

This flow does not require Docker or Supabase CLI.

## Verify Tables And RLS

Run in SQL Editor:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('collections', 'featured_projects')
order by tablename;
```

Expected: both tables exist and `rowsecurity` is `true`.

Verify browser roles do not have table privileges:

```sql
select
  grantee,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('collections', 'featured_projects')
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;
```

Expected: no rows.

## Verify Server-Only CRUD

Use the protected administrator pages after the migration:

- `/admin/collections`
- `/admin/projects`

For each domain:

1. Create a clearly named temporary draft.
2. Reload the list and confirm the draft can be read.
3. Edit the draft and confirm the change persists.
4. Move it to trash.
5. Restore it and confirm visibility becomes `draft`.
6. Move it to trash again and permanently delete it.
7. Confirm no temporary verification records remain.

This verifies that the Next.js server Secret Key can perform required CRUD
without exposing the key to browser code.

## Verify Public Isolation

Create temporary draft, archived, public, and trashed records through the
protected administrator pages.

- Only complete `public` and non-trashed records may appear on `/collections`
  or `/projects`.
- Only complete `public`, non-trashed, and `featured` records may appear in the
  homepage recommendation candidate set.
- Draft, archived, and trashed records must remain absent from public pages.
- Public cards must open the original HTTPS website or GitHub repository in a
  new tab.

Delete all temporary verification records after testing.

## Normal Content Operations

Collections:

1. Create a draft with at least a title.
2. Add article/video type, source, summary, HTTPS external URL, optional cover,
   and tags.
3. Mark featured only when it should enter the homepage recommendation pool.
4. Set visibility to public only after required fields are complete.

Featured projects:

1. Create a draft with at least a name.
2. Add the HTTPS `github.com` repository URL, summary, recommendation, optional
   language, and tags.
3. When recording Stars, always provide both count and recorded date.
4. Mark featured only when it should enter the homepage recommendation pool.
5. Set visibility to public only after required fields are complete.

Restoring either domain from trash always changes visibility to `draft`.
