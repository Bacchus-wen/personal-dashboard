import { describe, expect, it } from "vitest";

import {
  createPhotoRepository,
  type PhotoDatabaseClient,
  type PhotoDatabaseRequest,
} from "./repository";

const photoRow = {
  id: "photo-id",
  storage_path: "album/photo-id/file-id.webp",
  original_filename: "private-name.jpg",
  visibility: "public",
  sort_order: 2,
  deleted_at: null,
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-02T00:00:00.000Z",
};

const cleanupRow = {
  id: "cleanup-id",
  bucket_id: "public-media",
  object_path: "album/photo-id/old-file.webp",
  reason: "replace_old_file",
  last_error: "Unable to remove the old file.",
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-02T00:00:00.000Z",
};

function database() {
  const requests: PhotoDatabaseRequest[] = [];
  const client: PhotoDatabaseClient = {
    async selectMany(request) {
      requests.push(request);
      return {
        rows:
          request.table === "storage_cleanup_tasks" ? [cleanupRow] : [photoRow],
      };
    },
    async selectOne(request) {
      requests.push(request);
      return { row: photoRow };
    },
    async insert(request) {
      requests.push(request);
      return { row: photoRow };
    },
    async update(request) {
      requests.push(request);
      return request.returning ? { row: photoRow } : undefined;
    },
    async delete(request) {
      requests.push(request);
      return request.returning ? { row: photoRow } : undefined;
    },
    async upsert(request) {
      requests.push(request);
    },
  };
  return { client, requests };
}

describe("createPhotoRepository", () => {
  it("lists only active public photos without exposing filenames or paths", async () => {
    const { client, requests } = database();
    const repository = createPhotoRepository(
      client,
      (path) => `https://cdn.example/${path}`,
    );

    const photos = await repository.listPublic();

    expect(requests[0]).toMatchObject({
      table: "photos",
      filters: [
        { column: "visibility", operator: "eq", value: "public" },
        { column: "deleted_at", operator: "is", value: null },
      ],
      orders: [
        { column: "sort_order", ascending: true },
        { column: "created_at", ascending: false },
      ],
    });
    expect(photos).toEqual([
      {
        id: "photo-id",
        publicUrl: "https://cdn.example/album/photo-id/file-id.webp",
        sortOrder: 2,
        createdAt: "2026-06-01T00:00:00.000Z",
      },
    ]);
    expect(photos[0]).not.toHaveProperty("storagePath");
    expect(photos[0]).not.toHaveProperty("originalFilename");
  });

  it("separates active admin filters from trash", async () => {
    const { client, requests } = database();
    const repository = createPhotoRepository(client, String);

    await repository.listAdmin("archived");
    await repository.listTrash();

    expect(requests[0].filters).toEqual([
      { column: "deleted_at", operator: "is", value: null },
      { column: "visibility", operator: "eq", value: "archived" },
    ]);
    expect(requests[1].filters).toEqual([
      { column: "deleted_at", operator: "not_is", value: null },
    ]);
  });

  it("creates drafts and updates only approved metadata", async () => {
    const { client, requests } = database();
    const repository = createPhotoRepository(client, String);

    await repository.createDraft(
      "photo-id",
      "album/photo-id/file-id.webp",
      "trip.jpg",
    );
    await repository.updateMetadata("photo-id", {
      visibility: "archived",
      sortOrder: 8,
    });

    expect(requests[0]).toMatchObject({
      table: "photos",
      values: {
        id: "photo-id",
        storage_path: "album/photo-id/file-id.webp",
        original_filename: "trip.jpg",
        visibility: "draft",
      },
      returning: true,
    });
    expect(requests[1]).toMatchObject({
      table: "photos",
      values: { visibility: "archived", sort_order: 8 },
      returning: true,
    });
  });

  it("replaces storage paths and restores trash as draft", async () => {
    const { client, requests } = database();
    const repository = createPhotoRepository(client, String);

    await repository.replaceStoragePath(
      "photo-id",
      "album/photo-id/old-file.webp",
      "album/photo-id/new-file.webp",
      "new.jpg",
    );
    await repository.restore("photo-id");

    expect(requests[0].values).toEqual({
      storage_path: "album/photo-id/new-file.webp",
      original_filename: "new.jpg",
    });
    expect(requests[0].filters).toContainEqual({
      column: "storage_path",
      operator: "eq",
      value: "album/photo-id/old-file.webp",
    });
    expect(requests[1]).toMatchObject({
      filters: [
        { column: "id", operator: "eq", value: "photo-id" },
        { column: "deleted_at", operator: "not_is", value: null },
      ],
      values: { deleted_at: null, visibility: "draft" },
    });
  });

  it("moves active photos to trash and deletes only trashed records", async () => {
    const { client, requests } = database();
    const repository = createPhotoRepository(client, String);

    await repository.moveToTrash("photo-id");
    await repository.deleteRecord("photo-id");

    expect(requests[0].filters).toContainEqual({
      column: "deleted_at",
      operator: "is",
      value: null,
    });
    expect(requests[1].filters).toContainEqual({
      column: "deleted_at",
      operator: "not_is",
      value: null,
    });
    expect(requests[0].returning).toBe(true);
    expect(requests[1].returning).toBe(true);
  });

  it("rejects lifecycle mutations when no record matches", async () => {
    const { client } = database();
    client.update = async () => undefined;
    client.delete = async () => undefined;
    const repository = createPhotoRepository(client, String);

    await expect(repository.moveToTrash("missing")).rejects.toThrow();
    await expect(repository.restore("missing")).rejects.toThrow();
    await expect(repository.deleteRecord("missing")).rejects.toThrow();
  });

  it("lists, upserts, and deletes cleanup tasks", async () => {
    const { client, requests } = database();
    const repository = createPhotoRepository(client, String);

    const tasks = await repository.listCleanupTasks();
    await repository.saveCleanupTask({
      bucketId: "public-media",
      objectPath: "album/photo-id/old-file.webp",
      reason: "replace_old_file",
      lastError: "Unable to remove the old file.",
    });
    await repository.deleteCleanupTask("cleanup-id");

    expect(tasks[0]).toMatchObject({
      id: "cleanup-id",
      bucketId: "public-media",
      objectPath: "album/photo-id/old-file.webp",
      reason: "replace_old_file",
    });
    expect(requests[1]).toMatchObject({
      table: "storage_cleanup_tasks",
      conflictColumn: "object_path",
      values: {
        bucket_id: "public-media",
        object_path: "album/photo-id/old-file.webp",
        reason: "replace_old_file",
      },
    });
    expect(requests[2]).toMatchObject({
      table: "storage_cleanup_tasks",
      filters: [{ column: "id", operator: "eq", value: "cleanup-id" }],
    });
  });
});
