import { describe, expect, it, vi } from "vitest";

import { AdminAccessError } from "../auth/guard";
import {
  createCollectionActionService,
  getCollectionMutationRevalidationPaths,
} from "./actions";
import type { Collection } from "./types";
import type { CollectionRepository } from "./repository";
import type { CollectionInput } from "./types";

function input(overrides: Partial<CollectionInput> = {}): CollectionInput {
  return {
    title: "Reliable AI Notes",
    contentType: "article",
    sourceName: "Example",
    summary: "Worth revisiting.",
    externalUrl: "https://example.com/article",
    coverPath: null,
    tags: ["AI"],
    visibility: "public",
    featured: true,
    sortOrder: 0,
    ...overrides,
  };
}

function repository() {
  return {
    getById: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue({ id: "collection-id" }),
    moveToTrash: vi.fn().mockResolvedValue(undefined),
    restore: vi.fn().mockResolvedValue(undefined),
    permanentlyDelete: vi.fn().mockResolvedValue(undefined),
  } as unknown as CollectionRepository;
}

function collection(overrides: Partial<Collection> = {}): Collection {
  return {
    id: "collection-id",
    title: "Reliable AI Notes",
    contentType: "article",
    sourceName: "Example",
    summary: "Worth revisiting.",
    externalUrl: "https://example.com/article",
    coverPath:
      "collections/collection-id/cover/00000000-0000-4000-8000-000000000001.webp",
    tags: ["AI"],
    visibility: "public",
    featured: true,
    sortOrder: 0,
    deletedAt: null,
    createdAt: "2026-06-15T00:00:00.000Z",
    updatedAt: "2026-06-15T00:00:00.000Z",
    ...overrides,
  };
}

describe("createCollectionActionService", () => {
  const adminUserId = "admin-user-id";

  it("rejects anonymous and non-admin writes before repository calls", async () => {
    const collections = repository();
    const service = createCollectionActionService({
      repository: collections,
      adminUserId,
    });

    await expect(service.create(null, input())).rejects.toEqual(
      new AdminAccessError("UNAUTHENTICATED"),
    );
    await expect(service.create("other-user", input())).rejects.toEqual(
      new AdminAccessError("FORBIDDEN"),
    );
    expect(collections.save).not.toHaveBeenCalled();
  });

  it("returns field errors without writing invalid public input", async () => {
    const collections = repository();
    const service = createCollectionActionService({
      repository: collections,
      adminUserId,
    });

    const result = await service.create(
      adminUserId,
      input({ summary: "", externalUrl: "" }),
    );

    expect(result.fieldErrors?.summary).toBeDefined();
    expect(collections.save).not.toHaveBeenCalled();
  });

  it("writes normalized valid input for the administrator", async () => {
    const collections = repository();
    const service = createCollectionActionService({
      repository: collections,
      adminUserId,
    });

    await service.create(adminUserId, input({ tags: [" AI ", "ai"] }));

    expect(collections.save).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ tags: ["AI"] }),
    );
  });

  it("uses repository trash, restore, and permanent-delete operations", async () => {
    const collections = repository();
    const service = createCollectionActionService({
      repository: collections,
      adminUserId,
    });

    await service.moveToTrash(adminUserId, "collection-id");
    await service.restore(adminUserId, "collection-id");
    await service.permanentlyDelete(adminUserId, "collection-id");

    expect(collections.moveToTrash).toHaveBeenCalledWith("collection-id");
    expect(collections.restore).toHaveBeenCalledWith("collection-id");
    expect(collections.permanentlyDelete).toHaveBeenCalledWith("collection-id");
  });

  it("cleans obsolete system cover files after an update saves", async () => {
    const collections = repository();
    const deleteMediaObject = vi.fn().mockResolvedValue(undefined);
    vi.mocked(collections.getById).mockResolvedValue(
      collection({
        coverPath:
          "collections/collection-id/cover/00000000-0000-4000-8000-000000000001.webp",
      }),
    );
    const service = createCollectionActionService({
      repository: collections,
      adminUserId,
      deleteMediaObject,
    });

    await service.update(
      adminUserId,
      "collection-id",
      input({
        coverPath:
          "collections/collection-id/cover/00000000-0000-4000-8000-000000000002.webp",
      }),
    );

    expect(deleteMediaObject).toHaveBeenCalledWith(
      "collections/collection-id/cover/00000000-0000-4000-8000-000000000001.webp",
      "replace_old_file",
    );
  });

  it("keeps a successful update even if obsolete cover cleanup fails", async () => {
    const collections = repository();
    const deleteMediaObject = vi
      .fn()
      .mockRejectedValue(new Error("cleanup failed"));
    vi.mocked(collections.getById).mockResolvedValue(collection());
    const service = createCollectionActionService({
      repository: collections,
      adminUserId,
      deleteMediaObject,
    });

    const result = await service.update(
      adminUserId,
      "collection-id",
      input({
        coverPath:
          "collections/collection-id/cover/00000000-0000-4000-8000-000000000002.webp",
      }),
    );

    expect(result.ok).toBe(true);
    expect(collections.save).toHaveBeenCalled();
  });

  it("cleans system cover files after permanent delete", async () => {
    const collections = repository();
    const deleteMediaObject = vi.fn().mockResolvedValue(undefined);
    vi.mocked(collections.getById).mockResolvedValue(collection());
    const service = createCollectionActionService({
      repository: collections,
      adminUserId,
      deleteMediaObject,
    });

    await service.permanentlyDelete(adminUserId, "collection-id");

    expect(collections.permanentlyDelete).toHaveBeenCalledWith("collection-id");
    expect(deleteMediaObject).toHaveBeenCalledWith(
      "collections/collection-id/cover/00000000-0000-4000-8000-000000000001.webp",
      "delete_asset_file",
    );
  });
});

describe("getCollectionMutationRevalidationPaths", () => {
  it("includes homepage, public, and admin paths", () => {
    expect(getCollectionMutationRevalidationPaths()).toEqual([
      "/",
      "/collections",
      "/admin/collections",
      "/admin/collections/trash",
    ]);
  });
});
