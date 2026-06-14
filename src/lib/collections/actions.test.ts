import { describe, expect, it, vi } from "vitest";

import { AdminAccessError } from "../auth/guard";
import {
  createCollectionActionService,
  getCollectionMutationRevalidationPaths,
} from "./actions";
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
    save: vi.fn().mockResolvedValue({ id: "collection-id" }),
    moveToTrash: vi.fn().mockResolvedValue(undefined),
    restore: vi.fn().mockResolvedValue(undefined),
    permanentlyDelete: vi.fn().mockResolvedValue(undefined),
  } as unknown as CollectionRepository;
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
