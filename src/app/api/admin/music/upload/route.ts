import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/auth/api-admin";
import { getMediaStorageService } from "@/lib/media/server-storage";
import {
  buildMusicAudioObjectPath,
  parseMusicUploadFile,
  validateMusicOwnerId,
  type MusicUploadResult,
} from "@/lib/music/upload";

function safeUploadErrorMessage(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  if (!message || /key|token|secret|session|authorization/i.test(message)) {
    return "MP3 文件上传失败，请稍后重试。";
  }

  return `MP3 文件上传失败：${message.slice(0, 160)}`;
}

export async function POST(request: Request) {
  const access = await requireApiAdmin();
  if (!access.ok) {
    return NextResponse.json<MusicUploadResult>(
      { ok: false, message: "没有权限执行此操作。" },
      { status: access.status },
    );
  }

  try {
    const formData = await request.formData();
    const trackId = validateMusicOwnerId(String(formData.get("trackId") ?? ""));
    if (!trackId) {
      return NextResponse.json<MusicUploadResult>(
        { ok: false, message: "请先保存音乐，再上传 MP3。" },
        { status: 400 },
      );
    }

    const parsed = await parseMusicUploadFile(formData.get("file"));
    if (!parsed.ok) {
      return NextResponse.json<MusicUploadResult>(parsed, { status: 400 });
    }

    const path = buildMusicAudioObjectPath({
      trackId,
      id: crypto.randomUUID(),
    });
    const uploaded = await getMediaStorageService().upload({
      path,
      bytes: parsed.data.bytes,
      contentType: parsed.data.file.type,
    });

    revalidatePath("/admin/music");
    return NextResponse.json<MusicUploadResult>({
      ok: true,
      message: "MP3 文件已上传。",
      path: uploaded.path,
      publicUrl: uploaded.publicUrl,
    });
  } catch (error) {
    console.error("Music upload failed", error);
    return NextResponse.json<MusicUploadResult>(
      { ok: false, message: safeUploadErrorMessage(error) },
      { status: 500 },
    );
  }
}
