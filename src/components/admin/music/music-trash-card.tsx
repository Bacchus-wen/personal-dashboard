"use client";

import { useRef, useState, useTransition } from "react";

import {
  permanentlyDeleteMusicTrackAction,
  restoreMusicTrackAction,
} from "@/app/admin/(protected)/music/actions";
import type { MusicTrack } from "@/lib/music/types";

export function MusicTrashCard({ track }: { track: MusicTrack }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <article className="trash-plan-card glass card">
      <div>
        <p className="eyebrow">TRASHED MUSIC</p>
        <h2>{track.title}</h2>
        <p className="muted">{track.artist ?? "未填写艺术家"}</p>
      </div>
      <div className="admin-plan-actions">
        <button
          className="btn primary"
          disabled={pending}
          onClick={() =>
            startTransition(async () =>
              setMessage((await restoreMusicTrackAction(track.id)).message),
            )
          }
          type="button"
        >
          {pending ? "正在恢复..." : "恢复"}
        </button>
        <button
          className="btn danger"
          disabled={pending}
          onClick={() => dialog.current?.showModal()}
          type="button"
        >
          永久删除
        </button>
      </div>
      {message ? (
        <p className="admin-notice success" role="status">
          {message}
        </p>
      ) : null}
      <dialog className="delete-dialog" ref={dialog}>
        <h2>永久删除“{track.title}”？</h2>
        <p className="muted">此操作会删除记录和已上传的 MP3，无法撤销。</p>
        <div className="delete-dialog-actions">
          <button
            className="btn"
            onClick={() => dialog.current?.close()}
            type="button"
          >
            取消
          </button>
          <button
            className="btn danger"
            onClick={() =>
              startTransition(async () => {
                setMessage(
                  (await permanentlyDeleteMusicTrackAction(track.id)).message,
                );
                dialog.current?.close();
              })
            }
            type="button"
          >
            确认永久删除
          </button>
        </div>
      </dialog>
    </article>
  );
}
