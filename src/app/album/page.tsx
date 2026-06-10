import type { Metadata } from "next";
import { PageShell } from "@/components/chrome/page-shell";
import { AlbumStack } from "@/components/ui/album-stack";

export const metadata: Metadata = { title: "相册" };

export default function AlbumPage() {
  return <PageShell eyebrow="ALBUM · 2026" title="最近的光影" description="点击照片，将它放到最上面。"><AlbumStack /></PageShell>;
}
