import { runProtectedAdminOperation } from "../auth/guard";
import {
  cleanupObsoleteMedia,
  obsoleteSystemMediaPaths,
} from "../media/lifecycle";
import type { MediaCleanupReason } from "../media/types";
import type { FeaturedProjectRepository } from "./repository";
import type {
  FeaturedProjectActionResult,
  FeaturedProjectInput,
} from "./types";
import { validateFeaturedProjectInput } from "./validation";

type Dependencies = {
  repository: FeaturedProjectRepository;
  adminUserId: string;
  deleteMediaObject?: (
    path: string,
    reason: MediaCleanupReason,
  ) => Promise<void>;
};

export function getFeaturedProjectMutationRevalidationPaths() {
  return ["/", "/projects", "/admin/projects", "/admin/projects/trash"] as const;
}

export function createFeaturedProjectActionService({
  repository,
  adminUserId,
  deleteMediaObject = async () => {},
}: Dependencies) {
  async function save(
    userId: string | null,
    id: string | null,
    input: FeaturedProjectInput,
  ) {
    return runProtectedAdminOperation(userId, adminUserId, async () => {
      const validated = validateFeaturedProjectInput(input);
      if (!validated.ok) {
        return {
          ok: false,
          message: "请修正项目内容后再保存。",
          fieldErrors: validated.errors,
        } satisfies FeaturedProjectActionResult;
      }
      try {
        const previous = id ? await repository.getById(id) : null;
        const project = await repository.save(id, validated.data);
        if (previous) {
          await cleanupObsoleteMedia(
            obsoleteSystemMediaPaths(
              [previous.coverPath],
              [validated.data.coverPath],
            ),
            (path) => deleteMediaObject(path, "replace_old_file"),
          );
        }
        return {
          ok: true,
          message: id ? "项目已保存。" : "项目已创建。",
          projectId: project.id,
        } satisfies FeaturedProjectActionResult;
      } catch {
        return { ok: false, message: "项目保存失败，请稍后重试。" };
      }
    });
  }

  return {
    create(userId: string | null, input: FeaturedProjectInput) {
      return save(userId, null, input);
    },
    update(userId: string | null, id: string, input: FeaturedProjectInput) {
      return save(userId, id, input);
    },
    moveToTrash(userId: string | null, id: string) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        try {
          await repository.moveToTrash(id);
          return { ok: true, message: "项目已移入回收站。", projectId: id };
        } catch {
          return { ok: false, message: "无法将项目移入回收站。" };
        }
      });
    },
    restore(userId: string | null, id: string) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        try {
          await repository.restore(id);
          return { ok: true, message: "项目已恢复为草稿。", projectId: id };
        } catch {
          return { ok: false, message: "项目恢复失败。" };
        }
      });
    },
    permanentlyDelete(userId: string | null, id: string) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        try {
          const project = await repository.getById(id);
          await repository.permanentlyDelete(id);
          if (project) {
            await cleanupObsoleteMedia(
              obsoleteSystemMediaPaths([project.coverPath], []),
              (path) => deleteMediaObject(path, "delete_asset_file"),
            );
          }
          return { ok: true, message: "项目已永久删除。", projectId: id };
        } catch {
          return { ok: false, message: "项目永久删除失败。" };
        }
      });
    },
  };
}
