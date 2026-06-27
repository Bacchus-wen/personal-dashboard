"use client";

import { useRef, useState } from "react";

import {
  publicMediaUrlForPath,
  resolveMediaDisplayUrl,
} from "@/lib/media/display";
import type { MusicTrack } from "@/lib/music/types";

export function MusicWidget({ track }: { track: MusicTrack }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const coverUrl = track.coverPath
    ? resolveMediaDisplayUrl(track.coverPath, publicMediaUrlForPath)
    : null;

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      await audio.play();
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

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
        {playing ? "Ⅱ" : "▶"}
      </button>
      <audio
        ref={audioRef}
        src={publicMediaUrlForPath(track.audioPath)}
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          setProgress(
            audio.duration ? (audio.currentTime / audio.duration) * 100 : 0,
          );
        }}
      />
    </section>
  );
}
