import { runProtectedAdminOperation } from "../auth/guard";
import type { CollectionRepository } from "./repository";
import type { CollectionActionResult, CollectionInput } from "./types";
import { validateCollectionInput } from "./validation";

type Dependencies = {
  repository: CollectionRepository;
  adminUserId: string;
};

export function getCollectionMutationRevalidationPaths() {
  return [
    "/",
    "/collections",
    "/admin/collections",
    "/admin/collections/trash",
  ] as const;
}

export function createCollectionActionService({
  repository,
  adminUserId,
}: Dependencies) {
  async function save(
    userId: string | null,
    id: string | null,
    input: CollectionInput,
  ) {
    return runProtectedAdminOperation(userId, adminUserId, async () => {
      const validated = validateCollectionInput(input);
      if (!validated.ok) {
        return {
          ok: false,
          message: "请修正收藏内容后再保存。",
          fieldErrors: validated.errors,
        } satisfies CollectionActionResult;
      }
      try {
        const collection = await repository.save(id, validated.data);
        return {
          ok: true,
          message: id ? "收藏已保存。" : "收藏已创建。",
          collectionId: collection.id,
        } satisfies CollectionActionResult;
      } catch {
        return { ok: false, message: "收藏保存失败，请稍后重试。" };
      }
    });
  }

  return {
    create(userId: string | null, input: CollectionInput) {
      return save(userId, null, input);
    },
    update(userId: string | null, id: string, input: CollectionInput) {
      return save(userId, id, input);
    },
    moveToTrash(userId: string | null, id: string) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        try {
          await repository.moveToTrash(id);
          return { ok: true, message: "收藏已移入回收站。", collectionId: id };
        } catch {
          return { ok: false, message: "无法将收藏移入回收站。" };
        }
      });
    },
    restore(userId: string | null, id: string) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        try {
          await repository.restore(id);
          return { ok: true, message: "收藏已恢复为草稿。", collectionId: id };
        } catch {
          return { ok: false, message: "收藏恢复失败。" };
        }
      });
    },
    permanentlyDelete(userId: string | null, id: string) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        try {
          await repository.permanentlyDelete(id);
          return { ok: true, message: "收藏已永久删除。", collectionId: id };
        } catch {
          return { ok: false, message: "收藏永久删除失败。" };
        }
      });
    },
  };
}
