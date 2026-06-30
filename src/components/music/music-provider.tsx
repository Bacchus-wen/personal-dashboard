"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

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
const MINI_PLAYER_POS_KEY = "mini-player-pos";

function GlobalMiniPlayer() {
  const pathname = usePathname();
  const { track, playing, progress, coverUrl, toggle } = useMusic();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  // Mirrors `pos` so endDrag can persist the latest value without waiting for a
  // re-render. The provider lives in the root layout (never unmounted), so the
  // in-memory position already survives client navigations; localStorage keeps
  // it consistent across full reloads and on pages opened directly.
  const latest = useRef(pos);
  const drag = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  useEffect(() => {
    // Mark mounted so the widget is portaled only on the client, and restore the
    // persisted position. Both run once after mount to avoid an SSR mismatch.
    /* eslint-disable react-hooks/set-state-in-effect */
    setMounted(true);
    try {
      const saved = localStorage.getItem(MINI_PLAYER_POS_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
        latest.current = parsed;
        setPos(parsed);
      }
    } catch {
      // Ignore unreadable/blocked storage.
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  if (!track || pathname === "/" || !mounted) return null;

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
    const next = {
      x: state.origX + (event.clientX - state.startX),
      y: state.origY + (event.clientY - state.startY),
    };
    latest.current = next;
    setPos(next);
  }

  function endDrag() {
    if (!drag.current) return;
    drag.current = null;
    try {
      localStorage.setItem(MINI_PLAYER_POS_KEY, JSON.stringify(latest.current));
    } catch {
      // Ignore storage failures (private mode, quota, etc.).
    }
  }

  // Portaled to <body> so its fixed position is anchored to the viewport and is
  // never trapped by a transformed/scrollable ancestor. Drag math uses
  // viewport-based clientX/clientY, so it stays put while the page scrolls.
  return createPortal(
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
    </div>,
    document.body,
  );
}
