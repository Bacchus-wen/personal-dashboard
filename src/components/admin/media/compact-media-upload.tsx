"use client";

import { MediaUploadField } from "./media-upload-field";
import type { MediaPurpose, MediaVariant } from "@/lib/media/types";

type Props = {
  label: string;
  value: string;
  purpose: MediaPurpose;
  variant: MediaVariant;
  ownerId?: string | null;
  preview?: string;
  disabledHint?: string;
  multiple?: boolean;
  onUploaded(result: { path: string; publicUrl: string }): void;
  onClear?(): void;
};

export async function deleteUnsavedMediaPath(path: string) {
  const response = await fetch("/api/admin/media/delete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ path }),
  });
  return response.ok;
}

export function CompactMediaUpload({
  disabledHint,
  onClear,
  ...upload
}: Props) {
  if (disabledHint) {
    return <p className="media-upload-hint muted">{disabledHint}</p>;
  }

  return (
    <div className="compact-media-upload">
      <MediaUploadField {...upload} />
      {onClear && upload.value ? (
        <button className="btn" onClick={onClear} type="button">
          清除图片
        </button>
      ) : null}
    </div>
  );
}
