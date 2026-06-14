# Public Album And Storage Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build secure administrator-managed public photo storage, replace the demo album with a real accessible polaroid stack, and connect real public photos to the homepage album module.

**Architecture:** Keep photos as a focused server-only domain following the existing repository and protected-action patterns. Binary uploads and replacements use protected Route Handlers because they receive processed WebP files; metadata, lifecycle, trash, cleanup retries, and public reads remain in focused domain services and server repositories. The browser performs image decoding, resizing, WebP encoding, and per-file queue management, while the server revalidates administrator identity, request size, WebP bytes, generated paths, and Storage/database consistency.

**Tech Stack:** Next.js 16 App Router and Route Handlers, React 19, TypeScript, Supabase Auth/PostgreSQL/Storage, browser Canvas APIs, Vitest, existing CSS design tokens and administrator patterns.

---

## File Structure

**Create**

- `supabase/migrations/202606140002_public_album_storage.sql`: photo enum, `photos`, `storage_cleanup_tasks`, indexes, triggers, RLS, grants, `public-media` bucket, and Storage policy cleanup.
- `src/lib/auth/api-admin.ts`: non-redirecting administrator identity verification for JSON Route Handlers.
- `src/lib/auth/api-admin.test.ts`: API administrator authorization behavior.
- `src/lib/photos/constants.ts`: visibility values, labels, bucket name, upload limits, and group size.
- `src/lib/photos/types.ts`: photo, cleanup-task, input, action, public-result, and upload-result types.
- `src/lib/photos/validation.ts`: metadata validation, group normalization, WebP request validation, and safe filename normalization.
- `src/lib/photos/validation.test.ts`: metadata, group, filename, and WebP-header validation tests.
- `src/lib/photos/stack.ts`: deterministic polaroid transforms and group slicing.
- `src/lib/photos/stack.test.ts`: stable transform and grouping tests.
- `src/lib/photos/repository.ts`: database-neutral photo and cleanup-task repository.
- `src/lib/photos/repository.test.ts`: public/admin filtering, sorting, lifecycle, and cleanup-task behavior.
- `src/lib/photos/storage.ts`: database-neutral Storage lifecycle service.
- `src/lib/photos/storage.test.ts`: upload, replacement, deletion, rollback, and cleanup-task behavior.
- `src/lib/photos/server-repository.ts`: server-only Supabase database adapter.
- `src/lib/photos/server-storage.ts`: server-only Supabase Storage adapter and public URL builder.
- `src/lib/photos/upload-request.ts`: pure processed-WebP request parsing and validation.
- `src/lib/photos/upload-request.test.ts`: processed-file MIME, size, and WebP-byte validation.
- `src/lib/photos/actions.ts`: protected metadata, trash, restore, permanent-delete, and cleanup-retry services.
- `src/lib/photos/actions.test.ts`: permission and lifecycle action tests.
- `src/lib/photos/client-image.ts`: browser file validation, resize, and WebP encoding.
- `src/lib/photos/home-selection.ts`: random unique homepage photo selection.
- `src/lib/photos/home-selection.test.ts`: deterministic homepage selection tests.
- `src/app/api/admin/photos/upload/route.ts`: protected single-photo processed-WebP upload endpoint.
- `src/app/api/admin/photos/[id]/replace/route.ts`: protected processed-WebP replacement endpoint.
- `src/app/admin/(protected)/photos/actions.ts`: form-data Server Actions for status, sort, trash, restore, delete, and cleanup retry.
- `src/app/admin/(protected)/photos/page.tsx`: active photo grid and status filter.
- `src/app/admin/(protected)/photos/new/page.tsx`: batch-upload route.
- `src/app/admin/(protected)/photos/[id]/edit/page.tsx`: single-photo edit route.
- `src/app/admin/(protected)/photos/trash/page.tsx`: photo trash route.
- `src/app/admin/(protected)/photos/cleanup/page.tsx`: failed Storage cleanup tasks.
- `src/components/admin/photos/photo-upload-queue.tsx`: ten-file selection, two-worker processing/upload queue, progress, and retry.
- `src/components/admin/photos/photo-admin-card.tsx`: active photo card.
- `src/components/admin/photos/photo-editor.tsx`: photo preview, visibility, sort order, and replacement control.
- `src/components/admin/photos/photo-trash-card.tsx`: restore and permanent-delete controls.
- `src/components/admin/photos/cleanup-task-card.tsx`: manual Storage cleanup retry control.
- `src/components/photos/photo-image.tsx`: public/admin image with controlled failure fallback.
- `src/components/photos/public-album.tsx`: group navigation, stack state, and lightbox state.
- `src/components/photos/photo-lightbox.tsx`: accessible full-photo dialog.
- `src/components/home/home-album-preview.tsx`: real homepage polaroid preview, empty state, and image fallback.
- `docs/operations/public-album-storage.md`: SQL Editor migration, Storage permissions, CRUD, isolation, and cleanup verification.

**Modify**

- `src/app/admin/(protected)/page.tsx`: add photo management entry.
- `src/app/album/page.tsx`: server-load public photos and render real album states.
- `src/app/page.tsx`: load homepage public-photo candidates.
- `src/components/home/home-dashboard.tsx`: render real homepage album data instead of demo strips.
- `src/components/ui/album-stack.tsx`: remove the obsolete demo stack after the real public album is connected.
- `src/app/globals.css`: add public stack, lightbox, upload queue, photo admin grid, preview, failure, and responsive styles.
- `docs/PROJECT_STATUS.md`: record Flow 5A plan, implementation, migration, acceptance, and PR state.

## Task 1: Add The Database And Storage Migration

**Files:**
- Create: `supabase/migrations/202606140002_public_album_storage.sql`
- Create: `docs/operations/public-album-storage.md`

- [ ] **Step 1: Create the photo lifecycle enum and tables**

Create:

```sql
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
```

- [ ] **Step 2: Add indexes and updated-at triggers**

Add public/admin/trash/cleanup indexes:

```sql
create index photos_public_listing_idx
  on public.photos (visibility, deleted_at, sort_order, created_at desc);

create index photos_admin_listing_idx
  on public.photos (deleted_at, updated_at desc);

create index storage_cleanup_tasks_created_idx
  on public.storage_cleanup_tasks (created_at desc);
```

Add one `set_photo_storage_updated_at()` trigger function with `set search_path = ''`, then attach it to both tables.

- [ ] **Step 3: Enable server-only table access**

Apply:

```sql
alter table public.photos enable row level security;
alter table public.storage_cleanup_tasks enable row level security;

revoke all on table public.photos, public.storage_cleanup_tasks
  from anon, authenticated;

grant all on table public.photos, public.storage_cleanup_tasks
  to service_role;
```

Revoke trigger-function execution from `public`, `anon`, and `authenticated`; grant it only to `service_role`.

- [ ] **Step 4: Create the public bucket without browser write policies**

Add an idempotent bucket insert:

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
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
```

Do not create `insert`, `update`, or `delete` policies on `storage.objects` for `anon` or `authenticated`. Do not broadly revoke privileges on `storage.objects`, because Supabase owns that shared table and Storage API behavior.

- [ ] **Step 5: Write the operations guide**

Document exact SQL Editor checks:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('photos', 'storage_cleanup_tasks')
order by tablename;
```

```sql
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('photos', 'storage_cleanup_tasks')
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;
```

Also document bucket inspection, browser-role write rejection, administrator upload/replace/delete, public isolation, cleanup retry, and removal of all temporary records/files.

- [ ] **Step 6: Verify migration and docs formatting**

Run:

```powershell
git diff --check -- supabase/migrations/202606140002_public_album_storage.sql docs/operations/public-album-storage.md
```

Expected: no output.

- [ ] **Step 7: Commit**

```powershell
git add supabase/migrations/202606140002_public_album_storage.sql docs/operations/public-album-storage.md
git commit -m "feat: add public album storage schema"
```

## Task 2: Add Photo Types, Validation, And Stack Logic

**Files:**
- Create: `src/lib/photos/constants.ts`
- Create: `src/lib/photos/types.ts`
- Create: `src/lib/photos/validation.ts`
- Create: `src/lib/photos/validation.test.ts`
- Create: `src/lib/photos/stack.ts`
- Create: `src/lib/photos/stack.test.ts`

- [ ] **Step 1: Write failing validation and stack tests**

Cover:

```ts
expect(validatePhotoInput({ visibility: "public", sortOrder: "3" })).toEqual({
  ok: true,
  data: { visibility: "public", sortOrder: 3 },
  errors: {},
});

expect(validatePhotoInput({ visibility: "other", sortOrder: "-1" }).ok).toBe(false);
expect(normalizePhotoGroup("bad", 25)).toBe(1);
expect(normalizePhotoGroup("9", 25)).toBe(3);
expect(isWebpBytes(new Uint8Array([0x52,0x49,0x46,0x46,0,0,0,0,0x57,0x45,0x42,0x50]))).toBe(true);
expect(groupPhotos(photos, 2)).toEqual(photos.slice(12, 24));
expect(polaroidTransform("stable-id")).toEqual(polaroidTransform("stable-id"));
```

- [ ] **Step 2: Run the focused tests and verify failure**

Run:

```powershell
npx vitest run src/lib/photos/validation.test.ts src/lib/photos/stack.test.ts
```

Expected: FAIL because the photo modules do not exist.

- [ ] **Step 3: Define constants and types**

Use:

```ts
export const PHOTO_VISIBILITIES = ["draft", "public", "archived"] as const;
export const PHOTO_GROUP_SIZE = 12;
export const PHOTO_BATCH_LIMIT = 10;
export const PHOTO_UPLOAD_CONCURRENCY = 2;
export const PHOTO_MAX_BYTES = 10 * 1024 * 1024;
export const PHOTO_MAX_EDGE = 2560;
export const PHOTO_WEBP_QUALITY = 0.85;
export const PUBLIC_MEDIA_BUCKET = "public-media";
```

Define `Photo`, `PublicPhoto`, `PhotoInput`, `ValidPhotoInput`, `PhotoActionResult`, `StorageCleanupTask`, `PhotoUploadResult`, and `PublicAlbumResult`. `PublicPhoto` must contain only `id`, `publicUrl`, `sortOrder`, and `createdAt`; it must not contain `originalFilename`.

- [ ] **Step 4: Implement pure validation helpers**

Implement:

```ts
export function validatePhotoInput(input: PhotoInput): PhotoValidationResult;
export function normalizePhotoGroup(value: string | string[] | undefined, total: number): number;
export function safeOriginalFilename(value: string): string;
export function isWebpBytes(bytes: Uint8Array): boolean;
```

`isWebpBytes` must verify `RIFF` at bytes `0..3` and `WEBP` at bytes `8..11`. `safeOriginalFilename` trims, strips path separators/control characters, and limits output to 255 characters without exposing it publicly.

- [ ] **Step 5: Implement deterministic grouping and transforms**

Implement:

```ts
export function groupPhotos<T>(photos: T[], group: number): T[];
export function totalPhotoGroups(total: number): number;
export function polaroidTransform(id: string): {
  x: number;
  y: number;
  rotate: number;
};
```

Generate stable bounded values from a small string hash. Desktop bounds: `x` within `-96..96`, `y` within `-28..42`, rotation within `-10..10`. CSS will reduce these values on narrow screens.

- [ ] **Step 6: Run focused tests**

Run:

```powershell
npx vitest run src/lib/photos/validation.test.ts src/lib/photos/stack.test.ts
```

Expected: both files pass.

- [ ] **Step 7: Commit**

```powershell
git add src/lib/photos/constants.ts src/lib/photos/types.ts src/lib/photos/validation.ts src/lib/photos/validation.test.ts src/lib/photos/stack.ts src/lib/photos/stack.test.ts
git commit -m "feat: add photo domain rules"
```

## Task 3: Add Database Repository And Public Query Boundaries

**Files:**
- Create: `src/lib/photos/repository.ts`
- Create: `src/lib/photos/repository.test.ts`
- Create: `src/lib/photos/server-repository.ts`

- [ ] **Step 1: Write failing repository tests**

Test exact requests for:

- `listPublic()` filters `visibility = public` and `deleted_at is null`, then orders by `sort_order asc` and `created_at desc`;
- `listAdmin(visibility)` returns active records and optional visibility filter;
- `listTrash()` returns only deleted records;
- `getById()` returns active photo;
- `createDraft(id, storagePath, originalFilename)` always stores `draft`;
- `updateMetadata()` only changes `visibility` and `sort_order`;
- `replaceStoragePath()` changes path and original filename;
- `moveToTrash()` sets `deleted_at`;
- `restore()` clears `deleted_at` and sets `draft`;
- `deleteRecord()` deletes only a trashed photo;
- cleanup tasks can list, upsert by object path, and delete after success.

- [ ] **Step 2: Run the focused repository test**

Run:

```powershell
npx vitest run src/lib/photos/repository.test.ts
```

Expected: FAIL because repository modules do not exist.

- [ ] **Step 3: Define the database-neutral interfaces**

Define a `PhotoDatabaseClient` with `selectMany`, `selectOne`, `insert`, `update`, `delete`, and `upsert`. Keep requests limited to `"photos" | "storage_cleanup_tasks"` and pure filters/orders/values.

Define:

```ts
export type PhotoRepository = {
  listPublic(): Promise<PublicPhoto[]>;
  listAdmin(visibility: PhotoVisibility | null): Promise<Photo[]>;
  listTrash(): Promise<Photo[]>;
  getById(id: string, includeDeleted?: boolean): Promise<Photo | null>;
  createDraft(id: string, storagePath: string, originalFilename: string): Promise<Photo>;
  updateMetadata(id: string, input: ValidPhotoInput): Promise<Photo>;
  replaceStoragePath(id: string, storagePath: string, originalFilename: string): Promise<Photo>;
  moveToTrash(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  deleteRecord(id: string): Promise<void>;
  listCleanupTasks(): Promise<StorageCleanupTask[]>;
  saveCleanupTask(input: CleanupTaskInput): Promise<void>;
  deleteCleanupTask(id: string): Promise<void>;
};
```

- [ ] **Step 4: Keep original filenames out of public mapping**

Map database rows to `Photo` internally. Map public rows to `PublicPhoto` only after a public URL builder is supplied:

```ts
createPhotoRepository(client, publicUrlForPath)
```

The public result must never contain `storagePath` or `originalFilename`.

- [ ] **Step 5: Add the Supabase adapter**

Follow the existing `src/lib/collections/server-repository.ts` query-chain pattern. Use `createSupabaseAdminClient()` only in this server-only module.

- [ ] **Step 6: Run repository tests**

Run:

```powershell
npx vitest run src/lib/photos/repository.test.ts
```

Expected: pass.

- [ ] **Step 7: Commit**

```powershell
git add src/lib/photos/repository.ts src/lib/photos/repository.test.ts src/lib/photos/server-repository.ts
git commit -m "feat: add photo repositories"
```

## Task 4: Add Storage Lifecycle And Cleanup Tracking

**Files:**
- Create: `src/lib/photos/storage.ts`
- Create: `src/lib/photos/storage.test.ts`
- Create: `src/lib/photos/server-storage.ts`

- [ ] **Step 1: Write failing lifecycle tests**

Test these ordered effects:

```ts
// Create: upload -> create draft
expect(events).toEqual(["upload:new", "create:draft"]);

// Create rollback failure: upload -> create fails -> remove fails -> cleanup task
expect(events).toEqual(["upload:new", "create:draft", "remove:new", "cleanup:create_rollback"]);

// Replace: upload new -> update DB -> remove old
expect(events).toEqual(["upload:new", "replace:path", "remove:old"]);

// Permanent delete: remove current -> delete trashed record
expect(events).toEqual(["remove:current", "delete:record"]);
```

Also test that failed current-file deletion leaves the database record intact and does not create a cleanup task, because the record itself remains the retry handle.

- [ ] **Step 2: Run the focused lifecycle test**

Run:

```powershell
npx vitest run src/lib/photos/storage.test.ts
```

Expected: FAIL because lifecycle modules do not exist.

- [ ] **Step 3: Define Storage adapter and safe errors**

Define:

```ts
export type PhotoStorageClient = {
  upload(path: string, bytes: Uint8Array): Promise<void>;
  remove(path: string): Promise<void>;
  publicUrl(path: string): string;
};
```

Define safe reason constants `"create_rollback"` and `"replace_old_file"`. Convert unknown Storage errors into a generic administrator-safe summary of at most 320 characters; never persist stack traces, keys, request headers, or session data.

- [ ] **Step 4: Implement lifecycle service**

Implement:

```ts
createPhotoStorageService({ repository, storage })
```

Methods:

- `createPhoto(bytes, originalFilename)`;
- `replacePhoto(photo, bytes, originalFilename)`;
- `permanentlyDelete(photo)`;
- `retryCleanup(task)`.

Generate IDs and paths server-side using `crypto.randomUUID()`:

```ts
const photoId = crypto.randomUUID();
const objectPath = `album/${photoId}/${crypto.randomUUID()}.webp`;
```

- [ ] **Step 5: Add the Supabase Storage adapter**

Use:

```ts
client.storage.from(PUBLIC_MEDIA_BUCKET).upload(path, bytes, {
  contentType: "image/webp",
  upsert: false,
});
```

For removal, require Supabase to return no error. Build public URLs with `getPublicUrl(path).data.publicUrl`.

- [ ] **Step 6: Run lifecycle tests**

Run:

```powershell
npx vitest run src/lib/photos/storage.test.ts
```

Expected: pass.

- [ ] **Step 7: Commit**

```powershell
git add src/lib/photos/storage.ts src/lib/photos/storage.test.ts src/lib/photos/server-storage.ts
git commit -m "feat: add photo storage lifecycle"
```

## Task 5: Add API Administrator Guard And Binary Route Handlers

**Files:**
- Create: `src/lib/auth/api-admin.ts`
- Create: `src/lib/auth/api-admin.test.ts`
- Create: `src/lib/photos/upload-request.ts`
- Create: `src/lib/photos/upload-request.test.ts`
- Create: `src/app/api/admin/photos/upload/route.ts`
- Create: `src/app/api/admin/photos/[id]/replace/route.ts`

- [ ] **Step 1: Read the local Next.js Route Handler guide**

Read the relevant file under:

```text
node_modules/next/dist/docs/
```

Confirm current Next.js 16 conventions for `Request.formData()`, dynamic route `params`, and `NextResponse.json()` before implementing.

- [ ] **Step 2: Write failing API administrator guard tests**

Test:

- missing user returns `{ ok: false, status: 401 }`;
- wrong user returns `{ ok: false, status: 403 }`;
- configured administrator returns `{ ok: true, userId }`.

The helper must not call `redirect()`, because Route Handlers need JSON status responses.

- [ ] **Step 3: Implement the API guard**

Create a pure decision helper plus server wrapper:

```ts
export function decideApiAdmin(userId: string | null, adminUserId: string): ApiAdminDecision;
export async function requireApiAdmin(): Promise<ApiAdminDecision>;
```

The server wrapper uses `createSupabaseServerAuthClient().auth.getUser()` and `getAdminUserId()`.

- [ ] **Step 4: Run guard tests**

Run:

```powershell
npx vitest run src/lib/auth/api-admin.test.ts
```

Expected: pass.

- [ ] **Step 5: Implement and test pure processed-file parsing**

Create:

```ts
export async function parseProcessedPhotoFile(value: FormDataEntryValue | null):
  Promise<{ ok: true; file: File; bytes: Uint8Array; originalFilename: string } | { ok: false; message: string }>;
```

The helper must require a `File`, `image/webp`, `0 < size <= PHOTO_MAX_BYTES`, and a valid WebP header. It returns only safe validation messages.

Test invalid MIME, oversized files, empty files, false WebP headers, and a valid WebP `File`.

- [ ] **Step 6: Implement the two Route Handlers**

Both routes must:

1. call `requireApiAdmin()`;
2. reject unauthorized requests with JSON `401` or `403`;
3. read `request.formData()`;
4. pass `formData.get("file")` to `parseProcessedPhotoFile()`;
5. reject invalid processed files with JSON `400`;
6. call the server Storage lifecycle service;
7. return only safe `PhotoUploadResult` JSON.

The upload route uses `file.name` only as `originalFilename`. The replacement route also validates the route photo ID and returns `404` when no active photo exists.

- [ ] **Step 7: Add upload and replace tests at the service boundary**

Do not attempt real cloud calls in unit tests. Test the parsing helper with fake `File` objects and test lifecycle services separately. Confirm invalid processed files, unauthorized users, and missing photos do not call Storage.

- [ ] **Step 8: Run focused tests and type check**

Run:

```powershell
npx vitest run src/lib/auth/api-admin.test.ts src/lib/photos/upload-request.test.ts src/lib/photos/storage.test.ts
npx tsc --noEmit
```

Expected: pass.

- [ ] **Step 9: Commit**

```powershell
git add src/lib/auth/api-admin.ts src/lib/auth/api-admin.test.ts src/lib/photos/upload-request.ts src/lib/photos/upload-request.test.ts src/app/api/admin/photos/upload/route.ts src/app/api/admin/photos/[id]/replace/route.ts
git commit -m "feat: add protected photo upload routes"
```

## Task 6: Add Protected Photo Actions

**Files:**
- Create: `src/lib/photos/actions.ts`
- Create: `src/lib/photos/actions.test.ts`
- Create: `src/app/admin/(protected)/photos/actions.ts`

- [ ] **Step 1: Write failing action-service tests**

Test:

- non-admin metadata update is denied;
- invalid visibility or negative sort order does not call repository;
- valid update calls `updateMetadata`;
- trash calls `moveToTrash`;
- restore calls `restore` and produces draft result;
- permanent delete loads a trashed photo and calls Storage lifecycle deletion;
- cleanup retry loads a cleanup task and calls lifecycle retry;
- missing photo/task returns a safe failure result.

- [ ] **Step 2: Run focused action tests**

Run:

```powershell
npx vitest run src/lib/photos/actions.test.ts
```

Expected: FAIL because the service does not exist.

- [ ] **Step 3: Implement protected service**

Follow `runProtectedAdminOperation` and return `PhotoActionResult`. Expose:

```ts
update(userId, id, input)
moveToTrash(userId, id)
restore(userId, id)
permanentlyDelete(userId, id)
retryCleanup(userId, taskId)
```

Return generic safe errors. Revalidation paths:

```ts
["/", "/album", "/admin/photos", "/admin/photos/trash", "/admin/photos/cleanup"]
```

- [ ] **Step 4: Implement form-data Server Actions**

Follow the existing admin action modules:

- call `requireAdmin()`;
- parse `visibility` and `sortOrder`;
- invoke the photo action service;
- revalidate paths only on success.

- [ ] **Step 5: Run action tests**

Run:

```powershell
npx vitest run src/lib/photos/actions.test.ts
```

Expected: pass.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/photos/actions.ts src/lib/photos/actions.test.ts "src/app/admin/(protected)/photos/actions.ts"
git commit -m "feat: add protected photo actions"
```

## Task 7: Add Browser Image Processing And Batch Upload Queue

**Files:**
- Create: `src/lib/photos/client-image.ts`
- Create: `src/components/admin/photos/photo-upload-queue.tsx`
- Create: `src/app/admin/(protected)/photos/new/page.tsx`

- [ ] **Step 1: Implement client-side file validation**

Before decoding, reject:

- more than ten selected files;
- unsupported input MIME outside JPEG, PNG, WebP;
- empty files;
- files above 10 MB.

Return per-file errors rather than throwing for the whole selection.

- [ ] **Step 2: Implement Canvas processing**

Implement:

```ts
export async function processPhotoFile(file: File): Promise<File>
```

Use `createImageBitmap(file)`, calculate a scale not exceeding `PHOTO_MAX_EDGE`, draw to a canvas preserving alpha, call `canvas.toBlob(..., "image/webp", PHOTO_WEBP_QUALITY)`, close the bitmap, and return a new `.webp` `File`.

If decoding or encoding fails, reject only that file. Do not upload the original.

- [ ] **Step 3: Implement the two-worker queue**

`PhotoUploadQueue` must:

- accept at most ten files;
- represent each item as `queued | processing | uploading | success | error`;
- process at most two items concurrently;
- POST one processed file at a time to `/api/admin/photos/upload`;
- preserve successful items;
- expose retry only for failed items;
- provide a link back to `/admin/photos`.

Do not put multiple binary files in one request.

- [ ] **Step 4: Add the protected upload page**

The server page remains declarative and renders:

```tsx
<PhotoUploadQueue />
```

The protected layout already performs page-level administrator verification.

- [ ] **Step 5: Run lint and type checks**

Run:

```powershell
npm run lint
npx tsc --noEmit
```

Expected: pass.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/photos/client-image.ts src/components/admin/photos/photo-upload-queue.tsx "src/app/admin/(protected)/photos/new/page.tsx"
git commit -m "feat: add photo batch upload queue"
```

## Task 8: Add Photo Administration Pages

**Files:**
- Create: `src/components/admin/photos/photo-admin-card.tsx`
- Create: `src/components/admin/photos/photo-editor.tsx`
- Create: `src/components/admin/photos/photo-trash-card.tsx`
- Create: `src/components/admin/photos/cleanup-task-card.tsx`
- Create: `src/components/photos/photo-image.tsx`
- Create: `src/app/admin/(protected)/photos/page.tsx`
- Create: `src/app/admin/(protected)/photos/[id]/edit/page.tsx`
- Create: `src/app/admin/(protected)/photos/trash/page.tsx`
- Create: `src/app/admin/(protected)/photos/cleanup/page.tsx`
- Modify: `src/app/admin/(protected)/page.tsx`

- [ ] **Step 1: Add resilient photo image**

Create `PhotoImage` with:

- required `src`;
- safe `alt`;
- `onError` fallback state;
- no original filename on public variants;
- optional admin filename only when explicitly passed.

Use a plain `<img>` with a narrow eslint suppression because Supabase public URLs are runtime-configured.

- [ ] **Step 2: Add the active photo grid**

`/admin/photos` loads `listAdmin()` and supports one `visibility` query parameter. Render grid cards with image, original filename, visibility, sort order, edit link, and move-to-trash action. Add links to upload, trash, and cleanup pages.

- [ ] **Step 3: Add the photo editor and replacement control**

The editor shows:

- full photo preview;
- polaroid preview;
- original filename;
- visibility select;
- non-negative sort order;
- save metadata button;
- one-file replacement picker.

Replacement uses `processPhotoFile()` then POSTs to `/api/admin/photos/{id}/replace`. On success, refresh the route; on failure, show the safe returned message.

- [ ] **Step 4: Add trash and cleanup pages**

Trash cards restore or permanently delete one photo. Cleanup cards show safe object path, reason, last error, created time, and retry button.

- [ ] **Step 5: Add the admin dashboard entry**

Add a photo-management card linking to `/admin/photos`. Do not add Flow 5B upload entries.

- [ ] **Step 6: Run focused verification**

Run:

```powershell
npm run lint
npx tsc --noEmit
```

Expected: pass.

- [ ] **Step 7: Commit**

```powershell
git add src/components/admin/photos src/components/photos/photo-image.tsx "src/app/admin/(protected)/photos" "src/app/admin/(protected)/page.tsx"
git commit -m "feat: add photo admin workspace"
```

## Task 9: Replace The Demo Album With The Public Polaroid Stack

**Files:**
- Create: `src/components/photos/public-album.tsx`
- Create: `src/components/photos/photo-lightbox.tsx`
- Modify: `src/app/album/page.tsx`
- Modify: `src/components/ui/album-stack.tsx`

- [ ] **Step 1: Make the album route server-backed**

Load all public photos through `getPhotoRepository().listPublic()`. Catch failures and pass a controlled error state. Normalize `searchParams.group` with `normalizePhotoGroup`.

The page must not receive or expose original filenames or Storage paths.

- [ ] **Step 2: Implement the interactive stack**

`PublicAlbum` receives all `PublicPhoto[]` and current group. It:

- renders at most twelve current-group photos;
- initializes the first group photo on top;
- uses `polaroidTransform(photo.id)`;
- raises a non-top card on click/Enter/Space;
- opens the top card in the lightbox on the next activation;
- navigates groups by updating `?group=N`;
- displays controlled empty and error states.

- [ ] **Step 3: Implement accessible lightbox**

`PhotoLightbox` must:

- use a dialog element or equivalent `role="dialog"` and `aria-modal="true"`;
- show the full image;
- browse the complete public photo list;
- close by button, backdrop, or `Escape`;
- navigate by buttons or left/right arrow keys;
- focus the close button on open;
- restore focus to the triggering card on close.

- [ ] **Step 4: Remove demo behavior**

Delete the old blank-card logic from `src/components/ui/album-stack.tsx`. If no other code imports it after the new album is connected, delete the file rather than retaining an unused demo component.

- [ ] **Step 5: Run focused verification**

Run:

```powershell
npx vitest run src/lib/photos/stack.test.ts src/lib/photos/repository.test.ts
npm run lint
npx tsc --noEmit
```

Expected: pass.

- [ ] **Step 6: Commit**

```powershell
git add src/components/photos/public-album.tsx src/components/photos/photo-lightbox.tsx src/app/album/page.tsx src/components/ui/album-stack.tsx
git commit -m "feat: add real public polaroid album"
```

If `album-stack.tsx` was deleted, stage the deletion with the same commit.

## Task 10: Connect Real Photos To The Homepage

**Files:**
- Create: `src/lib/photos/home-selection.ts`
- Create: `src/lib/photos/home-selection.test.ts`
- Create: `src/components/home/home-album-preview.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/components/home/home-dashboard.tsx`

- [ ] **Step 1: Add homepage candidate selection**

Add a pure focused helper:

```ts
export function pickRandomHomePhotos(photos: PublicPhoto[], limit = 3): PublicPhoto[];
```

Test that it returns no more than three unique public photos and does not mutate input. Inject randomness in tests instead of relying on `Math.random()` directly.

- [ ] **Step 2: Load photos independently**

In `src/app/page.tsx`, add:

```ts
async function loadHomePhotos() {
  try {
    return pickRandomHomePhotos(await getPhotoRepository().listPublic(), 3);
  } catch {
    return null;
  }
}
```

Load it in the existing `Promise.all`. `null` means controlled query failure; `[]` means valid empty state.

- [ ] **Step 3: Render the real homepage preview**

`HomeAlbumPreview` renders:

- up to three real polaroid images;
- a restrained empty state for `[]`;
- a controlled unavailable state for `null`;
- one link to `/album`;
- no demo blank strips and no original filenames.

- [ ] **Step 4: Run focused verification**

Run:

```powershell
npx vitest run src/lib/photos/home-selection.test.ts src/lib/photos/repository.test.ts
npm run lint
npx tsc --noEmit
```

Expected: pass.

- [ ] **Step 5: Commit**

```powershell
git add src/components/home/home-album-preview.tsx src/app/page.tsx src/components/home/home-dashboard.tsx src/lib/photos/home-selection.ts src/lib/photos/home-selection.test.ts
git commit -m "feat: connect real homepage album photos"
```

## Task 11: Add Album, Admin, Upload, And Lightbox Styles

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add public stack and lightbox styles**

Add focused classes:

```text
public-album
public-album-stage
public-polaroid
public-album-controls
photo-lightbox
photo-lightbox-panel
photo-lightbox-controls
photo-fallback
```

Use existing tokens, `.glass`, `.card`, `.btn`, and focus-visible conventions. Keep all cards inside the page width.

- [ ] **Step 2: Add admin and upload queue styles**

Add:

```text
photo-admin-grid
photo-admin-card
photo-upload-queue
photo-upload-item
photo-upload-progress
photo-editor-preview
cleanup-task-grid
```

Use three columns on desktop, two on tablet, and one on mobile. Do not add a new design token unless an existing token cannot express the state.

- [ ] **Step 3: Add motion and responsive behavior**

Desktop transforms use CSS variables from `polaroidTransform`. At `max-width: 720px`, reduce translation and rotation with `calc()` multipliers, keep controls visible, and prohibit page-level horizontal scrolling.

Respect `prefers-reduced-motion`: group changes and lightbox transitions become effectively immediate.

- [ ] **Step 4: Run lint and type checks**

Run:

```powershell
npm run lint
npx tsc --noEmit
git diff --check -- src/app/globals.css
```

Expected: pass and no diff-check output.

- [ ] **Step 5: Commit**

```powershell
git add src/app/globals.css
git commit -m "style: add public album and photo admin layouts"
```

## Task 12: Document Operations And Update Project Status

**Files:**
- Modify: `docs/operations/public-album-storage.md`
- Modify: `docs/PROJECT_STATUS.md`

- [ ] **Step 1: Complete cloud acceptance instructions**

Ensure the operations guide includes:

- apply migration in SQL Editor;
- verify two tables and RLS;
- verify browser-role table grants return no rows;
- verify `public-media` is public and allows only WebP up to 10 MB;
- verify direct browser-role Storage writes fail;
- verify administrator upload, replacement, state changes, trash, restore, and permanent delete;
- verify cleanup task manual retry;
- verify draft/archived/trash public isolation;
- remove all temporary photos and objects.

- [ ] **Step 2: Update status without claiming unverified cloud results**

Record:

- PR #4 merged as `1e1572c`;
- active Flow 5A worktree and branch;
- approved spec and plan references;
- local implementation state;
- migration and external-browser acceptance still pending until actually completed.

- [ ] **Step 3: Verify docs**

Run:

```powershell
git diff --check -- docs/operations/public-album-storage.md docs/PROJECT_STATUS.md
```

Expected: no output.

- [ ] **Step 4: Commit**

```powershell
git add docs/operations/public-album-storage.md docs/PROJECT_STATUS.md
git commit -m "docs: add public album operations"
```

## Task 13: Run Final Local Verification

**Files:**
- Modify only confirmed defects discovered by verification.

- [ ] **Step 1: Run the complete test suite**

Run:

```powershell
npm test
```

Expected: all test files and tests pass.

- [ ] **Step 2: Run lint and type checks**

Run:

```powershell
npm run lint
npx tsc --noEmit
```

Expected: both exit successfully.

- [ ] **Step 3: Run the official Webpack production build**

Run once near completion:

```powershell
npm run build -- --webpack
```

Expected: production build succeeds. If `.next` returns the known Windows `EPERM`, report it and rerun only this build with narrow elevation; do not modify ACLs.

- [ ] **Step 4: Check the final diff**

Run:

```powershell
git diff --check
git status --short --branch
git diff --stat origin/main...HEAD
```

Expected: no diff-check output and no unintended files, logs, `.env.local`, caches, or secrets.

- [ ] **Step 5: Commit only confirmed verification fixes**

If verification revealed a defect, fix and commit only the involved files. Skip this step when no fix is needed.

## Task 14: Apply Migration And Complete External Acceptance

**Files:**
- Modify: `docs/PROJECT_STATUS.md`

- [ ] **Step 1: Apply the real cloud migration**

Use the real Supabase SQL Editor to execute:

```text
supabase/migrations/202606140002_public_album_storage.sql
```

Record only pass/fail. Do not paste project secrets, administrator IDs, session values, or `.env.local`.

- [ ] **Step 2: Verify real cloud security**

Follow `docs/operations/public-album-storage.md` and confirm:

- both tables have RLS enabled;
- browser roles have no direct table grants;
- public object reads work;
- direct browser-role uploads/replacements/deletes fail;
- unauthenticated Route Handler calls return JSON `401` and protected pages redirect to login.

- [ ] **Step 3: Verify administrator lifecycle**

Using temporary photos:

- upload multiple supported images;
- confirm oversized/unsupported files fail independently;
- publish, archive, trash, restore-to-draft, replace, and permanently delete;
- confirm failed cleanup tasks can be retried if a failure can be safely induced;
- confirm no temporary records or objects remain.

- [ ] **Step 4: Verify public and responsive behavior**

In an external browser, verify:

- only public active photos appear;
- groups contain at most twelve photos;
- raise/top-click/lightbox behavior;
- lightbox browses all public photos;
- keyboard focus, Enter, Space, arrows, backdrop, and Escape;
- homepage real-photo, empty, and controlled-error states;
- desktop, tablet, and approximately 320px widths;
- no page-level horizontal scrolling.

- [ ] **Step 5: Record only verified outcomes**

Update `docs/PROJECT_STATUS.md` with actual migration, security, CRUD, visual, and final verification results. Do not claim an item passed before it is observed.

- [ ] **Step 6: Commit acceptance status**

```powershell
git add docs/PROJECT_STATUS.md
git commit -m "docs: record public album acceptance"
```

## Task 15: Publish Flow 5A For Review

**Files:**
- Modify: `docs/PROJECT_STATUS.md`

- [ ] **Step 1: Reconfirm branch scope and clean status**

Run:

```powershell
git status --short --branch
git log --oneline origin/main..HEAD
git diff --check origin/main...HEAD
```

Expected: only Flow 5A commits and no uncommitted runtime files.

- [ ] **Step 2: Push the branch**

Run:

```powershell
git push -u origin codex/public-album-storage
```

- [ ] **Step 3: Create a ready-for-review Pull Request**

Use the connected GitHub application, target `main`, and include:

- secure public Storage and server-only photo domain;
- protected upload/replacement/lifecycle workflows;
- real public polaroid album and homepage photos;
- automated verification;
- real Supabase migration/security/CRUD/browser acceptance;
- note that no new dependency or mandatory Docker step was introduced.

- [ ] **Step 4: Update and push PR status**

Record the PR URL and state in `docs/PROJECT_STATUS.md`, commit, and push.

- [ ] **Step 5: Recheck PR mergeability and checks**

Confirm the latest PR head is mergeable and report any CI/check absence or failure explicitly.
