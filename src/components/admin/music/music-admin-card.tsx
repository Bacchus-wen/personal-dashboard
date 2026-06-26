"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import {
  activateMusicTrackAction,
  moveMusicTrackToTrashAction,
} from "@/app/admin/(protected)/music/actions";
import type { MusicTrack } from "@/lib/music/types";

export function MusicAdminCard({ track }: { track: MusicTrack }) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <article className="admin-list-row">
      <div className="admin-list-row-main">
        <div>
          <p className="eyebrow">{track.isActive ? "NOW PLAYING" : "MUSIC TRACK"}</p>
          <h2>{track.title}</h2>
          <p className="muted">{track.artist ?? "未填写艺术家"}</p>
        </div>
      </div>
      <div className="admin-list-row-meta">
        {track.isActive ? <span className="pill">当前播放</span> : null}
        <span className="pill">MP3</span>
        <span className="pill mono">#{track.sortOrder}</span>
      </div>
      <div className="admin-list-row-actions">
        <Link className="btn primary" href={`/admin/music/${track.id}/edit`}>
          编辑
        </Link>
        <button
          className="btn"
          disabled={pending || track.isActive}
          onClick={() =>
            startTransition(async () =>
              setMessage((await activateMusicTrackAction(track.id)).message),
            )
          }
          type="button"
        >
          设为当前
        </button>
        <button
          className="btn danger"
          disabled={pending}
          onClick={() =>
            startTransition(async () =>
              setMessage((await moveMusicTrackToTrashAction(track.id)).message),
            )
          }
          type="button"
        >
          移入回收站
        </button>
      </div>
      {message ? <p className="admin-notice" role="status">{message}</p> : null}
    </article>
  );
}
