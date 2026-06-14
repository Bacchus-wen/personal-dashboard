import type { Metadata } from "next";

import { PageShell } from "@/components/chrome/page-shell";
import { PublicAlbum } from "@/components/photos/public-album";
import { getPhotoRepository } from "@/lib/photos/server-repository";
import { normalizePhotoGroup } from "@/lib/photos/validation";

export const metadata: Metadata = { title: "相册" };
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AlbumPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  let photos = null;
  try {
    photos = await getPhotoRepository().listPublic();
  } catch {
    photos = null;
  }
  const group = normalizePhotoGroup((await searchParams).group, photos?.length ?? 0);

  return (
    <PageShell
      eyebrow="ALBUM · 2026"
      title="最近的光影"
      description="点击照片将它放到最上面，再次点击打开完整照片。"
    >
      <PublicAlbum
        failed={!photos}
        group={group}
        key={group}
        photos={photos ?? []}
      />
    </PageShell>
  );
}
