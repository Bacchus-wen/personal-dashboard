import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/auth/api-admin";
import { getPhotoRepository } from "@/lib/photos/server-repository";
import { getPhotoStorageService } from "@/lib/photos/server-storage";
import { parseProcessedPhotoFile } from "@/lib/photos/upload-request";
import type { PhotoUploadResult } from "@/lib/photos/types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await requireApiAdmin();
  if (!access.ok) {
    return NextResponse.json<PhotoUploadResult>(
      { ok: false, message: "没有权限执行此操作。" },
      { status: access.status },
    );
  }

  try {
    const { id } = await params;
    if (!UUID_PATTERN.test(id)) {
      return NextResponse.json<PhotoUploadResult>(
        { ok: false, message: "照片不存在。" },
        { status: 404 },
      );
    }

    const photo = await getPhotoRepository().getById(id);
    if (!photo) {
      return NextResponse.json<PhotoUploadResult>(
        { ok: false, message: "照片不存在。" },
        { status: 404 },
      );
    }

    const formData = await request.formData();
    const parsed = await parseProcessedPhotoFile(formData.get("file"));
    if (!parsed.ok) {
      return NextResponse.json<PhotoUploadResult>(parsed, { status: 400 });
    }

    const updated = await getPhotoStorageService().replacePhoto(
      photo,
      parsed.bytes,
      parsed.originalFilename,
    );
    return NextResponse.json<PhotoUploadResult>({
      ok: true,
      message: "照片已替换。",
      photoId: updated.id,
    });
  } catch {
    return NextResponse.json<PhotoUploadResult>(
      { ok: false, message: "照片替换失败，请稍后重试。" },
      { status: 500 },
    );
  }
}
