import Link from "next/link";

import { MusicAdminCard } from "@/components/admin/music/music-admin-card";
import { getMusicTrackRepository } from "@/lib/music/server-repository";

export default async function AdminMusicPage() {
  let tracks = null;
  try {
    tracks = await getMusicTrackRepository().listAdmin();
  } catch {
    tracks = null;
  }

  return (
    <main className="admin-workspace">
      <header className="admin-workspace-head">
        <div>
          <p className="eyebrow">MUSIC LIBRARY</p>
          <h1>音乐库</h1>
          <p className="muted">上传 MP3，并选择一首作为首页当前播放音乐。</p>
        </div>
        <div className="admin-workspace-actions">
          <Link className="btn" href="/admin">
            返回后台
          </Link>
          <Link className="btn" href="/admin/music/trash">
            回收站
          </Link>
          <Link className="btn primary" href="/admin/music/new">
            新建音乐
          </Link>
        </div>
      </header>
      {!tracks ? (
        <section className="admin-empty glass">
          <h2>音乐库暂时无法加载</h2>
          <p className="muted">请确认已执行音乐库数据库迁移。</p>
        </section>
      ) : tracks.length ? (
        <section className="admin-plan-grid">
          {tracks.map((track) => (
            <MusicAdminCard key={track.id} track={track} />
          ))}
        </section>
      ) : (
        <section className="admin-empty glass">
          <h2>还没有音乐</h2>
          <p className="muted">上传第一首 MP3 后，首页音乐模块会显示真实播放器。</p>
        </section>
      )}
    </main>
  );
}
