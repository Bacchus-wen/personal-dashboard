import { runProtectedAdminOperation } from "../auth/guard";
import type { PhotoRepository } from "./repository";
import type { createPhotoStorageService } from "./storage";
import type { PhotoActionResult, PhotoInput } from "./types";
import { validatePhotoInput } from "./validation";

type PhotoStorageService = Pick<
  ReturnType<typeof createPhotoStorageService>,
  "permanentlyDelete" | "retryCleanup"
>;

type Dependencies = {
  repository: PhotoRepository;
  storage: PhotoStorageService;
  adminUserId: string;
};

function success(message: string, photoId?: string): PhotoActionResult {
  return { ok: true, message, photoId };
}

function failure(message: string): PhotoActionResult {
  return { ok: false, message };
}

export function getPhotoMutationRevalidationPaths() {
  return [
    "/",
    "/album",
    "/admin/photos",
    "/admin/photos/trash",
    "/admin/photos/cleanup",
  ] as const;
}

export function createPhotoActionService({
  repository,
  storage,
  adminUserId,
}: Dependencies) {
  return {
    update(userId: string | null, id: string, input: PhotoInput) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        const validated = validatePhotoInput(input);
        if (!validated.ok) {
          return {
            ok: false,
            message: "请修正照片设置后再保存。",
            fieldErrors: validated.errors,
          } satisfies PhotoActionResult;
        }
        try {
          const photo = await repository.updateMetadata(id, validated.data);
          return success("照片设置已保存。", photo.id);
        } catch {
          return failure("照片设置保存失败，请稍后重试。");
        }
      });
    },

    moveToTrash(userId: string | null, id: string) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        try {
          await repository.moveToTrash(id);
          return success("照片已移入回收站。", id);
        } catch {
          return failure("无法将照片移入回收站。");
        }
      });
    },

    restore(userId: string | null, id: string) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        try {
          await repository.restore(id);
          return success("照片已恢复为草稿。", id);
        } catch {
          return failure("照片恢复失败，请稍后重试。");
        }
      });
    },

    permanentlyDelete(userId: string | null, id: string) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        try {
          const photo = await repository.getById(id, true);
          if (!photo?.deletedAt) return failure("回收站中未找到该照片。");
          await storage.permanentlyDelete(photo);
          return success("照片已永久删除。", id);
        } catch {
          return failure("照片永久删除失败，请稍后重试。");
        }
      });
    },

    retryCleanup(userId: string | null, taskId: string) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        try {
          const task = await repository.getCleanupTask(taskId);
          if (!task) return failure("未找到该清理任务。");
          await storage.retryCleanup(task);
          return success("Storage 清理任务已完成。");
        } catch {
          return failure("Storage 清理重试失败，请稍后重试。");
        }
      });
    },
  };
}
