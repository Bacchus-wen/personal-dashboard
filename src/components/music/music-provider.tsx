"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { PauseIcon, PlayIcon } from "@/components/icons";
import {
  publicMediaUrlForPath,
  resolveMediaDisplayUrl,
} from "@/lib/media/display";
import type { MusicTrack } from "@/lib/music/types";

type MusicContextValue = {
  track: MusicTrack | null;
  playing: boolean;
  progress: number;
  coverUrl: string | null;
  toggle: () => void;
};

const MusicContext = createContext<MusicContextValue | null>(null);

export function useMusic() {
  const value = useContext(MusicContext);
  if (!value) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return value;
}

// Holds the single shared <audio> element. It lives in the root layout, which
// is NOT unmounted on App Router navigations, so playback continues across
// pages. The home widget and the global mini player both control this audio.
export function MusicProvider({
  track,
  children,
}: {
  track: MusicTrack | null;
  children: ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const coverUrl = track?.coverPath
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
    <MusicContext.Provider
      value={{ track, playing, progress, coverUrl, toggle }}
    >
      {children}
      {track ? (
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
      ) : null}
      <GlobalMiniPlayer />
    </MusicContext.Provider>
  );
}

// Compact player shown on every page except the homepage (which has the full
// music widget). Lets visitors keep controlling playback after navigating.
function GlobalMiniPlayer() {
  const pathname = usePathname();
  const { track, playing, progress, coverUrl, toggle } = useMusic();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  if (!track || pathname === "/") return null;

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    // The play/pause button keeps its own click behaviour.
    if ((event.target as HTMLElement).closest("button")) return;
    event.preventDefault();
    drag.current = {
      startX: event.clientX,
      startY: event.clientY,
      origX: pos.x,
      origY: pos.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const state = drag.current;
    if (!state) return;
    setPos({
      x: state.origX + (event.clientX - state.startX),
      y: state.origY + (event.clientY - state.startY),
    });
  }

  function endDrag() {
    drag.current = null;
  }

  return (
    <div
      className="mini-player glass"
      data-playing={playing}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <button
        type="button"
        className="mini-player-btn"
        onClick={toggle}
        aria-label={playing ? "暂停音乐" : "播放音乐"}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      {coverUrl ? (
        // User-configured cover can be local, Storage, or external.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="mini-player-cover" src={coverUrl} alt="" />
      ) : (
        <span className="mini-player-note" aria-hidden="true">
          ♪
        </span>
      )}
      <div className="mini-player-info">
        <strong>{track.title}</strong>
        <div className="mini-player-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
