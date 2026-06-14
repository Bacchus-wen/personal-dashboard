"use client";

import Link from "next/link";
import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { PhotoImage } from "./photo-image";
import { PhotoLightbox } from "./photo-lightbox";
import {
  type BoardPoint,
  clampBoardPosition,
  createBoardPositions,
  hasDragged,
} from "@/lib/photos/board";
import { groupPhotos, polaroidTransform, totalPhotoGroups } from "@/lib/photos/stack";
import type { PublicPhoto } from "@/lib/photos/types";

type LightboxState = { photo: PublicPhoto; trigger: HTMLElement | null } | null;
type BoardPhotoState = BoardPoint & { z: number };
type BoardState = Record<string, BoardPhotoState>;
type DragState = {
  id: string;
  pointerId: number;
  startPointer: BoardPoint;
  offset: BoardPoint;
  cardWidth: number;
  cardHeight: number;
  trigger: HTMLElement;
};

function estimatedCardSize(stageWidth: number) {
  const width =
    stageWidth <= 720
      ? Math.min(stageWidth * 0.72, 270)
      : Math.min(Math.max(stageWidth * 0.27, 180), 300);
  return { width, height: width * 1.25 };
}

export function PublicAlbum({
  photos,
  group,
  failed,
}: {
  photos: PublicPhoto[];
  group: number;
  failed: boolean;
}) {
  const current = useMemo(() => groupPhotos(photos, group), [photos, group]);
  const currentIds = useMemo(() => current.map((photo) => photo.id), [current]);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [boardOverrides, setBoardOverrides] = useState<BoardState>({});
  const [topId, setTopId] = useState(current[0]?.id ?? "");
  const [lightbox, setLightbox] = useState<LightboxState>(null);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const updateSize = () => {
      const rect = stage.getBoundingClientRect();
      setStageSize({ width: rect.width, height: rect.height });
    };
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const baseBoard = useMemo<BoardState>(() => {
    if (!current.length || stageSize.width <= 0 || stageSize.height <= 0) return {};
    const card = estimatedCardSize(stageSize.width);
    const positions = createBoardPositions(
      currentIds,
      stageSize.width,
      stageSize.height,
      card.width,
      card.height,
      `${group}:${stageSize.width}:${stageSize.height}`,
    );
    return currentIds.reduce<BoardState>((next, id, index) => {
      next[id] = { ...positions[id], z: index + 1 };
      return next;
    }, {});
  }, [current.length, currentIds, group, stageSize.height, stageSize.width]);
  const board = useMemo<BoardState>(
    () => ({ ...baseBoard, ...boardOverrides }),
    [baseBoard, boardOverrides],
  );

  if (failed) {
    return <section className="admin-empty glass"><h2>相册暂时无法加载</h2><p className="muted">请稍后刷新页面。</p></section>;
  }
  if (!photos.length) {
    return <section className="admin-empty glass"><h2>相册还是空的</h2><p className="muted">公开照片会在这里组成拍立得堆叠。</p></section>;
  }

  const totalGroups = totalPhotoGroups(photos.length);
  const visibleTopId = currentIds.includes(topId) ? topId : currentIds[0];
  const openPhoto = (photo: PublicPhoto, trigger: HTMLElement) => {
    setLightbox({
      photo,
      trigger,
    });
  };
  const raisePhoto = (id: string) => {
    setTopId(id);
    setBoardOverrides((currentOverrides) => {
      const currentBoard = { ...baseBoard, ...currentOverrides };
      const item = currentBoard[id];
      if (!item) return currentOverrides;
      const maxZ = Math.max(0, ...Object.values(currentBoard).map((value) => value.z));
      return {
        ...currentOverrides,
        [id]: { ...item, z: maxZ + 1 },
      };
    });
  };
  const handlePointerDown = (
    photo: PublicPhoto,
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    const stage = stageRef.current;
    const position = board[photo.id];
    if (!stage || !position) return;

    const stageRect = stage.getBoundingClientRect();
    const cardRect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      id: photo.id,
      pointerId: event.pointerId,
      startPointer: { x: event.clientX, y: event.clientY },
      offset: {
        x: event.clientX - stageRect.left - position.x,
        y: event.clientY - stageRect.top - position.y,
      },
      cardWidth: cardRect.width,
      cardHeight: cardRect.height,
      trigger: event.currentTarget,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    raisePhoto(photo.id);
  };
  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !stage) return;

    const stageRect = stage.getBoundingClientRect();
    const next = clampBoardPosition(
      {
        x: event.clientX - stageRect.left - drag.offset.x,
        y: event.clientY - stageRect.top - drag.offset.y,
      },
      stageRect.width,
      stageRect.height,
      drag.cardWidth,
      drag.cardHeight,
    );
    setBoardOverrides((currentOverrides) => ({
      ...currentOverrides,
      [drag.id]: { ...board[drag.id], ...currentOverrides[drag.id], ...next },
    }));
  };
  const handlePointerUp = (photo: PublicPhoto, event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (!hasDragged(drag.startPointer, { x: event.clientX, y: event.clientY })) {
      openPhoto(photo, drag.trigger);
    }
  };
  const handleKeyDown = (
    photo: PublicPhoto,
    event: KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openPhoto(photo, event.currentTarget);
  };

  return (
    <section className="public-album" aria-label="公开照片相册">
      <div className="public-album-stage" ref={stageRef}>
        {current.map((photo, index) => {
          const transform = polaroidTransform(photo.id);
          const position = board[photo.id] ?? {
            x: stageSize.width / 2,
            y: stageSize.height / 2,
            z: index + 1,
          };
          const style = {
            "--photo-x": `${position.x}px`,
            "--photo-y": `${position.y}px`,
            "--photo-rotate": `${transform.rotate}deg`,
            zIndex: position.z,
          } as CSSProperties;
          return (
            <button
              aria-label={`打开照片 ${index + 1}`}
              className={`public-polaroid ${photo.id === visibleTopId ? "is-top" : ""}`}
              key={photo.id}
              onClick={(event) => event.preventDefault()}
              onKeyDown={(event) => handleKeyDown(photo, event)}
              onPointerCancel={() => {
                dragRef.current = null;
              }}
              onPointerDown={(event) => handlePointerDown(photo, event)}
              onPointerMove={handlePointerMove}
              onPointerUp={(event) => handlePointerUp(photo, event)}
              style={style}
              type="button"
            >
              <PhotoImage alt="" src={photo.publicUrl} />
            </button>
          );
        })}
      </div>
      <nav className="public-album-controls" aria-label="相册分组">
        {group > 1 ? <Link className="btn" href={`/album?group=${group - 1}`}>上一组</Link> : <span />}
        <span className="pill mono">{group} / {totalGroups}</span>
        {group < totalGroups ? <Link className="btn" href={`/album?group=${group + 1}`}>下一组</Link> : <span />}
      </nav>
      {lightbox ? <PhotoLightbox onClose={closeLightbox} photo={lightbox.photo} trigger={lightbox.trigger} /> : null}
    </section>
  );
}
