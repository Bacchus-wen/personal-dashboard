import { runProtectedAdminOperation } from "../auth/guard";
import type { PlanRepository } from "./repository";
import { validatePlanInput } from "./validation";
import type { PlanActionResult, PlanInput } from "./types";

type PlanActionServiceDependencies = {
  repository: PlanRepository;
  adminUserId: string;
};

function success(message: string, planId?: string): PlanActionResult {
  return { ok: true, message, planId };
}

function failure(message: string): PlanActionResult {
  return { ok: false, message };
}

function validateCategoryName(name: string) {
  const normalized = name.trim();
  return normalized.length >= 1 && normalized.length <= 20
    ? normalized
    : null;
}

export function getPlanMutationRevalidationPaths() {
  return ["/", "/plans", "/admin/plans", "/admin/plans/trash"] as const;
}

export function createPlanActionService({
  repository,
  adminUserId,
}: PlanActionServiceDependencies) {
  return {
    createPlan(userId: string | null, input: PlanInput) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        const validated = validatePlanInput(input);
        if (!validated.ok) {
          return {
            ok: false,
            message: "请修正规划内容后再保存。",
            fieldErrors: validated.errors,
          } satisfies PlanActionResult;
        }

        try {
          const plan = await repository.createPlan(validated.data);
          return success("规划已创建。", plan.id);
        } catch {
          return failure("规划创建失败，请稍后重试。");
        }
      });
    },

    updatePlan(userId: string | null, id: string, input: PlanInput) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        const validated = validatePlanInput(input);
        if (!validated.ok) {
          return {
            ok: false,
            message: "请修正规划内容后再保存。",
            fieldErrors: validated.errors,
          } satisfies PlanActionResult;
        }

        try {
          const plan = await repository.updatePlan(id, validated.data);
          return success("规划已保存。", plan.id);
        } catch {
          return failure("规划保存失败，请稍后重试。");
        }
      });
    },

    movePlanToTrash(userId: string | null, id: string) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        try {
          await repository.movePlanToTrash(id);
          return success("规划已移入回收站。", id);
        } catch {
          return failure("无法将规划移入回收站，请稍后重试。");
        }
      });
    },

    restorePlan(userId: string | null, id: string) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        try {
          await repository.restorePlan(id);
          return success("规划已恢复为草稿。", id);
        } catch {
          return failure("规划恢复失败，请稍后重试。");
        }
      });
    },

    permanentlyDeletePlan(userId: string | null, id: string) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        try {
          await repository.permanentlyDeletePlan(id);
          return success("规划已永久删除。", id);
        } catch {
          return failure("规划永久删除失败，请稍后重试。");
        }
      });
    },

    createCategory(userId: string | null, name: string) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        const normalized = validateCategoryName(name);
        if (!normalized) {
          return failure("分类名称必须为 1 至 20 个字符。");
        }

        try {
          const category = await repository.createCategory(normalized);
          return success("分类已创建。", category.id);
        } catch {
          return failure("分类创建失败，请确认名称没有重复。");
        }
      });
    },

    renameCategory(userId: string | null, id: string, name: string) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        const normalized = validateCategoryName(name);
        if (!normalized) {
          return failure("分类名称必须为 1 至 20 个字符。");
        }

        try {
          const category = await repository.renameCategory(id, normalized);
          return success("分类已重命名。", category.id);
        } catch {
          return failure("分类重命名失败，请确认名称没有重复。");
        }
      });
    },

    deleteCategory(userId: string | null, id: string) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        try {
          await repository.deleteCategory(id);
          return success("分类已删除，相关规划已变为未分类。", id);
        } catch {
          return failure("分类删除失败，请稍后重试。");
        }
      });
    },
  };
}
