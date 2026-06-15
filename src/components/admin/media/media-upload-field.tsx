"use client";

import Image from "next/image";
import {
  type ChangeEvent,
  type DragEvent,
  useRef,
  useState,
} from "react";

import { processMediaFile } from "@/lib/media/client-image";
import type {
  MediaPurpose,
  MediaUploadResult,
  MediaVariant,
} from "@/lib/media/types";

type MediaUploadFieldProps = {
  label: string;
  value: string;
  purpose: MediaPurpose;
  variant: MediaVariant;
  ownerId?: string | null;
  preview?: string;
  onUploaded(result: { path: string; publicUrl: string }): void;
};

type UploadState = "idle" | "processing" | "uploading" | "success" | "error";

const STATUS_LABELS: Record<UploadState, string> = {
  idle: "等待选择",
  processing: "正在处理",
  uploading: "正在上传",
  success: "上传成功",
  error: "上传失败",
};

function acceptForVariant(variant: MediaVariant) {
  return variant === "favicon"
    ? "image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml"
    : "image/jpeg,image/png,image/webp";
}

export function MediaUploadField({
  label,
  value,
  purpose,
  variant,
  ownerId = null,
  preview,
  onUploaded,
}: MediaUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [state, setState] = useState<UploadState>("idle");
  const [message, setMessage] = useState("");
  const busy = state === "processing" || state === "uploading";
  const isFavicon = variant === "favicon";
  const isAvatar = purpose === "site" && variant === "avatar";

  const upload = async (file: File) => {
    setState("processing");
    setMessage("");
    try {
      const processed = await processMediaFile(file, {
        favicon: isFavicon,
        avatar: isAvatar,
      });
      const formData = new FormData();
      formData.set("file", processed);
      formData.set("purpose", purpose);
      formData.set("variant", variant);
      if (ownerId) formData.set("ownerId", ownerId);

      setState("uploading");
      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as MediaUploadResult;
      if (!response.ok || !result.ok || !result.path || !result.publicUrl) {
        throw new Error(result.message || "媒体文件上传失败。");
      }

      setState("success");
      setMessage(result.message);
      onUploaded({ path: result.path, publicUrl: result.publicUrl });
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error ? error.message : "媒体文件上传失败。",
      );
    }
  };

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || busy) return;
    void upload(file);
  };

  const dropFile = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file || busy) return;
    void upload(file);
  };

  return (
    <section className="media-upload-field">
      <div className="media-upload-head">
        <div>
          <p className="eyebrow">MEDIA UPLOAD</p>
          <h3>{label}</h3>
        </div>
        <span className={`pill media-upload-status ${state}`}>
          {STATUS_LABELS[state]}
        </span>
      </div>

      <div
        className={`media-upload-dropzone${dragging ? " dragging" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={dropFile}
        role="button"
        tabIndex={0}
      >
        {preview ? (
          <Image
            alt={`${label} 预览`}
            className="media-upload-preview"
            height={84}
            src={preview}
            unoptimized
            width={112}
          />
        ) : (
          <div className="media-upload-preview empty">
            <span>未上传</span>
          </div>
        )}
        <div className="media-upload-copy">
          <strong>{busy ? "处理中，请稍候" : "点击或拖拽文件到这里"}</strong>
          <small>{value || "上传成功后会返回系统路径"}</small>
        </div>
        <input
          accept={acceptForVariant(variant)}
          disabled={busy}
          onChange={selectFile}
          ref={inputRef}
          type="file"
        />
      </div>

      {message ? (
        <p
          className={`admin-notice ${state === "success" ? "success brief" : "error"}`}
          role={state === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
