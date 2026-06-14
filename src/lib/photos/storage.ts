import { PUBLIC_MEDIA_BUCKET } from "./constants";
import type { PhotoRepository } from "./repository";
import type {
  CleanupReason,
  Photo,
  StorageCleanupTask,
} from "./types";

export type PhotoStorageClient = {
  upload(path: string, bytes: Uint8Array): Promise<void>;
  remove(path: string): Promise<void>;
  publicUrl(path: string): string;
};

type PhotoStorageDependencies = {
  repository: PhotoRepository;
  storage: PhotoStorageClient;
};

export function safeStorageError(error: unknown): string {
  void error;
  return "Storage operation failed.";
}

function newObjectPath(photoId: string) {
  return `album/${photoId}/${crypto.randomUUID()}.webp`;
}

async function saveCleanupFailure(
  repository: PhotoRepository,
  objectPath: string,
  reason: CleanupReason,
  error: unknown,
) {
  await repository.saveCleanupTask({
    bucketId: PUBLIC_MEDIA_BUCKET,
    objectPath,
    reason,
    lastError: safeStorageError(error),
  });
}

async function rollbackNewObject(
  repository: PhotoRepository,
  storage: PhotoStorageClient,
  objectPath: string,
) {
  try {
    await storage.remove(objectPath);
  } catch (error) {
    await saveCleanupFailure(repository, objectPath, "create_rollback", error);
  }
}

export function createPhotoStorageService({
  repository,
  storage,
}: PhotoStorageDependencies) {
  return {
    async createPhoto(bytes: Uint8Array, originalFilename: string) {
      const photoId = crypto.randomUUID();
      const objectPath = newObjectPath(photoId);

      await storage.upload(objectPath, bytes);
      try {
        return await repository.createDraft(
          photoId,
          objectPath,
          originalFilename,
        );
      } catch (error) {
        await rollbackNewObject(repository, storage, objectPath);
        throw error;
      }
    },

    async replacePhoto(
      photo: Photo,
      bytes: Uint8Array,
      originalFilename: string,
    ) {
      const objectPath = newObjectPath(photo.id);

      await storage.upload(objectPath, bytes);
      let updated: Photo;
      try {
        updated = await repository.replaceStoragePath(
          photo.id,
          photo.storagePath,
          objectPath,
          originalFilename,
        );
      } catch (error) {
        await rollbackNewObject(repository, storage, objectPath);
        throw error;
      }

      try {
        await storage.remove(photo.storagePath);
      } catch (error) {
        await saveCleanupFailure(
          repository,
          photo.storagePath,
          "replace_old_file",
          error,
        );
      }
      return updated;
    },

    async permanentlyDelete(photo: Photo) {
      await storage.remove(photo.storagePath);
      await repository.deleteRecord(photo.id);
    },

    async retryCleanup(task: StorageCleanupTask) {
      await storage.remove(task.objectPath);
      await repository.deleteCleanupTask(task.id);
    },
  };
}
