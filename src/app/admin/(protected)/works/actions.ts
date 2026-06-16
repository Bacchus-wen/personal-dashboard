"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { getMediaStorageService } from "@/lib/media/server-storage";
import {
  createWorkActionService,
  getWorkMutationRevalidationPaths,
} from "@/lib/works/actions";
import { getWorkRepository } from "@/lib/works/server-repository";
import type {
  WorkActionResult,
  WorkInput,
  WorkScreenshotInput,
} from "@/lib/works/types";
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

function parseScreenshots(value: string): WorkScreenshotInput[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.map((item) => ({
          imagePath: String(item.imagePath ?? ""),
          caption: String(item.caption ?? ""),
          sortOrder: Number(item.sortOrder ?? 0),
        }))
      : [];
  } catch {
    return [];
  }
}

function inputFromFormData(formData: FormData): WorkInput {
  return {
    name: stringValue(formData, "name"),
    slug: stringValue(formData, "slug"),
    summary: stringValue(formData, "summary"),
    description: stringValue(formData, "description"),
    coverPath: stringValue(formData, "coverPath"),
    techStack: parseStringArray(stringValue(formData, "techStack")),
    status: stringValue(formData, "status"),
    visibility: stringValue(formData, "visibility"),
    startedOn: stringValue(formData, "startedOn"),
    completedOn: stringValue(formData, "completedOn"),
    websiteUrl: stringValue(formData, "websiteUrl"),
    githubUrl: stringValue(formData, "githubUrl"),
    websiteAvailable: formData.get("websiteAvailable") === "on",
    featured: formData.get("featured") === "on",
    sortOrder: stringValue(formData, "sortOrder"),
    seoTitle: stringValue(formData, "seoTitle"),
    seoDescription: stringValue(formData, "seoDescription"),
    seoImagePath: stringValue(formData, "seoImagePath"),
    screenshots: parseScreenshots(stringValue(formData, "screenshots")),
  };
}

function service() {
  return createWorkActionService({
    repository: getWorkRepository(),
    adminUserId: getAdminUserId(),
    deleteMediaObject: (path, reason) =>
      getMediaStorageService().deleteObject(path, reason),
  });
}

function refresh(result: WorkActionResult) {
  if (!result.ok) return result;
  for (const path of getWorkMutationRevalidationPaths()) revalidatePath(path);
  revalidatePath("/works/[slug]", "page");
  return result;
}

export async function createWorkAction(
  _previousState: WorkActionResult,
  formData: FormData,
) {
  const user = await requireAdmin();
  return refresh(await service().createWork(user.id, inputFromFormData(formData)));
}

export async function updateWorkAction(
  id: string,
  _previousState: WorkActionResult,
  formData: FormData,
) {
  const user = await requireAdmin();
  return refresh(
    await service().updateWork(user.id, id, inputFromFormData(formData)),
  );
}

export async function moveWorkToTrashAction(id: string) {
  const user = await requireAdmin();
  return refresh(await service().moveWorkToTrash(user.id, id));
}

export async function restoreWorkAction(id: string) {
  const user = await requireAdmin();
  return refresh(await service().restoreWork(user.id, id));
}

export async function permanentlyDeleteWorkAction(id: string) {
  const user = await requireAdmin();
  return refresh(await service().permanentlyDeleteWork(user.id, id));
}
