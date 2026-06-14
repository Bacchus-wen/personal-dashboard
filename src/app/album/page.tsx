import type { Metadata } from "next";

import { FloatingTools } from "@/components/chrome/floating-tools";
import { PageAction } from "@/components/chrome/page-action";
import { TopNav } from "@/components/chrome/top-nav";
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
    <>
      <TopNav />
      <PageAction label="编辑" />
      <FloatingTools />
      <main className="page album-page">
        <header className="page-head album-page-head">
          <p className="eyebrow">ALBUM · 2026</p>
          <h1>最近的光影</h1>
          <p>拖动照片整理画板，单击照片查看完整光影。</p>
        </header>
        <PublicAlbum
          failed={!photos}
          group={group}
          key={group}
          photos={photos ?? []}
        />
      </main>
    </>
  );
}
