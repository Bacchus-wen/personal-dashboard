import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/auth/api-admin";
import { parseMediaUploadTarget } from "@/lib/media/api";
import { buildMediaObjectPath } from "@/lib/media/path";
import { getMediaStorageService } from "@/lib/media/server-storage";
import type { MediaUploadResult } from "@/lib/media/types";
import { parseMediaUploadFile } from "@/lib/media/validation";

export async function POST(request: Request) {
  const access = await requireApiAdmin();
  if (!access.ok) {
    return NextResponse.json<MediaUploadResult>(
      { ok: false, message: "没有权限执行此操作。" },
      { status: access.status },
    );
  }

  try {
    const formData = await request.formData();
    const target = parseMediaUploadTarget({
      purpose: String(formData.get("purpose") ?? ""),
      variant: String(formData.get("variant") ?? ""),
      ownerId: String(formData.get("ownerId") ?? ""),
    });
    if (!target.ok) {
      return NextResponse.json<MediaUploadResult>(target, { status: 400 });
    }

    const parsed = await parseMediaUploadFile(formData.get("file"), {
      favicon: target.favicon,
    });
    if (!parsed.ok) {
      return NextResponse.json<MediaUploadResult>(parsed, { status: 400 });
    }

    const path = buildMediaObjectPath({
      ...target.data,
      id: crypto.randomUUID(),
      extension: parsed.data.extension,
    });
    const uploaded = await getMediaStorageService().upload({
      path,
      bytes: parsed.data.bytes,
      contentType: parsed.data.file.type,
    });

    revalidatePath("/admin/media/test");
    return NextResponse.json<MediaUploadResult>({
      ok: true,
      message: "媒体文件已上传。",
      path: uploaded.path,
      publicUrl: uploaded.publicUrl,
    });
  } catch {
    return NextResponse.json<MediaUploadResult>(
      { ok: false, message: "媒体文件上传失败，请稍后重试。" },
      { status: 500 },
    );
  }
}
