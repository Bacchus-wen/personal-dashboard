import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/auth/api-admin";
import { getPhotoStorageService } from "@/lib/photos/server-storage";
import { parseProcessedPhotoFile } from "@/lib/photos/upload-request";
import type { PhotoUploadResult } from "@/lib/photos/types";

export async function POST(request: Request) {
  const access = await requireApiAdmin();
  if (!access.ok) {
    return NextResponse.json<PhotoUploadResult>(
      { ok: false, message: "没有权限执行此操作。" },
      { status: access.status },
    );
  }

  try {
    const formData = await request.formData();
    const parsed = await parseProcessedPhotoFile(formData.get("file"));
    if (!parsed.ok) {
      return NextResponse.json<PhotoUploadResult>(parsed, { status: 400 });
    }

    const photo = await getPhotoStorageService().createPhoto(
      parsed.bytes,
      parsed.originalFilename,
    );
    return NextResponse.json<PhotoUploadResult>({
      ok: true,
      message: "照片已上传为草稿。",
      photoId: photo.id,
    });
  } catch {
    return NextResponse.json<PhotoUploadResult>(
      { ok: false, message: "照片上传失败，请稍后重试。" },
      { status: 500 },
    );
  }
}
