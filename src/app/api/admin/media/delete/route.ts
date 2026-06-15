import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/auth/api-admin";
import { parseMediaDeletePath } from "@/lib/media/api";
import { getMediaStorageService } from "@/lib/media/server-storage";
import type { MediaDeleteResult } from "@/lib/media/types";

export async function POST(request: Request) {
  const access = await requireApiAdmin();
  if (!access.ok) {
    return NextResponse.json<MediaDeleteResult>(
      { ok: false, message: "没有权限执行此操作。" },
      { status: access.status },
    );
  }

  try {
    const body = (await request.json()) as { path?: unknown };
    const parsed = parseMediaDeletePath(body.path);
    if (!parsed.ok) {
      return NextResponse.json<MediaDeleteResult>(parsed, { status: 400 });
    }

    await getMediaStorageService().deleteObject(
      parsed.path,
      "delete_asset_file",
    );
    return NextResponse.json<MediaDeleteResult>({
      ok: true,
      message: "媒体文件已删除。",
    });
  } catch {
    return NextResponse.json<MediaDeleteResult>(
      { ok: false, message: "媒体文件删除失败，请稍后重试。" },
      { status: 500 },
    );
  }
}
