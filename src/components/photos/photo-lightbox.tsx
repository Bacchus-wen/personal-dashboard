"use client";

import { useEffect, useRef, useState } from "react";

import { PhotoImage } from "./photo-image";
import type { PublicPhoto } from "@/lib/photos/types";

export function PhotoLightbox({
  photos,
  initialIndex,
  onClose,
  trigger,
}: {
  photos: PublicPhoto[];
  initialIndex: number;
  onClose: () => void;
  trigger: HTMLElement | null;
}) {
  const [index, setIndex] = useState(initialIndex);
  const closeButton = useRef<HTMLButtonElement>(null);
  const photo = photos[index];

  useEffect(() => {
    closeButton.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") {
        setIndex((current) => (current - 1 + photos.length) % photos.length);
      }
      if (event.key === "ArrowRight") {
        setIndex((current) => (current + 1) % photos.length);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      trigger?.focus();
    };
  }, [onClose, photos.length, trigger]);

  if (!photo) return null;

  return (
    <div
      aria-label="照片灯箱"
      aria-modal="true"
      className="photo-lightbox"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
    >
      <div className="photo-lightbox-panel">
        <PhotoImage alt={`公开照片 ${index + 1}`} src={photo.publicUrl} />
        <div className="photo-lightbox-controls">
          <button className="btn" onClick={() => setIndex((current) => (current - 1 + photos.length) % photos.length)} type="button">
            上一张
          </button>
          <span className="pill mono">{index + 1} / {photos.length}</span>
          <button className="btn" onClick={() => setIndex((current) => (current + 1) % photos.length)} type="button">
            下一张
          </button>
          <button className="btn primary" onClick={onClose} ref={closeButton} type="button">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
