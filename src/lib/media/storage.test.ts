import { describe, expect, it, vi } from "vitest";

import {
  createMediaStorageService,
  safeMediaStorageError,
  type MediaCleanupClient,
  type MediaStorageClient,
} from "./storage";

function dependencies(events: string[]) {
  const storage: MediaStorageClient = {
    upload: vi.fn(async () => {
      events.push("upload");
    }),
    remove: vi.fn(async () => {
      events.push("remove");
    }),
    getPublicUrl: vi.fn((path) => `https://cdn.example/${path}`),
  };
  const cleanup: MediaCleanupClient = {
    upsertCleanupTask: vi.fn(async (input) => {
      events.push(`cleanup:${input.reason}`);
    }),
  };

  return { storage, cleanup };
}

describe("createMediaStorageService", () => {
  it("uploads bytes and returns the public URL", async () => {
    const events: string[] = [];
    const { storage, cleanup } = dependencies(events);
    const service = createMediaStorageService({ storage, cleanup });

    await expect(
      service.upload({
        path: "test/test/11111111-1111-4111-8111-111111111111.webp",
        bytes: new Uint8Array([1]),
        contentType: "image/webp",
      }),
    ).resolves.toEqual({
      path: "test/test/11111111-1111-4111-8111-111111111111.webp",
      publicUrl:
        "https://cdn.example/test/test/11111111-1111-4111-8111-111111111111.webp",
    });

    expect(events).toEqual(["upload"]);
    expect(storage.upload).toHaveBeenCalledWith(
      "test/test/11111111-1111-4111-8111-111111111111.webp",
      new Uint8Array([1]),
      "image/webp",
    );
  });

  it("deletes an object without writing cleanup when removal succeeds", async () => {
    const events: string[] = [];
    const { storage, cleanup } = dependencies(events);
    const service = createMediaStorageService({ storage, cleanup });

    await service.deleteObject(
      "test/test/11111111-1111-4111-8111-111111111111.webp",
      "delete_asset_file",
    );

    expect(events).toEqual(["remove"]);
    expect(cleanup.upsertCleanupTask).not.toHaveBeenCalled();
  });

  it("writes a cleanup task with a safe error when removal fails", async () => {
    const events: string[] = [];
    const { storage, cleanup } = dependencies(events);
    vi.mocked(storage.remove).mockImplementationOnce(async () => {
      events.push("remove");
      throw new Error("secret-key=do-not-persist");
    });
    const service = createMediaStorageService({ storage, cleanup });

    await expect(
      service.deleteObject(
        "test/test/11111111-1111-4111-8111-111111111111.webp",
        "delete_asset_file",
      ),
    ).rejects.toThrow("Media object cleanup failed.");

    expect(events).toEqual(["remove", "cleanup:delete_asset_file"]);
    expect(cleanup.upsertCleanupTask).toHaveBeenCalledWith({
      bucketId: "public-media",
      objectPath: "test/test/11111111-1111-4111-8111-111111111111.webp",
      reason: "delete_asset_file",
      lastError: "Storage operation failed.",
    });
  });
});

describe("safeMediaStorageError", () => {
  it("does not persist sensitive errors", () => {
    expect(safeMediaStorageError(new Error("secret-key=do-not-persist"))).toBe(
      "Storage operation failed.",
    );
    expect(safeMediaStorageError("x".repeat(500)).length).toBeLessThanOrEqual(
      320,
    );
  });
});
