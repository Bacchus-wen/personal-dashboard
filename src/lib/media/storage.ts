import { MEDIA_BUCKET } from "./constants";
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
  if (
    typeof error === "string" &&
    !/key|token|secret|session|authorization/i.test(error)
  ) {
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
    async upload({
      path,
      bytes,
      contentType,
    }: {
      path: string;
      bytes: Uint8Array;
      contentType: string;
    }) {
      await storage.upload(path, bytes, contentType);
      return { path, publicUrl: storage.getPublicUrl(path) };
    },

    async deleteObject(path: string, reason: MediaCleanupReason) {
      try {
        await storage.remove(path);
      } catch (error) {
        await cleanup.upsertCleanupTask({
          bucketId: MEDIA_BUCKET,
          objectPath: path,
          reason,
          lastError: safeMediaStorageError(error),
        });
        throw new Error("Media object cleanup failed.");
      }
    },
  };
}
