"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type MouseEvent, useActionState, useEffect, useMemo, useState } from "react";

import { CompactMediaUpload } from "@/components/admin/media/compact-media-upload";
import { CollectionCard } from "@/components/collections/collection-card";
import { ThemeSelect } from "@/components/ui/theme-select";
import {
  publicMediaUrlForPath,
  resolveMediaDisplayUrl,
} from "@/lib/media/display";
import {
  COLLECTION_CONTENT_TYPES,
  COLLECTION_CONTENT_TYPE_LABELS,
  RECOMMENDATION_VISIBILITIES,
  RECOMMENDATION_VISIBILITY_LABELS,
} from "@/lib/collections/constants";
import type { Collection, CollectionActionResult, CollectionFieldErrors, CollectionInput } from "@/lib/collections/types";

type Action = (previousState: CollectionActionResult, formData: FormData) => Promise<CollectionActionResult>;
type Values = { title: string; contentType: string; sourceName: string; summary: string; externalUrl: string; coverPath: string; tagsText: string; visibility: string; featured: boolean; sortOrder: string };
const EMPTY_RESULT: CollectionActionResult = { ok: false, message: "" };

function valuesFromCollection(collection: Collection | null): Values {
  return { title: collection?.title ?? "", contentType: collection?.contentType ?? "article", sourceName: collection?.sourceName ?? "", summary: collection?.summary ?? "", externalUrl: collection?.externalUrl ?? "", coverPath: collection?.coverPath ?? "", tagsText: collection?.tags.join(", ") ?? "", visibility: collection?.visibility ?? "draft", featured: collection?.featured ?? false, sortOrder: String(collection?.sortOrder ?? 0) };
}

function fieldError(errors: CollectionFieldErrors | undefined, field: keyof CollectionInput) {
  return errors?.[field]?.[0] ?? "";
}

export function CollectionEditor({ action, collection = null }: { action: Action; collection?: Collection | null }) {
  const router = useRouter();
  const initialValues = useMemo(() => valuesFromCollection(collection), [collection]);
  const [values, setValues] = useState(initialValues);
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(initialValues));
  const uploadDisabledHint = collection ? undefined : "Save the collection once before uploading a cover.";
  const dirty = JSON.stringify(values) !== savedSnapshot;
  const tags = values.tagsText.split(",").map((tag) => tag.trim()).filter(Boolean);
  const preview: Collection = {
    id: collection?.id ?? "preview", title: values.title, contentType: values.contentType === "video" ? "video" : "article", sourceName: values.sourceName || null, summary: values.summary || null, externalUrl: values.externalUrl || null, coverPath: values.coverPath || null, tags, visibility: values.visibility === "public" ? "public" : values.visibility === "archived" ? "archived" : "draft", featured: values.featured, sortOrder: Number(values.sortOrder) || 0, deletedAt: null, createdAt: collection?.createdAt ?? "", updatedAt: collection?.updatedAt ?? "",
  };
  const submit = async (previousState: CollectionActionResult, formData: FormData) => {
    const result = await action(previousState, formData);
    if (result.ok) {
      setSavedSnapshot(JSON.stringify(values));
      router.replace(result.collectionId ? `/admin/collections/${result.collectionId}/edit` : "/admin/collections");
    }
    return result;
  };
  const [state, formAction, pending] = useActionState(submit, EMPTY_RESULT);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (field: keyof Values) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = event.target instanceof HTMLInputElement && event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setValues((current) => ({ ...current, [field]: value }));
  };
  const setField = (field: keyof Values) => (value: string) =>
    setValues((current) => ({ ...current, [field]: value }));
  const confirmLeave = (event: MouseEvent<HTMLAnchorElement>) => {
    if (dirty && !window.confirm("当前修改尚未保存，确定离开吗？")) event.preventDefault();
  };

  return (
    <form action={formAction} className="work-editor">
      <input name="tags" type="hidden" value={JSON.stringify(tags)} />
      <section className="work-editor-main glass">
        <div className="plan-editor-section-head"><div><p className="eyebrow">COLLECTION CONTENT</p><h2>收藏内容</h2></div></div>
        <EditorField error={fieldError(state.fieldErrors, "title")} label="标题"><input name="title" onChange={update("title")} value={values.title} /></EditorField>
        <EditorField error={fieldError(state.fieldErrors, "contentType")} label="内容类型"><ThemeSelect name="contentType" ariaLabel="内容类型" value={values.contentType} onChange={setField("contentType")} options={COLLECTION_CONTENT_TYPES.map((type) => ({ value: type, label: COLLECTION_CONTENT_TYPE_LABELS[type] }))} /></EditorField>
        <EditorField error={fieldError(state.fieldErrors, "sourceName")} label="来源名称"><input name="sourceName" onChange={update("sourceName")} value={values.sourceName} /></EditorField>
        <EditorField error={fieldError(state.fieldErrors, "summary")} label="摘要"><textarea name="summary" onChange={update("summary")} rows={4} value={values.summary} /></EditorField>
        <EditorField error={fieldError(state.fieldErrors, "externalUrl")} label="原网站 HTTPS 链接"><input name="externalUrl" onChange={update("externalUrl")} value={values.externalUrl} /></EditorField>
        <EditorField error={fieldError(state.fieldErrors, "coverPath")} label="封面路径或 HTTPS URL"><input name="coverPath" onChange={update("coverPath")} value={values.coverPath} /><CompactMediaUpload disabledHint={uploadDisabledHint} label="Upload or replace cover" onClear={() => setValues((current) => ({ ...current, coverPath: "" }))} onUploaded={({ path }) => setValues((current) => ({ ...current, coverPath: path }))} ownerId={collection?.id} preview={resolveMediaDisplayUrl(values.coverPath, publicMediaUrlForPath) ?? undefined} purpose="collections" value={values.coverPath} variant="cover" /></EditorField>
        <EditorField error={fieldError(state.fieldErrors, "tags")} label="标签（使用逗号分隔）"><input onChange={update("tagsText")} value={values.tagsText} /></EditorField>
      </section>
      <aside className="work-editor-sidebar">
        <section className="plan-editor-settings glass"><p className="eyebrow">LIVE PREVIEW</p><h2>卡片预览</h2><CollectionCard collection={preview} preview /></section>
        <section className="plan-editor-settings glass">
          <p className="eyebrow">SETTINGS</p><h2>发布设置</h2>
          <div className="editor-field-grid">
            <EditorField error={fieldError(state.fieldErrors, "visibility")} label="可见性"><ThemeSelect name="visibility" ariaLabel="可见性" value={values.visibility} onChange={setField("visibility")} options={RECOMMENDATION_VISIBILITIES.map((visibility) => ({ value: visibility, label: RECOMMENDATION_VISIBILITY_LABELS[visibility] }))} /></EditorField>
            <EditorField error={fieldError(state.fieldErrors, "sortOrder")} label="排序"><input min={0} name="sortOrder" onChange={update("sortOrder")} type="number" value={values.sortOrder} /></EditorField>
            <label className="editor-check"><input checked={values.featured} name="featured" onChange={update("featured")} type="checkbox" />进入首页推荐候选</label>
          </div>
        </section>
        <section className="plan-editor-save glass">
          <strong>{dirty ? "有未保存修改" : "当前内容已保存"}</strong>
          <p className="muted">{values.visibility === "public" ? "公开收藏必须填写摘要和 HTTPS 原网站链接。" : "草稿和归档允许暂时缺少公开字段。"}</p>
          {state.message ? <p className={`admin-notice ${state.ok ? "success brief" : "error"}`} role={state.ok ? "status" : "alert"}>{state.message}</p> : null}
          <button className="btn primary" disabled={pending} type="submit">{pending ? "正在保存..." : "保存收藏"}</button>
          <Link className="btn" href="/admin/collections" onClick={confirmLeave}>返回收藏列表</Link>
        </section>
      </aside>
    </form>
  );
}

function EditorField({ children, error, label }: { children: React.ReactNode; error: string; label: string }) {
  return <label className="editor-field"><span>{label}</span>{children}{error ? <small className="editor-field-error">{error}</small> : null}</label>;
}
