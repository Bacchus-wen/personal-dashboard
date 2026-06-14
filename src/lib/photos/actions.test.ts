import { describe, expect, it, vi } from "vitest";

import { AdminAccessError } from "../auth/guard";
import {
  createPhotoActionService,
  getPhotoMutationRevalidationPaths,
} from "./actions";
import type { PhotoRepository } from "./repository";
import type { Photo, StorageCleanupTask } from "./types";

const photo: Photo = {
  id: "photo-id",
  storagePath: "album/photo-id/file-id.webp",
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
  objectPath: "album/photo-id/old-id.webp",
  reason: "replace_old_file",
  lastError: "Storage operation failed.",
  createdAt: "2026-06-14T00:00:00.000Z",
  updatedAt: "2026-06-14T00:00:00.000Z",
};

function dependencies() {
  const repository = {
    updateMetadata: vi.fn().mockResolvedValue(photo),
    moveToTrash: vi.fn().mockResolvedValue(undefined),
    restore: vi.fn().mockResolvedValue(undefined),
    getById: vi.fn().mockResolvedValue(photo),
    getCleanupTask: vi.fn().mockResolvedValue(cleanupTask),
  } as unknown as PhotoRepository;
  const storage = {
    permanentlyDelete: vi.fn().mockResolvedValue(undefined),
    retryCleanup: vi.fn().mockResolvedValue(undefined),
  };
  return { repository, storage };
}

describe("createPhotoActionService", () => {
  const adminUserId = "admin-user-id";

  it("rejects non-admin metadata changes before repository calls", async () => {
    const { repository, storage } = dependencies();
    const service = createPhotoActionService({
      repository,
      storage,
      adminUserId,
    });

    await expect(
      service.update("other-user", photo.id, {
        visibility: "public",
        sortOrder: 1,
      }),
    ).rejects.toEqual(new AdminAccessError("FORBIDDEN"));
    expect(repository.updateMetadata).not.toHaveBeenCalled();
  });

  it("returns field errors without writing invalid metadata", async () => {
    const { repository, storage } = dependencies();
    const service = createPhotoActionService({
      repository,
      storage,
      adminUserId,
    });

    const result = await service.update(adminUserId, photo.id, {
      visibility: "other",
      sortOrder: -1,
    });

    expect(result).toMatchObject({ ok: false });
    expect(result.fieldErrors?.visibility).toBeDefined();
    expect(result.fieldErrors?.sortOrder).toBeDefined();
    expect(repository.updateMetadata).not.toHaveBeenCalled();
  });

  it("updates valid metadata and runs trash and restore operations", async () => {
    const { repository, storage } = dependencies();
    const service = createPhotoActionService({
      repository,
      storage,
      adminUserId,
    });

    await service.update(adminUserId, photo.id, {
      visibility: "public",
      sortOrder: "3",
    });
    await service.moveToTrash(adminUserId, photo.id);
    const restored = await service.restore(adminUserId, photo.id);

    expect(repository.updateMetadata).toHaveBeenCalledWith(photo.id, {
      visibility: "public",
      sortOrder: 3,
    });
    expect(repository.moveToTrash).toHaveBeenCalledWith(photo.id);
    expect(repository.restore).toHaveBeenCalledWith(photo.id);
    expect(restored).toMatchObject({ ok: true, photoId: photo.id });
  });

  it("permanently deletes only a found trashed photo", async () => {
    const { repository, storage } = dependencies();
    vi.mocked(repository.getById).mockResolvedValueOnce({
      ...photo,
      deletedAt: "2026-06-14T00:00:00.000Z",
    });
    const service = createPhotoActionService({
      repository,
      storage,
      adminUserId,
    });

    await service.permanentlyDelete(adminUserId, photo.id);

    expect(repository.getById).toHaveBeenCalledWith(photo.id, true);
    expect(storage.permanentlyDelete).toHaveBeenCalledWith(
      expect.objectContaining({ id: photo.id }),
    );
  });

  it("returns safe failures for missing photos and cleanup tasks", async () => {
    const { repository, storage } = dependencies();
    vi.mocked(repository.getById).mockResolvedValueOnce(null);
    vi.mocked(repository.getCleanupTask).mockResolvedValueOnce(null);
    const service = createPhotoActionService({
      repository,
      storage,
      adminUserId,
    });

    const deleted = await service.permanentlyDelete(adminUserId, photo.id);
    const retried = await service.retryCleanup(adminUserId, cleanupTask.id);

    expect(deleted).toMatchObject({ ok: false });
    expect(retried).toMatchObject({ ok: false });
    expect(storage.permanentlyDelete).not.toHaveBeenCalled();
    expect(storage.retryCleanup).not.toHaveBeenCalled();
  });

  it("retries a found cleanup task", async () => {
    const { repository, storage } = dependencies();
    const service = createPhotoActionService({
      repository,
      storage,
      adminUserId,
    });

    await service.retryCleanup(adminUserId, cleanupTask.id);

    expect(storage.retryCleanup).toHaveBeenCalledWith(cleanupTask);
  });
});

describe("getPhotoMutationRevalidationPaths", () => {
  it("returns all affected public and administrator paths", () => {
    expect(getPhotoMutationRevalidationPaths()).toEqual([
      "/",
      "/album",
      "/admin/photos",
      "/admin/photos/trash",
      "/admin/photos/cleanup",
    ]);
  });
});
