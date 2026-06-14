"use client";

import { useEffect, useRef } from "react";

import { PhotoImage } from "./photo-image";
import type { PublicPhoto } from "@/lib/photos/types";

export function PhotoLightbox({
  photo,
  onClose,
  trigger,
}: {
  photo: PublicPhoto;
  onClose: () => void;
  trigger: HTMLElement | null;
}) {
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialog.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      trigger?.focus();
    };
  }, [onClose, trigger]);

  return (
    <div
      aria-label="照片灯箱"
      aria-modal="true"
      className="photo-lightbox"
      ref={dialog}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
      tabIndex={-1}
    >
      <div className="photo-lightbox-panel">
        <PhotoImage alt="公开照片" src={photo.publicUrl} />
      </div>
    </div>
  );
}
