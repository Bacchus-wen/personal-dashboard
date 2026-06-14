"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createCollectionActionService,
  getCollectionMutationRevalidationPaths,
} from "@/lib/collections/actions";
import { getCollectionRepository } from "@/lib/collections/server-repository";
import type {
  CollectionActionResult,
  CollectionInput,
} from "@/lib/collections/types";
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

function inputFromFormData(formData: FormData): CollectionInput {
  return {
    title: stringValue(formData, "title"),
    contentType: stringValue(formData, "contentType"),
    sourceName: stringValue(formData, "sourceName"),
    summary: stringValue(formData, "summary"),
    externalUrl: stringValue(formData, "externalUrl"),
    coverPath: stringValue(formData, "coverPath"),
    tags: parseStringArray(stringValue(formData, "tags")),
    visibility: stringValue(formData, "visibility"),
    featured: formData.get("featured") === "on",
    sortOrder: stringValue(formData, "sortOrder"),
  };
}

function service() {
  return createCollectionActionService({
    repository: getCollectionRepository(),
    adminUserId: getAdminUserId(),
  });
}

function refresh(result: CollectionActionResult) {
  if (!result.ok) return result;
  for (const path of getCollectionMutationRevalidationPaths()) {
    revalidatePath(path);
  }
  return result;
}

export async function createCollectionAction(
  _previousState: CollectionActionResult,
  formData: FormData,
) {
  const user = await requireAdmin();
  return refresh(await service().create(user.id, inputFromFormData(formData)));
}

export async function updateCollectionAction(
  id: string,
  _previousState: CollectionActionResult,
  formData: FormData,
) {
  const user = await requireAdmin();
  return refresh(
    await service().update(user.id, id, inputFromFormData(formData)),
  );
}

export async function moveCollectionToTrashAction(id: string) {
  const user = await requireAdmin();
  return refresh(await service().moveToTrash(user.id, id));
}

export async function restoreCollectionAction(id: string) {
  const user = await requireAdmin();
  return refresh(await service().restore(user.id, id));
}

export async function permanentlyDeleteCollectionAction(id: string) {
  const user = await requireAdmin();
  return refresh(await service().permanentlyDelete(user.id, id));
}
