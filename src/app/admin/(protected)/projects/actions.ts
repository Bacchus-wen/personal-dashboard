"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createFeaturedProjectActionService,
  getFeaturedProjectMutationRevalidationPaths,
} from "@/lib/featured-projects/actions";
import { getFeaturedProjectRepository } from "@/lib/featured-projects/server-repository";
import { getMediaStorageService } from "@/lib/media/server-storage";
import type {
  FeaturedProjectActionResult,
  FeaturedProjectInput,
} from "@/lib/featured-projects/types";
import { getAdminUserId } from "@/lib/supabase/env";

function stringValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function parseStringArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function inputFromFormData(formData: FormData): FeaturedProjectInput {
  return {
    name: stringValue(formData, "name"),
    repositoryUrl: stringValue(formData, "repositoryUrl"),
    summary: stringValue(formData, "summary"),
    recommendation: stringValue(formData, "recommendation"),
    coverPath: stringValue(formData, "coverPath"),
    language: stringValue(formData, "language"),
    tags: parseStringArray(stringValue(formData, "tags")),
    starCount: stringValue(formData, "starCount"),
    starRecordedOn: stringValue(formData, "starRecordedOn"),
    visibility: stringValue(formData, "visibility"),
    featured: formData.get("featured") === "on",
    sortOrder: stringValue(formData, "sortOrder"),
  };
}

function service() {
  return createFeaturedProjectActionService({
    repository: getFeaturedProjectRepository(),
    adminUserId: getAdminUserId(),
    deleteMediaObject: (path, reason) =>
      getMediaStorageService().deleteObject(path, reason),
  });
}

function refresh(result: FeaturedProjectActionResult) {
  if (!result.ok) return result;
  for (const path of getFeaturedProjectMutationRevalidationPaths()) {
    revalidatePath(path);
  }
  return result;
}

export async function createFeaturedProjectAction(
  _previousState: FeaturedProjectActionResult,
  formData: FormData,
) {
  const user = await requireAdmin();
  return refresh(await service().create(user.id, inputFromFormData(formData)));
}

export async function updateFeaturedProjectAction(
  id: string,
  _previousState: FeaturedProjectActionResult,
  formData: FormData,
) {
  const user = await requireAdmin();
  return refresh(
    await service().update(user.id, id, inputFromFormData(formData)),
  );
}

export async function moveFeaturedProjectToTrashAction(id: string) {
  const user = await requireAdmin();
  return refresh(await service().moveToTrash(user.id, id));
}

export async function restoreFeaturedProjectAction(id: string) {
  const user = await requireAdmin();
  return refresh(await service().restore(user.id, id));
}

export async function permanentlyDeleteFeaturedProjectAction(id: string) {
  const user = await requireAdmin();
  return refresh(await service().permanentlyDelete(user.id, id));
}
