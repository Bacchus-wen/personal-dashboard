"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createPlanActionService,
  getPlanMutationRevalidationPaths,
} from "@/lib/plans/actions";
import { getPlanRepository } from "@/lib/plans/server-repository";
import type { PlanActionResult, PlanInput } from "@/lib/plans/types";
import { getAdminUserId } from "@/lib/supabase/env";

function stringValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function inputFromFormData(formData: FormData): PlanInput {
  return {
    title: stringValue(formData, "title"),
    summary: stringValue(formData, "summary"),
    description: stringValue(formData, "description"),
    status: stringValue(formData, "status"),
    visibility: stringValue(formData, "visibility"),
    priority: stringValue(formData, "priority"),
    progress: stringValue(formData, "progress"),
    deadline: stringValue(formData, "deadline"),
    relatedUrl: stringValue(formData, "relatedUrl"),
    categoryId: stringValue(formData, "categoryId"),
  };
}

function service() {
  return createPlanActionService({
    repository: getPlanRepository(),
    adminUserId: getAdminUserId(),
  });
}

function refreshPlanPaths(result: PlanActionResult) {
  if (!result.ok) {
    return result;
  }

  for (const path of getPlanMutationRevalidationPaths()) {
    revalidatePath(path);
  }
  return result;
}

export async function createPlanAction(
  _previousState: PlanActionResult,
  formData: FormData,
) {
  const user = await requireAdmin();
  return refreshPlanPaths(
    await service().createPlan(user.id, inputFromFormData(formData)),
  );
}

export async function updatePlanAction(
  id: string,
  _previousState: PlanActionResult,
  formData: FormData,
) {
  const user = await requireAdmin();
  return refreshPlanPaths(
    await service().updatePlan(user.id, id, inputFromFormData(formData)),
  );
}

export async function movePlanToTrashAction(id: string) {
  const user = await requireAdmin();
  return refreshPlanPaths(await service().movePlanToTrash(user.id, id));
}

export async function restorePlanAction(id: string) {
  const user = await requireAdmin();
  return refreshPlanPaths(await service().restorePlan(user.id, id));
}

export async function permanentlyDeletePlanAction(id: string) {
  const user = await requireAdmin();
  return refreshPlanPaths(await service().permanentlyDeletePlan(user.id, id));
}

export async function createCategoryAction(name: string) {
  const user = await requireAdmin();
  return refreshPlanPaths(await service().createCategory(user.id, name));
}

export async function renameCategoryAction(id: string, name: string) {
  const user = await requireAdmin();
  return refreshPlanPaths(await service().renameCategory(user.id, id, name));
}

export async function deleteCategoryAction(id: string) {
  const user = await requireAdmin();
  return refreshPlanPaths(await service().deleteCategory(user.id, id));
}
