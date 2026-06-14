import { describe, expect, it, vi } from "vitest";

import type { PhotoRepository } from "./repository";
import {
  createPhotoStorageService,
  safeStorageError,
  type PhotoStorageClient,
} from "./storage";
import type { Photo, StorageCleanupTask } from "./types";

const photo: Photo = {
  id: "11111111-1111-4111-8111-111111111111",
  storagePath:
    "album/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.webp",
  originalFilename: "photo.jpg",
  visibility: "draft",
  sortOrder: 0,
  deletedAt: null,
  createdAt: "2026-06-14T00:00:00.000Z",
  updatedAt: "2026-06-14T00:00:00.000Z",
};

const cleanupTask: StorageCleanupTask = {
  id: "cleanup-id",
  bucketId: "public-media",
  objectPath: photo.storagePath,
  reason: "create_rollback",
  lastError: "Previous removal failed.",
  createdAt: "2026-06-14T00:00:00.000Z",
  updatedAt: "2026-06-14T00:00:00.000Z",
};

function dependencies(events: string[]) {
  const repository: PhotoRepository = {
    listPublic: vi.fn(),
    listAdmin: vi.fn(),
    listTrash: vi.fn(),
    getById: vi.fn(),
    createDraft: vi.fn(async () => {
      events.push("create:draft");
      return photo;
    }),
    updateMetadata: vi.fn(),
    replaceStoragePath: vi.fn(async () => {
      events.push("replace:path");
      return photo;
    }),
    moveToTrash: vi.fn(),
    restore: vi.fn(),
    deleteRecord: vi.fn(async () => {
      events.push("delete:record");
    }),
    listCleanupTasks: vi.fn(),
    getCleanupTask: vi.fn(),
    saveCleanupTask: vi.fn(async (input) => {
      events.push(`cleanup:${input.reason}`);
    }),
    deleteCleanupTask: vi.fn(async () => {
      events.push("cleanup:delete");
    }),
  };
  const storage: PhotoStorageClient = {
    upload: vi.fn(async () => {
      events.push("upload:new");
    }),
    remove: vi.fn(async (path) => {
      events.push(path === photo.storagePath ? "remove:current" : "remove:new");
    }),
    publicUrl: vi.fn((path) => `https://cdn.example/${path}`),
  };
  return { repository, storage };
}

describe("createPhotoStorageService", () => {
  it("uploads before creating a draft", async () => {
    const events: string[] = [];
    const service = createPhotoStorageService(dependencies(events));

    await service.createPhoto(new Uint8Array([1]), "photo.jpg");

    expect(events).toEqual(["upload:new", "create:draft"]);
  });

  it("tracks a failed create rollback without exposing unsafe errors", async () => {
    const events: string[] = [];
    const { repository, storage } = dependencies(events);
    vi.mocked(repository.createDraft).mockImplementationOnce(async () => {
      events.push("create:draft");
      throw new Error("database failed");
    });
    vi.mocked(storage.remove).mockImplementationOnce(async () => {
      events.push("remove:new");
      throw new Error("secret-key=do-not-persist");
    });
    const service = createPhotoStorageService({ repository, storage });

    await expect(
      service.createPhoto(new Uint8Array([1]), "photo.jpg"),
    ).rejects.toThrow("database failed");

    expect(events).toEqual([
      "upload:new",
      "create:draft",
      "remove:new",
      "cleanup:create_rollback",
    ]);
    expect(repository.saveCleanupTask).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: "create_rollback",
        lastError: "Storage operation failed.",
      }),
    );
  });

  it("updates the database before removing the replaced file", async () => {
    const events: string[] = [];
    const { repository, storage } = dependencies(events);
    vi.mocked(storage.remove).mockImplementationOnce(async () => {
      events.push("remove:old");
    });
    const service = createPhotoStorageService({ repository, storage });

    await service.replacePhoto(photo, new Uint8Array([1]), "new.jpg");

    expect(events).toEqual(["upload:new", "replace:path", "remove:old"]);
    expect(repository.replaceStoragePath).toHaveBeenCalledWith(
      photo.id,
      photo.storagePath,
      expect.stringMatching(/^album\/.+\.webp$/),
      "new.jpg",
    );
  });

  it("tracks a replaced old file when its removal fails", async () => {
    const events: string[] = [];
    const { repository, storage } = dependencies(events);
    vi.mocked(storage.remove).mockImplementationOnce(async () => {
      events.push("remove:old");
      throw new Error("request headers and tokens");
    });
    const service = createPhotoStorageService({ repository, storage });

    await service.replacePhoto(photo, new Uint8Array([1]), "new.jpg");

    expect(events).toEqual([
      "upload:new",
      "replace:path",
      "remove:old",
      "cleanup:replace_old_file",
    ]);
  });

  it("removes the current file before deleting a trashed record", async () => {
    const events: string[] = [];
    const service = createPhotoStorageService(dependencies(events));

    await service.permanentlyDelete({ ...photo, deletedAt: "2026-06-14" });

    expect(events).toEqual(["remove:current", "delete:record"]);
  });

  it("keeps the database record when current-file deletion fails", async () => {
    const events: string[] = [];
    const { repository, storage } = dependencies(events);
    vi.mocked(storage.remove).mockImplementationOnce(async () => {
      events.push("remove:current");
      throw new Error("remove failed");
    });
    const service = createPhotoStorageService({ repository, storage });

    await expect(
      service.permanentlyDelete({ ...photo, deletedAt: "2026-06-14" }),
    ).rejects.toThrow("remove failed");

    expect(events).toEqual(["remove:current"]);
    expect(repository.deleteRecord).not.toHaveBeenCalled();
    expect(repository.saveCleanupTask).not.toHaveBeenCalled();
  });

  it("removes cleanup objects before deleting their tasks", async () => {
    const events: string[] = [];
    const service = createPhotoStorageService(dependencies(events));

    await service.retryCleanup(cleanupTask);

    expect(events).toEqual(["remove:current", "cleanup:delete"]);
  });
});

describe("safeStorageError", () => {
  it("returns a bounded generic message", () => {
    expect(safeStorageError(new Error("secret-key=do-not-persist"))).toBe(
      "Storage operation failed.",
    );
    expect(safeStorageError("x".repeat(500)).length).toBeLessThanOrEqual(320);
  });
});
