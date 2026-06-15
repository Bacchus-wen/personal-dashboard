import { runProtectedAdminOperation } from "../auth/guard";
import {
  cleanupObsoleteMedia,
  obsoleteSystemMediaPaths,
} from "../media/lifecycle";
import type { WorkRepository } from "./repository";
import type { WorkActionResult, WorkInput } from "./types";
import type { MediaCleanupReason } from "../media/types";
import { validateWorkInput } from "./validation";

type Dependencies = {
  repository: WorkRepository;
  adminUserId: string;
  deleteMediaObject?: (path: string, reason: MediaCleanupReason) => Promise<void>;
};

function success(message: string, workId?: string): WorkActionResult {
  return { ok: true, message, workId };
}

function failure(message: string): WorkActionResult {
  return { ok: false, message };
}

export function getWorkMutationRevalidationPaths() {
  return ["/works", "/admin/works", "/admin/works/trash"] as const;
}

export function createWorkActionService({
  repository,
  adminUserId,
  deleteMediaObject = async () => {},
}: Dependencies) {
  async function save(userId: string | null, id: string | null, input: WorkInput) {
    return runProtectedAdminOperation(userId, adminUserId, async () => {
      const validated = validateWorkInput(input);
      if (!validated.ok) {
        return {
          ok: false,
          message: "请修正作品内容后再保存。",
          fieldErrors: validated.errors,
        } satisfies WorkActionResult;
      }
      try {
        const previous = id ? await repository.getWorkById(id) : null;
        const work = await repository.saveWork(id, validated.data);
        if (previous) {
          await cleanupObsoleteMedia(
            obsoleteSystemMediaPaths(
              [
                previous.coverPath,
                previous.seoImagePath,
                ...previous.screenshots.map((screenshot) => screenshot.imagePath),
              ],
              [
                validated.data.coverPath,
                validated.data.seoImagePath,
                ...validated.data.screenshots.map((screenshot) => screenshot.imagePath),
              ],
            ),
            (path) => deleteMediaObject(path, "replace_old_file"),
          );
        }
        return success(id ? "作品已保存。" : "作品已创建。", work.id);
      } catch {
        return failure("作品保存失败，请确认 slug 没有重复并稍后重试。");
      }
    });
  }

  return {
    createWork(userId: string | null, input: WorkInput) {
      return save(userId, null, input);
    },
    updateWork(userId: string | null, id: string, input: WorkInput) {
      return save(userId, id, input);
    },
    moveWorkToTrash(userId: string | null, id: string) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        try {
          await repository.moveWorkToTrash(id);
          return success("作品已移入回收站。", id);
        } catch {
          return failure("无法将作品移入回收站，请稍后重试。");
        }
      });
    },
    restoreWork(userId: string | null, id: string) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        try {
          await repository.restoreWork(id);
          return success("作品已恢复为草稿。", id);
        } catch {
          return failure("作品恢复失败，请稍后重试。");
        }
      });
    },
    permanentlyDeleteWork(userId: string | null, id: string) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        try {
          const work = await repository.getWorkById(id);
          await repository.permanentlyDeleteWork(id);
          if (work) {
            await cleanupObsoleteMedia(
              obsoleteSystemMediaPaths(
                [
                  work.coverPath,
                  work.seoImagePath,
                  ...work.screenshots.map((screenshot) => screenshot.imagePath),
                ],
                [],
              ),
              (path) => deleteMediaObject(path, "delete_asset_file"),
            );
          }
          return success("作品已永久删除。", id);
        } catch {
          return failure("作品永久删除失败，请稍后重试。");
        }
      });
    },
  };
}
