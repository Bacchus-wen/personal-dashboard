"use client";

import Link from "next/link";
import { type ChangeEvent, useRef, useState } from "react";

import {
  processPhotoFile,
  validateClientPhotoSelection,
} from "@/lib/photos/client-image";
import { PHOTO_UPLOAD_CONCURRENCY } from "@/lib/photos/constants";
import type { PhotoUploadResult } from "@/lib/photos/types";

type QueueStatus = "queued" | "processing" | "uploading" | "success" | "error";

type QueueItem = {
  id: string;
  file: File;
  status: QueueStatus;
  message: string;
  retryable: boolean;
};

const STATUS_LABELS: Record<QueueStatus, string> = {
  queued: "等待处理",
  processing: "正在转换为 WebP",
  uploading: "正在上传",
  success: "上传成功",
  error: "处理失败",
};

export function PhotoUploadQueue() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const pendingItems = useRef<QueueItem[]>([]);
  const activeWorkers = useRef(0);

  const update = (id: string, values: Partial<QueueItem>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...values } : item)),
    );
  };

  const processOne = async (item: QueueItem) => {
    try {
      update(item.id, { status: "processing", message: "" });
      const processed = await processPhotoFile(item.file);
      update(item.id, { status: "uploading" });
      const formData = new FormData();
      formData.set("file", processed);
      const response = await fetch("/api/admin/photos/upload", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as PhotoUploadResult;
      if (!response.ok || !result.ok) {
        throw new Error(result.message || "照片上传失败。");
      }
      update(item.id, { status: "success", message: result.message });
    } catch (error) {
      update(item.id, {
        status: "error",
        message: error instanceof Error ? error.message : "照片处理失败。",
        retryable: true,
      });
    }
  };

  const pumpQueue = () => {
    while (
      activeWorkers.current < PHOTO_UPLOAD_CONCURRENCY &&
      pendingItems.current.length
    ) {
      const item = pendingItems.current.shift();
      if (!item) return;
      activeWorkers.current += 1;
      void processOne(item).finally(() => {
        activeWorkers.current -= 1;
        pumpQueue();
      });
    }
  };

  const enqueue = (queue: QueueItem[]) => {
    pendingItems.current.push(...queue);
    pumpQueue();
  };

  const selectFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const validation = validateClientPhotoSelection(files);
    const selected = files.map<QueueItem>((file, index) => ({
      id: crypto.randomUUID(),
      file,
      status: validation[index].ok ? "queued" : "error",
      message: validation[index].message,
      retryable: validation[index].ok,
    }));
    setItems(selected);
    pendingItems.current = [];
    enqueue(selected.filter((item) => item.status === "queued"));
    event.target.value = "";
  };

  const retry = (item: QueueItem) => {
    const queued = { ...item, status: "queued" as const, message: "" };
    update(item.id, queued);
    enqueue([queued]);
  };

  return (
    <section className="photo-upload-queue glass">
      <div className="plan-editor-section-head">
        <div>
          <p className="eyebrow">BATCH UPLOAD</p>
          <h2>选择照片</h2>
          <p className="muted">
            每次最多 10 张，浏览器会先缩放并转换为 WebP，再以最多 2
            个并发请求上传。
          </p>
        </div>
        <label className="btn primary">
          选择照片
          <input
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={selectFiles}
            type="file"
          />
        </label>
      </div>

      {items.length ? (
        <div className="photo-upload-list" aria-live="polite">
          {items.map((item) => (
            <article className="photo-upload-item card" key={item.id}>
              <div>
                <strong>{item.file.name}</strong>
                <p className="muted">
                  {(item.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <span className={`pill photo-upload-status ${item.status}`}>
                {STATUS_LABELS[item.status]}
              </span>
              {item.message ? (
                <p
                  className={`admin-notice ${
                    item.status === "success" ? "success brief" : "error"
                  }`}
                  role={item.status === "error" ? "alert" : "status"}
                >
                  {item.message}
                </p>
              ) : null}
              {item.status === "error" && item.retryable ? (
                <button className="btn" onClick={() => retry(item)} type="button">
                  重试
                </button>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">尚未选择照片。</p>
      )}

      <Link className="btn" href="/admin/photos">
        返回照片管理
      </Link>
    </section>
  );
}
