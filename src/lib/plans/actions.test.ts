import { describe, expect, it, vi } from "vitest";

import { AdminAccessError } from "../auth/guard";
import {
  createPlanActionService,
  getPlanMutationRevalidationPaths,
} from "./actions";
import type { PlanRepository } from "./repository";
import type { PlanInput } from "./types";

function input(overrides: Partial<PlanInput> = {}): PlanInput {
  return {
    title: "规划",
    summary: "摘要",
    description: null,
    status: "in_progress",
    visibility: "private",
    priority: "medium",
    progress: 50,
    deadline: null,
    relatedUrl: null,
    categoryId: null,
    ...overrides,
  };
}

function repository() {
  return {
    createPlan: vi.fn().mockResolvedValue({ id: "plan-id" }),
    updatePlan: vi.fn().mockResolvedValue({ id: "plan-id" }),
    movePlanToTrash: vi.fn().mockResolvedValue(undefined),
    restorePlan: vi.fn().mockResolvedValue(undefined),
    permanentlyDeletePlan: vi.fn().mockResolvedValue(undefined),
    createCategory: vi.fn().mockResolvedValue({ id: "category-id" }),
    renameCategory: vi.fn().mockResolvedValue({ id: "category-id" }),
    deleteCategory: vi.fn().mockResolvedValue(undefined),
  } as unknown as PlanRepository;
}

describe("createPlanActionService", () => {
  const adminUserId = "admin-user-id";

  it("rejects anonymous users before repository calls", async () => {
    const plans = repository();
    const service = createPlanActionService({ repository: plans, adminUserId });

    await expect(service.createPlan(null, input())).rejects.toEqual(
      new AdminAccessError("UNAUTHENTICATED"),
    );
    expect(plans.createPlan).not.toHaveBeenCalled();
  });

  it("rejects non-admin users before repository calls", async () => {
    const plans = repository();
    const service = createPlanActionService({ repository: plans, adminUserId });

    await expect(
      service.createPlan("another-user-id", input()),
    ).rejects.toEqual(new AdminAccessError("FORBIDDEN"));
    expect(plans.createPlan).not.toHaveBeenCalled();
  });

  it("returns structured field errors without writing invalid input", async () => {
    const plans = repository();
    const service = createPlanActionService({ repository: plans, adminUserId });

    const result = await service.createPlan(
      adminUserId,
      input({ visibility: "public", title: "", summary: "" }),
    );

    expect(result.ok).toBe(false);
    expect(result.fieldErrors?.title).toBeDefined();
    expect(result.fieldErrors?.summary).toBeDefined();
    expect(plans.createPlan).not.toHaveBeenCalled();
  });

  it("writes normalized valid input for the administrator", async () => {
    const plans = repository();
    const service = createPlanActionService({ repository: plans, adminUserId });

    const result = await service.createPlan(
      adminUserId,
      input({ status: "completed", progress: 42 }),
    );

    expect(result).toMatchObject({ ok: true, planId: "plan-id" });
    expect(plans.createPlan).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed", progress: 100 }),
    );
  });

  it("uses the repository restore operation for an administrator", async () => {
    const plans = repository();
    const service = createPlanActionService({ repository: plans, adminUserId });

    await expect(service.restorePlan(adminUserId, "plan-id")).resolves.toEqual(
      expect.objectContaining({ ok: true }),
    );
    expect(plans.restorePlan).toHaveBeenCalledWith("plan-id");
  });

  it("validates category names before writing", async () => {
    const plans = repository();
    const service = createPlanActionService({ repository: plans, adminUserId });

    const result = await service.createCategory(adminUserId, " ");

    expect(result.ok).toBe(false);
    expect(plans.createCategory).not.toHaveBeenCalled();
  });
});

describe("getPlanMutationRevalidationPaths", () => {
  it("returns every public and administrator planning path", () => {
    expect(getPlanMutationRevalidationPaths()).toEqual([
      "/",
      "/plans",
      "/admin/plans",
      "/admin/plans/trash",
    ]);
  });
});
