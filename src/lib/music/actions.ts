import { runProtectedAdminOperation } from "../auth/guard";
import {
  cleanupObsoleteMedia,
  obsoleteSystemMediaPaths,
} from "../media/lifecycle";
import type { MediaCleanupReason } from "../media/types";
import type { MusicTrackRepository } from "./repository";
import type { MusicTrackActionResult, MusicTrackInput } from "./types";
import {
  isSystemMusicAudioPath,
  validateMusicTrackInput,
} from "./validation";

type Dependencies = {
  repository: MusicTrackRepository;
  adminUserId: string;
  deleteMediaObject?: (
    path: string,
    reason: MediaCleanupReason,
  ) => Promise<void>;
};

export function getMusicMutationRevalidationPaths() {
  return ["/", "/admin/music", "/admin/music/trash"] as const;
}

function obsoleteAudioPaths(
  previousPath: string | null | undefined,
  nextPath: string | null | undefined,
) {
  if (
    previousPath &&
    previousPath !== nextPath &&
    isSystemMusicAudioPath(previousPath)
  ) {
    return [previousPath];
  }
  return [];
}

export function createMusicTrackActionService({
  repository,
  adminUserId,
  deleteMediaObject = async () => {},
}: Dependencies) {
  async function save(
    userId: string | null,
    id: string | null,
    input: MusicTrackInput,
  ) {
    return runProtectedAdminOperation(userId, adminUserId, async () => {
      const validated = validateMusicTrackInput(input);
      if (!validated.ok) {
        return {
          ok: false,
          message: "请修正音乐内容后再保存。",
          fieldErrors: validated.errors,
        } satisfies MusicTrackActionResult;
      }
      try {
        const previous = id ? await repository.getById(id) : null;
        const track = await repository.save(id, validated.data);
        if (previous) {
          await cleanupObsoleteMedia(
            obsoleteAudioPaths(previous.audioPath, validated.data.audioPath),
            (path) => deleteMediaObject(path, "replace_old_file"),
          );
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
          message: id ? "音乐已保存。" : "音乐已创建。",
          trackId: track.id,
        } satisfies MusicTrackActionResult;
      } catch {
        return { ok: false, message: "音乐保存失败，请稍后重试。" };
      }
    });
  }

  return {
    create(userId: string | null, input: MusicTrackInput) {
      return save(userId, null, input);
    },
    update(userId: string | null, id: string, input: MusicTrackInput) {
      return save(userId, id, input);
    },
    activate(userId: string | null, id: string) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        try {
          await repository.activate(id);
          return { ok: true, message: "当前播放音乐已更新。", trackId: id };
        } catch {
          return { ok: false, message: "无法设置当前播放音乐。" };
        }
      });
    },
    moveToTrash(userId: string | null, id: string) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        try {
          await repository.moveToTrash(id);
          return { ok: true, message: "音乐已移入回收站。", trackId: id };
        } catch {
          return { ok: false, message: "无法将音乐移入回收站。" };
        }
      });
    },
    restore(userId: string | null, id: string) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        try {
          await repository.restore(id);
          return { ok: true, message: "音乐已恢复。", trackId: id };
        } catch {
          return { ok: false, message: "音乐恢复失败。" };
        }
      });
    },
    permanentlyDelete(userId: string | null, id: string) {
      return runProtectedAdminOperation(userId, adminUserId, async () => {
        try {
          const track = await repository.getById(id);
          await repository.permanentlyDelete(id);
          if (track) {
            await cleanupObsoleteMedia(
              isSystemMusicAudioPath(track.audioPath) ? [track.audioPath] : [],
              (path) => deleteMediaObject(path, "delete_asset_file"),
            );
            await cleanupObsoleteMedia(
              obsoleteSystemMediaPaths([track.coverPath], []),
              (path) => deleteMediaObject(path, "delete_asset_file"),
            );
          }
          return { ok: true, message: "音乐已永久删除。", trackId: id };
        } catch {
          return { ok: false, message: "音乐永久删除失败。" };
        }
      });
    },
  };
}
