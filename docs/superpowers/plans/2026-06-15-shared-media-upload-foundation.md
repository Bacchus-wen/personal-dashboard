# Shared Media Upload Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Flow 5B-1: a protected, reusable media upload foundation for public images in `public-media`, with a test-only admin page and cleanup support.

**Architecture:** Reuse the Flow 5A Storage boundary and cleanup-task table, but extract generic media concepts into `src/lib/media/`. Browser code prepares image files and calls protected Route Handlers; server code validates administrator access, purpose/variant/path rules, file structure, and Supabase Storage writes. The admin test page verifies the foundation without connecting it to business forms yet.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase Auth/PostgreSQL/Storage, browser Canvas APIs, Vitest, existing CSS design tokens.

---

## File Map

- Create: `supabase/migrations/202606150001_media_upload_cleanup_reasons.sql`
  - Extends `storage_cleanup_tasks.reason` to allow `delete_asset_file`.
- Create: `src/lib/media/constants.ts`
  - Purpose, variant, MIME, size, bucket, and path constants.
- Create: `src/lib/media/types.ts`
  - Upload/delete result types, purpose/variant types, processed file types, cleanup reason types.
- Create: `src/lib/media/path.ts`
  - Pure path validation and server-side path generation.
- Create: `src/lib/media/path.test.ts`
  - Tests path generation and accepted/rejected system paths.
- Create: `src/lib/media/validation.ts`
  - Pure upload metadata validation and favicon/WebP structure validation.
- Create: `src/lib/media/validation.test.ts`
  - Tests purpose/variant matrix, file rules, favicon rules, and WebP byte validation.
- Create: `src/lib/media/storage.ts`
  - Generic Storage lifecycle helpers for upload, delete, and cleanup-task write.
- Create: `src/lib/media/storage.test.ts`
  - Tests upload/delete success, safe errors, and cleanup write on failed delete.
- Create: `src/lib/media/server-storage.ts`
  - Server-only Supabase Storage adapter and public URL helper.
- Create: `src/lib/media/client-image.ts`
  - Browser image validation, square avatar crop, WebP conversion, and favicon passthrough.
- Create: `src/lib/media/client-image.test.ts`
  - Tests pure filename/type helpers that do not require Canvas.
- Create: `src/components/admin/media/media-upload-field.tsx`
  - Reusable click/drag upload field with preview and path callback.
- Create: `src/app/api/admin/media/upload/route.ts`
  - Protected upload Route Handler.
- Create: `src/app/api/admin/media/delete/route.ts`
  - Protected delete Route Handler.
- Create: `src/app/admin/(protected)/media/test/page.tsx`
  - Admin-only test page for WebP and favicon upload/delete.
- Create: `docs/operations/media-upload.md`
  - SQL migration, cloud verification, test-page workflow, and cleanup verification.
- Modify: `docs/PROJECT_STATUS.md`
  - Records Flow 5B-1 plan and current state after implementation acceptance.
- Modify: `src/app/globals.css`
  - Adds admin media upload/test page styles.

## Task 1: Add Cleanup Reason Migration

**Files:**
- Create: `supabase/migrations/202606150001_media_upload_cleanup_reasons.sql`
- Modify later docs only after verification: `docs/operations/media-upload.md`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/202606150001_media_upload_cleanup_reasons.sql`:

```sql
alter table public.storage_cleanup_tasks
  drop constraint if exists storage_cleanup_tasks_reason_check;

alter table public.storage_cleanup_tasks
  add constraint storage_cleanup_tasks_reason_check
  check (
    reason in (
      'create_rollback',
      'replace_old_file',
      'delete_asset_file'
    )
  );

comment on constraint storage_cleanup_tasks_reason_check
  on public.storage_cleanup_tasks is
  'Allowed cleanup reasons for public-media object cleanup retries.';
```

- [ ] **Step 2: Verify migration formatting**

Run:

```powershell
git diff --check -- supabase/migrations/202606150001_media_upload_cleanup_reasons.sql
```

Expected: no output.

- [ ] **Step 3: Commit**

```powershell
git add supabase/migrations/202606150001_media_upload_cleanup_reasons.sql
git commit -m "feat: extend media cleanup reasons"
```

## Task 2: Add Media Constants, Types, And Path Rules

**Files:**
- Create: `src/lib/media/constants.ts`
- Create: `src/lib/media/types.ts`
- Create: `src/lib/media/path.ts`
- Create: `src/lib/media/path.test.ts`

- [ ] **Step 1: Write failing path tests**

Create `src/lib/media/path.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  buildMediaObjectPath,
  isSystemMediaPath,
  validateMediaTarget,
} from "./path";

describe("media path rules", () => {
  it("accepts the approved purpose and variant pairs", () => {
    expect(validateMediaTarget({ purpose: "site", variant: "avatar" })).toEqual({
      ok: true,
      data: { purpose: "site", variant: "avatar", ownerId: null },
    });
    expect(validateMediaTarget({ purpose: "works", variant: "cover", ownerId: "work-id" }).ok).toBe(true);
    expect(validateMediaTarget({ purpose: "collections", variant: "cover", ownerId: "collection-id" }).ok).toBe(true);
    expect(validateMediaTarget({ purpose: "projects", variant: "cover", ownerId: "project-id" }).ok).toBe(true);
    expect(validateMediaTarget({ purpose: "test", variant: "favicon" }).ok).toBe(true);
  });

  it("rejects invalid purpose, variant, and missing owner ids", () => {
    expect(validateMediaTarget({ purpose: "other", variant: "cover" }).ok).toBe(false);
    expect(validateMediaTarget({ purpose: "site", variant: "cover" }).ok).toBe(false);
    expect(validateMediaTarget({ purpose: "works", variant: "cover" }).ok).toBe(false);
  });

  it("generates paths without original filenames", () => {
    expect(
      buildMediaObjectPath({
        purpose: "works",
        variant: "screenshot",
        ownerId: "work-id",
        id: "00000000-0000-4000-8000-000000000001",
        extension: "webp",
      }),
    ).toBe("works/work-id/screenshots/00000000-0000-4000-8000-000000000001.webp");
  });

  it("recognizes only system-owned public-media paths", () => {
    expect(isSystemMediaPath("site/avatar/00000000-0000-4000-8000-000000000001.webp")).toBe(true);
    expect(isSystemMediaPath("https://example.com/image.webp")).toBe(false);
    expect(isSystemMediaPath("/avatar.svg")).toBe(false);
    expect(isSystemMediaPath("../secret.webp")).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
npm test -- src/lib/media/path.test.ts
```

Expected: FAIL because `src/lib/media/path.ts` does not exist.

- [ ] **Step 3: Implement constants and types**

Create `src/lib/media/constants.ts`:

```ts
export const MEDIA_PURPOSES = ["site", "works", "collections", "projects", "test"] as const;
export const MEDIA_VARIANTS = [
  "avatar",
  "favicon",
  "cover",
  "seo",
  "screenshot",
  "test",
] as const;

export const MEDIA_BUCKET = "public-media";
export const MEDIA_MAX_BYTES = 10 * 1024 * 1024;
export const MEDIA_MAX_EDGE = 2560;
export const MEDIA_WEBP_QUALITY = 0.85;
export const MEDIA_UPLOAD_CONCURRENCY = 2;
export const MEDIA_FAVICON_MIME_TYPES = ["image/x-icon", "image/vnd.microsoft.icon", "image/png", "image/svg+xml"] as const;
export const MEDIA_WEBP_MIME_TYPE = "image/webp";
```

Create `src/lib/media/types.ts`:

```ts
import type { MEDIA_PURPOSES, MEDIA_VARIANTS } from "./constants";

export type MediaPurpose = (typeof MEDIA_PURPOSES)[number];
export type MediaVariant = (typeof MEDIA_VARIANTS)[number];
export type MediaExtension = "webp" | "ico" | "png" | "svg";
export type MediaCleanupReason = "create_rollback" | "replace_old_file" | "delete_asset_file";

export type MediaTargetInput = {
  purpose: string;
  variant: string;
  ownerId?: string | null;
};

export type MediaTarget = {
  purpose: MediaPurpose;
  variant: MediaVariant;
  ownerId: string | null;
};

export type MediaUploadResult = {
  ok: boolean;
  message: string;
  path?: string;
  publicUrl?: string;
};

export type MediaDeleteResult = {
  ok: boolean;
  message: string;
};
```

- [ ] **Step 4: Implement path rules**

Create `src/lib/media/path.ts` with:

```ts
import type { MediaExtension, MediaTarget, MediaTargetInput } from "./types";

const UUID_PATTERN = "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const OWNER_PATTERN = "[A-Za-z0-9_-]+";

const SYSTEM_PATH_PATTERNS = [
  new RegExp(`^site/avatar/${UUID_PATTERN}\\.webp$`),
  new RegExp(`^site/favicon/${UUID_PATTERN}\\.(ico|png|svg)$`),
  new RegExp(`^works/${OWNER_PATTERN}/cover/${UUID_PATTERN}\\.webp$`),
  new RegExp(`^works/${OWNER_PATTERN}/seo/${UUID_PATTERN}\\.webp$`),
  new RegExp(`^works/${OWNER_PATTERN}/screenshots/${UUID_PATTERN}\\.webp$`),
  new RegExp(`^collections/${OWNER_PATTERN}/cover/${UUID_PATTERN}\\.webp$`),
  new RegExp(`^projects/${OWNER_PATTERN}/cover/${UUID_PATTERN}\\.webp$`),
  new RegExp(`^test/${UUID_PATTERN}\\.(webp|ico|png|svg)$`),
];

function cleanOwnerId(value: string | null | undefined) {
  const cleaned = value?.trim() ?? "";
  return /^[A-Za-z0-9_-]+$/.test(cleaned) ? cleaned : "";
}

export function validateMediaTarget(input: MediaTargetInput):
  | { ok: true; data: MediaTarget }
  | { ok: false; message: string } {
  const purpose = input.purpose;
  const variant = input.variant;
  const ownerId = cleanOwnerId(input.ownerId);

  if (purpose === "site" && (variant === "avatar" || variant === "favicon")) {
    return { ok: true, data: { purpose, variant, ownerId: null } };
  }
  if (purpose === "works" && ["cover", "seo", "screenshot"].includes(variant) && ownerId) {
    return { ok: true, data: { purpose, variant: variant as MediaTarget["variant"], ownerId } };
  }
  if ((purpose === "collections" || purpose === "projects") && variant === "cover" && ownerId) {
    return { ok: true, data: { purpose, variant, ownerId } };
  }
  if (purpose === "test" && (variant === "test" || variant === "favicon")) {
    return { ok: true, data: { purpose, variant, ownerId: null } };
  }
  return { ok: false, message: "Unsupported media upload target." };
}

export function buildMediaObjectPath({
  purpose,
  variant,
  ownerId,
  id,
  extension,
}: MediaTarget & { id: string; extension: MediaExtension }) {
  if (purpose === "site" && variant === "avatar") return `site/avatar/${id}.webp`;
  if (purpose === "site" && variant === "favicon") return `site/favicon/${id}.${extension}`;
  if (purpose === "works" && variant === "cover") return `works/${ownerId}/cover/${id}.webp`;
  if (purpose === "works" && variant === "seo") return `works/${ownerId}/seo/${id}.webp`;
  if (purpose === "works" && variant === "screenshot") return `works/${ownerId}/screenshots/${id}.webp`;
  if (purpose === "collections" && variant === "cover") return `collections/${ownerId}/cover/${id}.webp`;
  if (purpose === "projects" && variant === "cover") return `projects/${ownerId}/cover/${id}.webp`;
  return `test/${id}.${extension}`;
}

export function isSystemMediaPath(path: string) {
  return SYSTEM_PATH_PATTERNS.some((pattern) => pattern.test(path));
}
```

- [ ] **Step 5: Run focused tests**

Run:

```powershell
npm test -- src/lib/media/path.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/media/constants.ts src/lib/media/types.ts src/lib/media/path.ts src/lib/media/path.test.ts
git commit -m "feat: add media path rules"
```

## Task 3: Add Media Upload Validation

**Files:**
- Create: `src/lib/media/validation.ts`
- Create: `src/lib/media/validation.test.ts`

- [ ] **Step 1: Write failing validation tests**

Create `src/lib/media/validation.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  extensionForMediaFile,
  isAllowedFaviconFile,
  parseMediaUploadFile,
} from "./validation";

const webpBytes = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x12, 0x00, 0x00, 0x00,
  0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20,
  0x06, 0x00, 0x00, 0x00, 0x9d, 0x01, 0x2a, 0x01,
  0x00, 0x01, 0x00,
]);

describe("media upload validation", () => {
  it("accepts structurally valid WebP uploads", async () => {
    const file = new File([webpBytes], "photo.webp", { type: "image/webp" });
    const result = await parseMediaUploadFile(file, { favicon: false });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.extension).toBe("webp");
  });

  it("rejects empty files and wrong MIME for WebP uploads", async () => {
    await expect(parseMediaUploadFile(null, { favicon: false })).resolves.toMatchObject({ ok: false });
    await expect(parseMediaUploadFile(new File([], "empty.webp", { type: "image/webp" }), { favicon: false })).resolves.toMatchObject({ ok: false });
    await expect(parseMediaUploadFile(new File([webpBytes], "photo.png", { type: "image/png" }), { favicon: false })).resolves.toMatchObject({ ok: false });
  });

  it("accepts only favicon ICO PNG and SVG files", () => {
    expect(isAllowedFaviconFile(new File(["x"], "icon.ico", { type: "image/x-icon" }))).toBe(true);
    expect(isAllowedFaviconFile(new File(["x"], "icon.png", { type: "image/png" }))).toBe(true);
    expect(isAllowedFaviconFile(new File(["<svg />"], "icon.svg", { type: "image/svg+xml" }))).toBe(true);
    expect(isAllowedFaviconFile(new File(["x"], "icon.webp", { type: "image/webp" }))).toBe(false);
  });

  it("derives safe extensions from file type and name", () => {
    expect(extensionForMediaFile(new File(["x"], "favicon.ico", { type: "image/x-icon" }))).toBe("ico");
    expect(extensionForMediaFile(new File(["x"], "favicon.png", { type: "image/png" }))).toBe("png");
    expect(extensionForMediaFile(new File(["<svg />"], "favicon.svg", { type: "image/svg+xml" }))).toBe("svg");
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
npm test -- src/lib/media/validation.test.ts
```

Expected: FAIL because `src/lib/media/validation.ts` does not exist.

- [ ] **Step 3: Implement validation helpers**

Create `src/lib/media/validation.ts`. Reuse the structure of `src/lib/photos/validation.ts` and `src/lib/photos/upload-request.ts`; do not duplicate unsafe MIME-only WebP validation. Export:

```ts
export function isAllowedFaviconFile(file: File): boolean;
export function extensionForMediaFile(file: File): MediaExtension;
export async function parseMediaUploadFile(
  value: FormDataEntryValue | null,
  options: { favicon: boolean },
): Promise<
  | { ok: true; data: { file: File; bytes: Uint8Array; extension: MediaExtension } }
  | { ok: false; message: string }
>;
```

Rules:

- If `options.favicon` is `false`, require `image/webp` and valid WebP bytes.
- If `options.favicon` is `true`, allow ICO, PNG, or SVG by MIME and extension.
- Reject empty files.
- Reject files over `MEDIA_MAX_BYTES`.
- Return safe Chinese administrator messages.

- [ ] **Step 4: Run focused tests**

Run:

```powershell
npm test -- src/lib/media/validation.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/media/validation.ts src/lib/media/validation.test.ts
git commit -m "feat: add media upload validation"
```

## Task 4: Add Generic Media Storage Service

**Files:**
- Create: `src/lib/media/storage.ts`
- Create: `src/lib/media/storage.test.ts`
- Create: `src/lib/media/server-storage.ts`

- [ ] **Step 1: Write failing storage tests**

Create `src/lib/media/storage.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

import { createMediaStorageService, safeMediaStorageError } from "./storage";

function dependencies(events: string[] = []) {
  return {
    storage: {
      upload: vi.fn(async () => events.push("upload")),
      remove: vi.fn(async () => events.push("remove")),
      getPublicUrl: vi.fn((path: string) => `https://cdn.example/${path}`),
    },
    cleanup: {
      upsertCleanupTask: vi.fn(async (input) => events.push(`cleanup:${input.reason}`)),
    },
  };
}

describe("createMediaStorageService", () => {
  it("uploads bytes and returns path plus public url", async () => {
    const deps = dependencies();
    const service = createMediaStorageService(deps);

    await expect(
      service.upload({
        path: "test/00000000-0000-4000-8000-000000000001.webp",
        bytes: new Uint8Array([1]),
        contentType: "image/webp",
      }),
    ).resolves.toEqual({
      path: "test/00000000-0000-4000-8000-000000000001.webp",
      publicUrl: "https://cdn.example/test/00000000-0000-4000-8000-000000000001.webp",
    });
  });

  it("writes cleanup task when delete fails", async () => {
    const events: string[] = [];
    const deps = dependencies(events);
    deps.storage.remove.mockRejectedValueOnce(new Error("secret-key=hidden"));
    const service = createMediaStorageService(deps);

    await expect(
      service.deleteObject("test/00000000-0000-4000-8000-000000000001.webp", "delete_asset_file"),
    ).rejects.toThrow("Media object cleanup failed.");
    expect(events).toEqual(["cleanup:delete_asset_file"]);
  });
});

describe("safeMediaStorageError", () => {
  it("does not persist sensitive errors", () => {
    expect(safeMediaStorageError(new Error("secret-key=do-not-persist"))).toBe("Storage operation failed.");
    expect(safeMediaStorageError("x".repeat(500)).length).toBeLessThanOrEqual(320);
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
npm test -- src/lib/media/storage.test.ts
```

Expected: FAIL because `src/lib/media/storage.ts` does not exist.

- [ ] **Step 3: Implement service**

Create `src/lib/media/storage.ts` with:

```ts
import type { MediaCleanupReason } from "./types";

export type MediaStorageClient = {
  upload(path: string, bytes: Uint8Array, contentType: string): Promise<void>;
  remove(path: string): Promise<void>;
  getPublicUrl(path: string): string;
};

export type MediaCleanupClient = {
  upsertCleanupTask(input: {
    bucketId: "public-media";
    objectPath: string;
    reason: MediaCleanupReason;
    lastError: string;
  }): Promise<void>;
};

export function safeMediaStorageError(error: unknown) {
  if (typeof error === "string" && !/key|token|secret|session|authorization/i.test(error)) {
    return error.slice(0, 320);
  }
  return "Storage operation failed.";
}

export function createMediaStorageService({
  storage,
  cleanup,
}: {
  storage: MediaStorageClient;
  cleanup: MediaCleanupClient;
}) {
  return {
    async upload({ path, bytes, contentType }: { path: string; bytes: Uint8Array; contentType: string }) {
      await storage.upload(path, bytes, contentType);
      return { path, publicUrl: storage.getPublicUrl(path) };
    },

    async deleteObject(path: string, reason: MediaCleanupReason) {
      try {
        await storage.remove(path);
      } catch (error) {
        await cleanup.upsertCleanupTask({
          bucketId: "public-media",
          objectPath: path,
          reason,
          lastError: safeMediaStorageError(error),
        });
        throw new Error("Media object cleanup failed.");
      }
    },
  };
}
```

- [ ] **Step 4: Add server adapter**

Create `src/lib/media/server-storage.ts` using `getServerSupabaseClient()` and `MEDIA_BUCKET`. Follow `src/lib/photos/server-storage.ts`, but call the generic media service. Use existing photo repository cleanup-task write method if it can be reused without coupling, otherwise create a focused cleanup adapter in this file that writes to `storage_cleanup_tasks` with the server client.

- [ ] **Step 5: Run tests**

Run:

```powershell
npm test -- src/lib/media/storage.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/media/storage.ts src/lib/media/storage.test.ts src/lib/media/server-storage.ts
git commit -m "feat: add media storage service"
```

## Task 5: Add Protected Media Upload And Delete Routes

**Files:**
- Create: `src/app/api/admin/media/upload/route.ts`
- Create: `src/app/api/admin/media/delete/route.ts`
- Create: `src/lib/media/api.test.ts`

- [ ] **Step 1: Write focused API-boundary tests**

Create `src/lib/media/api.test.ts` for pure request helper functions if route testing is too coupled. At minimum cover:

```ts
import { describe, expect, it } from "vitest";

import { isSystemMediaPath } from "./path";
import { validateMediaTarget } from "./path";

describe("media API boundaries", () => {
  it("allows only configured upload targets", () => {
    expect(validateMediaTarget({ purpose: "site", variant: "avatar" }).ok).toBe(true);
    expect(validateMediaTarget({ purpose: "site", variant: "screenshot" }).ok).toBe(false);
  });

  it("allows delete only for generated system paths", () => {
    expect(isSystemMediaPath("test/00000000-0000-4000-8000-000000000001.webp")).toBe(true);
    expect(isSystemMediaPath("https://example.com/external.webp")).toBe(false);
  });
});
```

- [ ] **Step 2: Implement upload route**

Create `src/app/api/admin/media/upload/route.ts`:

- call `requireApiAdmin()`;
- read `formData`;
- validate `purpose`, `variant`, and `ownerId`;
- parse file with `parseMediaUploadFile(..., { favicon })`;
- create UUID via `crypto.randomUUID()`;
- build object path;
- upload with `getMediaStorageService()`;
- return `MediaUploadResult`;
- call `revalidatePath` for admin media test page only.

- [ ] **Step 3: Implement delete route**

Create `src/app/api/admin/media/delete/route.ts`:

- call `requireApiAdmin()`;
- parse JSON body `{ path }`;
- require `isSystemMediaPath(path)`;
- call `deleteObject(path, "delete_asset_file")`;
- return `MediaDeleteResult`;
- return safe `400`, `401`, `403`, or `500` responses.

- [ ] **Step 4: Run route-adjacent tests and type check**

Run:

```powershell
npm test -- src/lib/auth/api-admin.test.ts src/lib/media/api.test.ts src/lib/media/validation.test.ts src/lib/media/storage.test.ts
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/app/api/admin/media src/lib/media/api.test.ts
git commit -m "feat: add protected media upload routes"
```

## Task 6: Add Browser Media Processing And Upload Field

**Files:**
- Create: `src/lib/media/client-image.ts`
- Create: `src/lib/media/client-image.test.ts`
- Create: `src/components/admin/media/media-upload-field.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write failing client helper tests**

Create `src/lib/media/client-image.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { mediaWebpFilename, shouldPassThroughFavicon } from "./client-image";

describe("media client image helpers", () => {
  it("creates webp filenames without preserving unsafe extensions", () => {
    expect(mediaWebpFilename("My Photo.PNG")).toBe("My Photo.webp");
  });

  it("passes through supported favicon files", () => {
    expect(shouldPassThroughFavicon(new File(["x"], "icon.ico", { type: "image/x-icon" }))).toBe(true);
    expect(shouldPassThroughFavicon(new File(["x"], "icon.webp", { type: "image/webp" }))).toBe(false);
  });
});
```

- [ ] **Step 2: Implement client image helpers**

Create `src/lib/media/client-image.ts`:

- export `mediaWebpFilename(name: string)`;
- export `shouldPassThroughFavicon(file: File)`;
- export `processMediaFile(file, options)` that:
  - validates size and type;
  - passes through favicon ICO/PNG/SVG;
  - crops avatar square;
  - resizes other images to max edge 2560;
  - encodes WebP with quality 0.85;
  - rejects only the current file with safe messages.

- [ ] **Step 3: Create upload field component**

Create `src/components/admin/media/media-upload-field.tsx`:

- props: `label`, `value`, `purpose`, `variant`, `ownerId`, `preview`, `onUploaded`;
- render existing value/path input area supplied by parent in 5B-2 later;
- support click file input and drag/drop;
- call `/api/admin/media/upload`;
- show progress states;
- call `onUploaded({ path, publicUrl })` on success;
- never auto-save the entire business form.

- [ ] **Step 4: Add styles**

Add scoped classes in `src/app/globals.css`:

```css
.media-upload-field
.media-upload-dropzone
.media-upload-preview
.media-upload-status
.media-test-grid
```

Use existing glass/card/button tokens and keep 320px support.

- [ ] **Step 5: Run tests, lint, type check**

Run:

```powershell
npm test -- src/lib/media/client-image.test.ts
npm run lint
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/media/client-image.ts src/lib/media/client-image.test.ts src/components/admin/media/media-upload-field.tsx src/app/globals.css
git commit -m "feat: add media upload field"
```

## Task 7: Add Admin Media Test Page

**Files:**
- Create: `src/app/admin/(protected)/media/test/page.tsx`
- Modify: `src/app/admin/(protected)/page.tsx`
- Create: `docs/operations/media-upload.md`

- [ ] **Step 1: Add protected test page**

Create `src/app/admin/(protected)/media/test/page.tsx`:

- load only behind existing protected admin layout;
- render WebP upload test;
- render favicon upload test;
- show returned `path` and `publicUrl`;
- provide delete button that calls `/api/admin/media/delete`;
- link to `/admin/photos/cleanup` for cleanup-task inspection.

- [ ] **Step 2: Add admin entry**

Modify `src/app/admin/(protected)/page.tsx` to add a small admin card linking to `/admin/media/test`. Label it as internal media upload test, not public navigation.

- [ ] **Step 3: Add operations guide**

Create `docs/operations/media-upload.md` with:

- migration instructions;
- SQL verification for cleanup reason check constraint;
- bucket and browser-role write verification;
- admin test page steps;
- cleanup retry steps;
- warning not to share keys, session values, `.env.local`, or admin IDs.

- [ ] **Step 4: Run verification**

Run:

```powershell
npm run lint
npx tsc --noEmit
git diff --check
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add "src/app/admin/(protected)/media/test/page.tsx" "src/app/admin/(protected)/page.tsx" docs/operations/media-upload.md
git commit -m "feat: add media upload test page"
```

## Task 8: Local And Cloud Verification For 5B-1

**Files:**
- Modify: `docs/PROJECT_STATUS.md`
- Modify: `docs/operations/media-upload.md`

- [ ] **Step 1: Run full local verification**

Run sequentially:

```powershell
npm test
npm run lint
npx tsc --noEmit
npm run build -- --webpack
git diff --check
```

Expected: all pass. If `next dev` is needed for browser acceptance, use `npm run dev -- --webpack --port 3010` because Turbopack has previously failed on worktree `node_modules` symlinks.

- [ ] **Step 2: Apply cloud migration**

In Supabase SQL Editor, run:

```text
supabase/migrations/202606150001_media_upload_cleanup_reasons.sql
```

Do not paste keys, sessions, or `.env.local` contents into chat.

- [ ] **Step 3: Verify cleanup reason constraint**

Run in SQL Editor:

```sql
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.storage_cleanup_tasks'::regclass
  and conname = 'storage_cleanup_tasks_reason_check';
```

Expected: definition includes `create_rollback`, `replace_old_file`, and `delete_asset_file`.

- [ ] **Step 4: Verify browser role Storage writes remain blocked**

Use the existing Flow 5A Storage policy inspection query from `docs/operations/public-album-storage.md`. Expected: no policy permits `anon` or `authenticated` direct writes to `public-media`.

- [ ] **Step 5: External browser acceptance**

In an external browser:

- login as administrator;
- open `/admin/media/test`;
- upload a supported WebP test image;
- upload a favicon ICO/PNG/SVG;
- confirm returned path and preview;
- delete uploaded test objects;
- confirm invalid type, empty file, oversized file, and invalid target fail safely;
- confirm unauthenticated access redirects or returns `401`;
- confirm layout works at desktop, tablet, and approximately 320px.

- [ ] **Step 6: Update docs**

Update `docs/PROJECT_STATUS.md` and `docs/operations/media-upload.md` with only verified outcomes. Do not mark cloud or browser security complete until observed.

- [ ] **Step 7: Commit docs**

```powershell
git add docs/PROJECT_STATUS.md docs/operations/media-upload.md
git commit -m "docs: record media upload foundation verification"
```

## Task 9: Publish 5B-1 PR

**Files:**
- No source changes unless verification finds defects.

- [ ] **Step 1: Ensure worktree is clean and branch is correct**

Run:

```powershell
git status --short --branch
git branch --show-current
```

Expected: clean feature branch, not `main`.

- [ ] **Step 2: Push branch**

Use the project-local GitHub CLI path if `gh` is not in PATH:

```powershell
git push -u origin codex/shared-media-upload-foundation
```

- [ ] **Step 3: Create draft PR**

Use:

```powershell
& "F:\网站制作\.local-tools\github-cli\bin\gh.exe" pr create --draft --base main --head codex/shared-media-upload-foundation --title "[codex] Add shared media upload foundation" --body-file <body-file>
```

PR body must summarize changes and include verification commands.

- [ ] **Step 4: Update project status with PR URL**

Update `docs/PROJECT_STATUS.md`, commit, and push.

