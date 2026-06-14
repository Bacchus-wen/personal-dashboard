"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createPhotoActionService,
  getPhotoMutationRevalidationPaths,
} from "@/lib/photos/actions";
import { getPhotoRepository } from "@/lib/photos/server-repository";
import { getPhotoStorageService } from "@/lib/photos/server-storage";
import type { PhotoActionResult, PhotoInput } from "@/lib/photos/types";
import { getAdminUserId } from "@/lib/supabase/env";

function stringValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function inputFromFormData(formData: FormData): PhotoInput {
  return {
    visibility: stringValue(formData, "visibility"),
    sortOrder: stringValue(formData, "sortOrder"),
  };
}

function service() {
  return createPhotoActionService({
    repository: getPhotoRepository(),
    storage: getPhotoStorageService(),
    adminUserId: getAdminUserId(),
  });
}

function refresh(result: PhotoActionResult) {
  if (!result.ok) return result;
  for (const path of getPhotoMutationRevalidationPaths()) revalidatePath(path);
  return result;
}

export async function updatePhotoAction(
  id: string,
  _previousState: PhotoActionResult,
  formData: FormData,
) {
  const user = await requireAdmin();
  return refresh(await service().update(user.id, id, inputFromFormData(formData)));
}

export async function movePhotoToTrashAction(id: string) {
  const user = await requireAdmin();
  return refresh(await service().moveToTrash(user.id, id));
}

export async function restorePhotoAction(id: string) {
  const user = await requireAdmin();
  return refresh(await service().restore(user.id, id));
}

export async function permanentlyDeletePhotoAction(id: string) {
  const user = await requireAdmin();
  return refresh(await service().permanentlyDelete(user.id, id));
}

export async function retryPhotoCleanupAction(taskId: string) {
  const user = await requireAdmin();
  return refresh(await service().retryCleanup(user.id, taskId));
}
