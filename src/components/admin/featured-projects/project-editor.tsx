"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type MouseEvent, useActionState, useEffect, useMemo, useState } from "react";

import { FeaturedProjectCard } from "@/components/featured-projects/project-card";
import { RECOMMENDATION_VISIBILITIES, RECOMMENDATION_VISIBILITY_LABELS } from "@/lib/featured-projects/constants";
import type { FeaturedProject, FeaturedProjectActionResult, FeaturedProjectFieldErrors, FeaturedProjectInput } from "@/lib/featured-projects/types";

type Action = (previousState: FeaturedProjectActionResult, formData: FormData) => Promise<FeaturedProjectActionResult>;
type Values = { name: string; repositoryUrl: string; summary: string; recommendation: string; language: string; tagsText: string; starCount: string; starRecordedOn: string; visibility: string; featured: boolean; sortOrder: string };
const EMPTY_RESULT: FeaturedProjectActionResult = { ok: false, message: "" };
function valuesFromProject(project: FeaturedProject | null): Values {
  return { name: project?.name ?? "", repositoryUrl: project?.repositoryUrl ?? "", summary: project?.summary ?? "", recommendation: project?.recommendation ?? "", language: project?.language ?? "", tagsText: project?.tags.join(", ") ?? "", starCount: project?.starCount === null || project?.starCount === undefined ? "" : String(project.starCount), starRecordedOn: project?.starRecordedOn ?? "", visibility: project?.visibility ?? "draft", featured: project?.featured ?? false, sortOrder: String(project?.sortOrder ?? 0) };
}
function fieldError(errors: FeaturedProjectFieldErrors | undefined, field: keyof FeaturedProjectInput) { return errors?.[field]?.[0] ?? ""; }

export function ProjectEditor({ action, project = null }: { action: Action; project?: FeaturedProject | null }) {
  const router = useRouter();
  const initialValues = useMemo(() => valuesFromProject(project), [project]);
  const [values, setValues] = useState(initialValues);
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(initialValues));
  const dirty = JSON.stringify(values) !== savedSnapshot;
  const tags = values.tagsText.split(",").map((tag) => tag.trim()).filter(Boolean);
  const preview: FeaturedProject = { id: project?.id ?? "preview", name: values.name, repositoryUrl: values.repositoryUrl || null, summary: values.summary || null, recommendation: values.recommendation || null, language: values.language || null, tags, starCount: values.starCount && Number.isInteger(Number(values.starCount)) ? Number(values.starCount) : null, starRecordedOn: values.starRecordedOn || null, visibility: values.visibility === "public" ? "public" : values.visibility === "archived" ? "archived" : "draft", featured: values.featured, sortOrder: Number(values.sortOrder) || 0, deletedAt: null, createdAt: project?.createdAt ?? "", updatedAt: project?.updatedAt ?? "" };
  const submit = async (previousState: FeaturedProjectActionResult, formData: FormData) => { const result = await action(previousState, formData); if (result.ok) { setSavedSnapshot(JSON.stringify(values)); router.replace("/admin/projects"); } return result; };
  const [state, formAction, pending] = useActionState(submit, EMPTY_RESULT);
  useEffect(() => { if (!dirty) return; const warn = (event: BeforeUnloadEvent) => event.preventDefault(); window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [dirty]);
  const update = (field: keyof Values) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { const value = event.target instanceof HTMLInputElement && event.target.type === "checkbox" ? event.target.checked : event.target.value; setValues((current) => ({ ...current, [field]: value })); };
  const confirmLeave = (event: MouseEvent<HTMLAnchorElement>) => { if (dirty && !window.confirm("当前修改尚未保存，确定离开吗？")) event.preventDefault(); };
  return (
    <form action={formAction} className="work-editor">
      <input name="tags" type="hidden" value={JSON.stringify(tags)} />
      <section className="work-editor-main glass">
        <div className="plan-editor-section-head"><div><p className="eyebrow">PROJECT CONTENT</p><h2>优秀项目内容</h2></div></div>
        <EditorField error={fieldError(state.fieldErrors, "name")} label="名称"><input name="name" onChange={update("name")} value={values.name} /></EditorField>
        <EditorField error={fieldError(state.fieldErrors, "repositoryUrl")} label="GitHub 仓库 HTTPS 链接"><input name="repositoryUrl" onChange={update("repositoryUrl")} value={values.repositoryUrl} /></EditorField>
        <EditorField error={fieldError(state.fieldErrors, "summary")} label="项目简介"><textarea name="summary" onChange={update("summary")} rows={3} value={values.summary} /></EditorField>
        <EditorField error={fieldError(state.fieldErrors, "recommendation")} label="推荐理由"><textarea name="recommendation" onChange={update("recommendation")} rows={4} value={values.recommendation} /></EditorField>
        <EditorField error={fieldError(state.fieldErrors, "language")} label="主要语言"><input name="language" onChange={update("language")} value={values.language} /></EditorField>
        <EditorField error={fieldError(state.fieldErrors, "tags")} label="标签（使用逗号分隔）"><input onChange={update("tagsText")} value={values.tagsText} /></EditorField>
      </section>
      <aside className="work-editor-sidebar">
        <section className="plan-editor-settings glass"><p className="eyebrow">LIVE PREVIEW</p><h2>卡片预览</h2><FeaturedProjectCard preview project={preview} /></section>
        <section className="plan-editor-settings glass"><p className="eyebrow">SETTINGS</p><h2>发布设置</h2><div className="editor-field-grid">
          <EditorField error={fieldError(state.fieldErrors, "starCount")} label="Star 数量快照"><input min={0} name="starCount" onChange={update("starCount")} type="number" value={values.starCount} /></EditorField>
          <EditorField error={fieldError(state.fieldErrors, "starRecordedOn")} label="Star 记录日期"><input name="starRecordedOn" onChange={update("starRecordedOn")} type="date" value={values.starRecordedOn} /></EditorField>
          <EditorField error={fieldError(state.fieldErrors, "visibility")} label="可见性"><select name="visibility" onChange={update("visibility")} value={values.visibility}>{RECOMMENDATION_VISIBILITIES.map((visibility) => <option key={visibility} value={visibility}>{RECOMMENDATION_VISIBILITY_LABELS[visibility]}</option>)}</select></EditorField>
          <EditorField error={fieldError(state.fieldErrors, "sortOrder")} label="排序"><input min={0} name="sortOrder" onChange={update("sortOrder")} type="number" value={values.sortOrder} /></EditorField>
          <label className="editor-check"><input checked={values.featured} name="featured" onChange={update("featured")} type="checkbox" />进入首页推荐候选</label>
        </div></section>
        <section className="plan-editor-save glass"><strong>{dirty ? "有未保存修改" : "当前内容已保存"}</strong><p className="muted">{values.visibility === "public" ? "公开项目必须填写 GitHub 仓库、简介和推荐理由。" : "Star 数量和记录日期必须成对填写。"}</p>{state.message ? <p className={`admin-notice ${state.ok ? "success brief" : "error"}`} role={state.ok ? "status" : "alert"}>{state.message}</p> : null}<button className="btn primary" disabled={pending} type="submit">{pending ? "正在保存..." : "保存项目"}</button><Link className="btn" href="/admin/projects" onClick={confirmLeave}>返回项目列表</Link></section>
      </aside>
    </form>
  );
}
function EditorField({ children, error, label }: { children: React.ReactNode; error: string; label: string }) { return <label className="editor-field"><span>{label}</span>{children}{error ? <small className="editor-field-error">{error}</small> : null}</label>; }
