"use client";

import Link from "next/link";
import { useState } from "react";

import { MediaUploadField } from "@/components/admin/media/media-upload-field";
import type { MediaDeleteResult } from "@/lib/media/types";

type UploadedMedia = {
  path: string;
  publicUrl: string;
};

export default function AdminMediaTestPage() {
  const [webp, setWebp] = useState<UploadedMedia | null>(null);
  const [favicon, setFavicon] = useState<UploadedMedia | null>(null);

  return (
    <main className="admin-workspace">
      <header className="admin-workspace-head">
        <div>
          <p className="eyebrow">MEDIA FOUNDATION</p>
          <h1>媒体上传内部测试</h1>
          <p className="muted">
            这个页面只验证共享上传基础设施，不会自动保存任何业务表单。
          </p>
        </div>
        <div className="admin-workspace-actions">
          <Link className="btn" href="/admin/photos/cleanup">
            查看清理任务
          </Link>
          <Link className="btn" href="/admin">
            返回后台
          </Link>
        </div>
      </header>

      <section className="media-test-grid">
        <article className="plan-editor-settings glass">
          <MediaUploadField
            label="WebP 测试图片"
            onUploaded={setWebp}
            preview={webp?.publicUrl}
            purpose="test"
            value={webp?.path ?? ""}
            variant="test"
          />
          <MediaResultCard media={webp} onDeleted={() => setWebp(null)} />
        </article>
        <article className="plan-editor-settings glass">
          <MediaUploadField
            label="Favicon 测试文件"
            onUploaded={setFavicon}
            preview={favicon?.publicUrl}
            purpose="test"
            value={favicon?.path ?? ""}
            variant="favicon"
          />
          <MediaResultCard media={favicon} onDeleted={() => setFavicon(null)} />
        </article>
      </section>
    </main>
  );
}

function MediaResultCard({
  media,
  onDeleted,
}: {
  media: UploadedMedia | null;
  onDeleted(): void;
}) {
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState(false);

  const deleteObject = async () => {
    if (!media) return;
    setDeleting(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/media/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: media.path }),
      });
      const result = (await response.json()) as MediaDeleteResult;
      setMessage(result.message);
      if (response.ok && result.ok) onDeleted();
    } catch {
      setMessage("媒体文件删除失败，请稍后重试。");
    } finally {
      setDeleting(false);
    }
  };

  if (!media) {
    return <p className="muted">上传成功后会显示路径、公开 URL 和删除按钮。</p>;
  }

  return (
    <div className="media-result-card card">
      <p>
        <strong>Path</strong>
        <span className="mono">{media.path}</span>
      </p>
      <p>
        <strong>Public URL</strong>
        <span className="mono">{media.publicUrl}</span>
      </p>
      <button
        className="btn"
        disabled={deleting}
        onClick={deleteObject}
        type="button"
      >
        {deleting ? "正在删除..." : "删除测试文件"}
      </button>
      {message ? (
        <p className="admin-notice" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
