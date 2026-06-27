"use client";

import { PauseIcon, PlayIcon } from "@/components/icons";
import { useMusic } from "@/components/music/music-provider";

export function MusicWidget() {
  const { track, playing, progress, coverUrl, toggle } = useMusic();
  if (!track) return null;

  return (
    <section className="music-widget glass card lift" data-playing={playing}>
      {coverUrl ? (
        // User-configured media can be local, Storage, or external.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="music-cover" src={coverUrl} alt="" />
      ) : (
        <span aria-hidden="true">♪</span>
      )}
      <div>
        <strong>{track.title}</strong>
        <small>{track.artist ?? "Now playing"}</small>
        <div className="music-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
      <button
        type="button"
        aria-label={playing ? "暂停音乐" : "播放音乐"}
        onClick={toggle}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
    </section>
  );
}
