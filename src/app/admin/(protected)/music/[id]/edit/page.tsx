import Link from "next/link";
import { notFound } from "next/navigation";

import { updateMusicTrackAction } from "@/app/admin/(protected)/music/actions";
import { MusicEditor } from "@/components/admin/music/music-editor";
import { getMusicTrackRepository } from "@/lib/music/server-repository";

export default async function EditMusicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const track = await getMusicTrackRepository().getById(id);
  if (!track || track.deletedAt) notFound();

  return (
    <main className="admin-workspace">
      <header className="admin-workspace-head">
        <div>
          <p className="eyebrow">EDIT MUSIC</p>
          <h1>{track.title}</h1>
          <p className="muted">保存后首页播放器会同步更新。</p>
        </div>
        <Link className="btn" href="/admin/music">
          返回音乐列表
        </Link>
      </header>
      <MusicEditor action={updateMusicTrackAction.bind(null, track.id)} track={track} />
    </main>
  );
}
