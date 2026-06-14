"use client";

import { useState } from "react";

export function PhotoImage({
  src,
  alt,
  adminFilename,
  className = "",
}: {
  src: string;
  alt: string;
  adminFilename?: string;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === src;

  if (failed) {
    return (
      <div className={`photo-fallback ${className}`} role="img" aria-label={alt}>
        <span>照片暂时无法显示</span>
        {adminFilename ? <small>{adminFilename}</small> : null}
      </div>
    );
  }

  return (
    // Supabase public image URLs are configured at runtime.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailedSrc(src)}
      src={src}
    />
  );
}
