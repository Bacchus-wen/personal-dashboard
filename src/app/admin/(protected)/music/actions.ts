"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { getMediaStorageService } from "@/lib/media/server-storage";
import {
  createMusicTrackActionService,
  getMusicMutationRevalidationPaths,
} from "@/lib/music/actions";
import { getMusicTrackRepository } from "@/lib/music/server-repository";
import type { MusicTrackActionResult, MusicTrackInput } from "@/lib/music/types";
import { getAdminUserId } from "@/lib/supabase/env";

function stringValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function inputFromFormData(formData: FormData): MusicTrackInput {
  return {
    title: stringValue(formData, "title"),
    artist: stringValue(formData, "artist"),
    audioPath: stringValue(formData, "audioPath"),
    coverPath: stringValue(formData, "coverPath"),
    isActive: formData.get("isActive") === "on",
    sortOrder: stringValue(formData, "sortOrder"),
  };
}

function service() {
  return createMusicTrackActionService({
    repository: getMusicTrackRepository(),
    adminUserId: getAdminUserId(),
    deleteMediaObject: (path, reason) =>
      getMediaStorageService().deleteObject(path, reason),
  });
}

function refresh(result: MusicTrackActionResult) {
  if (!result.ok) return result;
  for (const path of getMusicMutationRevalidationPaths()) {
    revalidatePath(path);
  }
  return result;
}

export async function createMusicTrackAction(
  _previousState: MusicTrackActionResult,
  formData: FormData,
) {
  const user = await requireAdmin();
  return refresh(await service().create(user.id, inputFromFormData(formData)));
}

export async function updateMusicTrackAction(
  id: string,
  _previousState: MusicTrackActionResult,
  formData: FormData,
) {
  const user = await requireAdmin();
  return refresh(await service().update(user.id, id, inputFromFormData(formData)));
}

export async function activateMusicTrackAction(id: string) {
  const user = await requireAdmin();
  return refresh(await service().activate(user.id, id));
}

export async function moveMusicTrackToTrashAction(id: string) {
  const user = await requireAdmin();
  return refresh(await service().moveToTrash(user.id, id));
}

export async function restoreMusicTrackAction(id: string) {
  const user = await requireAdmin();
  return refresh(await service().restore(user.id, id));
}

export async function permanentlyDeleteMusicTrackAction(id: string) {
  const user = await requireAdmin();
  return refresh(await service().permanentlyDelete(user.id, id));
}
