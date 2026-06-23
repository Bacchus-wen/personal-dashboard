import Link from "next/link";

import { createMusicTrackAction } from "@/app/admin/(protected)/music/actions";
import { MusicEditor } from "@/components/admin/music/music-editor";

export default function NewMusicPage() {
  return (
    <main className="admin-workspace">
      <header className="admin-workspace-head">
        <div>
          <p className="eyebrow">NEW MUSIC</p>
          <h1>新建音乐</h1>
          <p className="muted">上传 MP3，保存后可设为首页当前播放。</p>
        </div>
        <Link className="btn" href="/admin/music">
          返回音乐列表
        </Link>
      </header>
      <MusicEditor action={createMusicTrackAction} />
    </main>
  );
}
