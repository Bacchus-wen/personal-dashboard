"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useActionState, useEffect, useState } from "react";

import { PhotoImage } from "@/components/photos/photo-image";
import { ThemeSelect } from "@/components/ui/theme-select";
import { PHOTO_VISIBILITIES, PHOTO_VISIBILITY_LABELS } from "@/lib/photos/constants";
import { processPhotoFile } from "@/lib/photos/client-image";
import type { Photo, PhotoActionResult, PhotoUploadResult } from "@/lib/photos/types";
import { photoEditorFormKey } from "./photo-editor-state";

type Action = (
  previousState: PhotoActionResult,
  formData: FormData,
) => Promise<PhotoActionResult>;

const EMPTY_RESULT: PhotoActionResult = { ok: false, message: "" };

// Self-contained so it lives inside the form's `key={formKey}` subtree and
// re-initialises whenever the edited photo changes. The hidden input keeps the
// value in FormData on submit.
function VisibilityField({ value: initial }: { value: string }) {
  const [value, setValue] = useState<string>(initial);
  return (
    <ThemeSelect
      name="visibility"
      ariaLabel="状态"
      value={value}
      onChange={setValue}
      options={PHOTO_VISIBILITIES.map((visibility) => ({
        value: visibility,
        label: PHOTO_VISIBILITY_LABELS[visibility],
      }))}
    />
  );
}

export function PhotoEditor({
  action,
  photo,
  publicUrl,
}: {
  action: Action;
  photo: Photo;
  publicUrl: string;
}) {
  const router = useRouter();
  const [replacementMessage, setReplacementMessage] = useState("");
  const [replacing, setReplacing] = useState(false);
  const [state, formAction, pending] = useActionState(action, EMPTY_RESULT);
  const formKey = photoEditorFormKey({
    visibility: photo.visibility,
    sortOrder: photo.sortOrder,
  });

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [router, state]);

  const replace = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setReplacing(true);
    setReplacementMessage("");
    try {
      const processed = await processPhotoFile(file);
      const formData = new FormData();
      formData.set("file", processed);
      const response = await fetch(`/api/admin/photos/${photo.id}/replace`, {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as PhotoUploadResult;
      setReplacementMessage(result.message);
      if (response.ok && result.ok) router.refresh();
    } catch (error) {
      setReplacementMessage(
        error instanceof Error ? error.message : "照片替换失败。",
      );
    } finally {
      setReplacing(false);
    }
  };

  return (
    <div className="work-editor">
      <section className="work-editor-main glass">
        <p className="eyebrow">PHOTO PREVIEW</p>
        <h2>{photo.originalFilename}</h2>
        <PhotoImage
          adminFilename={photo.originalFilename}
          alt="照片完整预览"
          className="photo-editor-preview"
          src={publicUrl}
        />
        <div className="public-polaroid photo-editor-polaroid">
          <PhotoImage alt="拍立得预览" src={publicUrl} />
        </div>
      </section>
      <aside className="work-editor-sidebar">
        <form action={formAction} className="plan-editor-settings glass" key={formKey}>
          <p className="eyebrow">SETTINGS</p>
          <h2>发布设置</h2>
          <div className="editor-field-grid">
            <label className="editor-field">
              <span>状态</span>
              <VisibilityField value={photo.visibility} />
              {state.fieldErrors?.visibility?.[0] ? (
                <small className="editor-field-error">
                  {state.fieldErrors.visibility[0]}
                </small>
              ) : null}
            </label>
            <label className="editor-field">
              <span>排序</span>
              <input defaultValue={photo.sortOrder} min={0} name="sortOrder" type="number" />
              {state.fieldErrors?.sortOrder?.[0] ? (
                <small className="editor-field-error">
                  {state.fieldErrors.sortOrder[0]}
                </small>
              ) : null}
            </label>
          </div>
          {state.message ? <p className="admin-notice" role="status">{state.message}</p> : null}
          <button className="btn primary" disabled={pending} type="submit">
            {pending ? "正在保存..." : "保存设置"}
          </button>
        </form>
        <section className="plan-editor-settings glass">
          <p className="eyebrow">REPLACE</p>
          <h2>替换照片</h2>
          <p className="muted">新文件成功写入后，系统才会清理旧文件。</p>
          <label className="btn">
            {replacing ? "正在替换..." : "选择替换照片"}
            <input
              accept="image/jpeg,image/png,image/webp"
              disabled={replacing}
              onChange={replace}
              type="file"
            />
          </label>
          {replacementMessage ? (
            <p className="admin-notice" role="status">{replacementMessage}</p>
          ) : null}
          <Link className="btn" href="/admin/photos">返回照片管理</Link>
        </section>
      </aside>
    </div>
  );
}
