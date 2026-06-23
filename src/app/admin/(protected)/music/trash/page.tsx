import Link from "next/link";

import { MusicTrashCard } from "@/components/admin/music/music-trash-card";
import { getMusicTrackRepository } from "@/lib/music/server-repository";

export default async function AdminMusicTrashPage() {
  let tracks = null;
  try {
    tracks = await getMusicTrackRepository().listTrash();
  } catch {
    tracks = null;
  }

  return (
    <main className="admin-workspace">
      <header className="admin-workspace-head">
        <div>
          <p className="eyebrow">MUSIC TRASH</p>
          <h1>音乐回收站</h1>
          <p className="muted">恢复后不会自动设为当前播放；永久删除无法撤销。</p>
        </div>
        <Link className="btn" href="/admin/music">
          返回音乐库
        </Link>
      </header>
      {!tracks ? (
        <section className="admin-empty glass">
          <h2>回收站暂时无法加载</h2>
          <p className="muted">请确认已执行音乐库数据库迁移。</p>
        </section>
      ) : tracks.length ? (
        <section className="trash-plan-grid">
          {tracks.map((track) => (
            <MusicTrashCard key={track.id} track={track} />
          ))}
        </section>
      ) : (
        <section className="admin-empty glass">
          <h2>回收站是空的</h2>
          <p className="muted">移入回收站的音乐会显示在这里。</p>
        </section>
      )}
    </main>
  );
}
