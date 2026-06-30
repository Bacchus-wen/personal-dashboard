"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type MouseEvent,
  useActionState,
  useEffect,
  useMemo,
  useState,
} from "react";

import { CompactMediaUpload } from "@/components/admin/media/compact-media-upload";
import { ThemeSelect } from "@/components/ui/theme-select";
import { ScreenshotEditor } from "./screenshot-editor";
import { MarkdownContent } from "@/components/plans/markdown-content";
import {
  publicMediaUrlForPath,
  resolveMediaDisplayUrl,
} from "@/lib/media/display";
import {
  WORK_STATUSES,
  WORK_STATUS_LABELS,
  WORK_VISIBILITIES,
  WORK_VISIBILITY_LABELS,
} from "@/lib/works/constants";
import { getWorkMediaUploadState } from "@/lib/works/media";
import { getWorkSaveDestination } from "@/lib/works/navigation";
import type {
  Work,
  WorkActionResult,
  WorkFieldErrors,
  WorkInput,
  WorkScreenshotInput,
} from "@/lib/works/types";

type WorkEditorAction = (
  previousState: WorkActionResult,
  formData: FormData,
) => Promise<WorkActionResult>;

type EditorValues = {
  name: string;
  slug: string;
  summary: string;
  description: string;
  coverPath: string;
  techText: string;
  status: string;
  visibility: string;
  startedOn: string;
  completedOn: string;
  websiteUrl: string;
  githubUrl: string;
  websiteAvailable: boolean;
  featured: boolean;
  sortOrder: string;
  seoTitle: string;
  seoDescription: string;
  seoImagePath: string;
  screenshots: WorkScreenshotInput[];
};

const EMPTY_RESULT: WorkActionResult = { ok: false, message: "" };

function valuesFromWork(work: Work | null): EditorValues {
  return {
    name: work?.name ?? "",
    slug: work?.slug ?? "",
    summary: work?.summary ?? "",
    description: work?.description ?? "",
    coverPath: work?.coverPath ?? "",
    techText: work?.techStack.join(", ") ?? "",
    status: work?.status ?? "developing",
    visibility: work?.visibility ?? "draft",
    startedOn: work?.startedOn ?? "",
    completedOn: work?.completedOn ?? "",
    websiteUrl: work?.websiteUrl ?? "",
    githubUrl: work?.githubUrl ?? "",
    websiteAvailable: work?.websiteAvailable ?? true,
    featured: work?.featured ?? false,
    sortOrder: String(work?.sortOrder ?? 0),
    seoTitle: work?.seoTitle ?? "",
    seoDescription: work?.seoDescription ?? "",
    seoImagePath: work?.seoImagePath ?? "",
    screenshots:
      work?.screenshots.map((item) => ({
        imagePath: item.imagePath,
        caption: item.caption,
        sortOrder: item.sortOrder,
      })) ?? [],
  };
}

function fieldError(errors: WorkFieldErrors | undefined, field: keyof WorkInput) {
  return errors?.[field]?.[0] ?? "";
}

export function WorkEditor({
  action,
  work = null,
}: {
  action: WorkEditorAction;
  work?: Work | null;
}) {
  const router = useRouter();
  const initialValues = useMemo(() => valuesFromWork(work), [work]);
  const [values, setValues] = useState(initialValues);
  const [savedSnapshot, setSavedSnapshot] = useState(
    JSON.stringify(initialValues),
  );
  const [preview, setPreview] = useState(false);
  const mediaUploadState = getWorkMediaUploadState(work);
  const dirty = JSON.stringify(values) !== savedSnapshot;
  const submit = async (previousState: WorkActionResult, formData: FormData) => {
    const result = await action(previousState, formData);
    if (result.ok) {
      setSavedSnapshot(JSON.stringify(values));
      router.replace(getWorkSaveDestination(result.workId));
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

  const update =
    (field: keyof EditorValues) =>
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const value =
        event.target instanceof HTMLInputElement &&
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value;
      setValues((current) => ({ ...current, [field]: value }));
    };
  const setField = (field: keyof EditorValues) => (value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  const confirmLeave = (event: MouseEvent<HTMLAnchorElement>) => {
    if (dirty && !window.confirm("当前修改尚未保存，确定离开吗？")) {
      event.preventDefault();
    }
  };

  const techStack = values.techText
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return (
    <form action={formAction} className="work-editor">
      <input name="techStack" type="hidden" value={JSON.stringify(techStack)} />
      <input
        name="screenshots"
        type="hidden"
        value={JSON.stringify(values.screenshots)}
      />
      <section className="work-editor-main glass">
        <div className="plan-editor-section-head">
          <div>
            <p className="eyebrow">WORK CONTENT</p>
            <h2>作品内容</h2>
          </div>
          <div className="editor-tabs" role="tablist">
            <button
              aria-selected={!preview}
              className={!preview ? "active" : ""}
              onClick={() => setPreview(false)}
              role="tab"
              type="button"
            >
              编辑
            </button>
            <button
              aria-selected={preview}
              className={preview ? "active" : ""}
              onClick={() => setPreview(true)}
              role="tab"
              type="button"
            >
              Markdown 预览
            </button>
          </div>
        </div>
        <EditorField error={fieldError(state.fieldErrors, "name")} label="名称">
          <input name="name" onChange={update("name")} value={values.name} />
        </EditorField>
        <EditorField error={fieldError(state.fieldErrors, "slug")} label="slug">
          <input
            name="slug"
            onChange={update("slug")}
            placeholder="theodore-dashboard"
            value={values.slug}
          />
        </EditorField>
        <EditorField error={fieldError(state.fieldErrors, "summary")} label="简短摘要">
          <textarea
            name="summary"
            onChange={update("summary")}
            rows={3}
            value={values.summary}
          />
        </EditorField>
        <EditorField error={fieldError(state.fieldErrors, "description")} label="详细介绍（Markdown）">
          {preview ? (
            <div className="markdown-preview">
              {values.description ? (
                <MarkdownContent content={values.description} />
              ) : (
                <p className="muted">输入 Markdown 后可在这里查看预览。</p>
              )}
            </div>
          ) : (
            <textarea
              className="editor-description"
              name="description"
              onChange={update("description")}
              rows={16}
              value={values.description}
            />
          )}
          {preview ? (
            <input name="description" type="hidden" value={values.description} />
          ) : null}
        </EditorField>
        <EditorField error={fieldError(state.fieldErrors, "coverPath")} label="封面路径或 HTTPS URL">
          <input
            name="coverPath"
            onChange={update("coverPath")}
            value={values.coverPath}
          />
          <CompactMediaUpload
            disabledHint={mediaUploadState.disabledHint ?? undefined}
            label="Upload or replace cover"
            onClear={() => setValues((current) => ({ ...current, coverPath: "" }))}
            onUploaded={({ path }) =>
              setValues((current) => ({ ...current, coverPath: path }))
            }
            ownerId={mediaUploadState.ownerId}
            preview={
              resolveMediaDisplayUrl(values.coverPath, publicMediaUrlForPath) ??
              undefined
            }
            purpose="works"
            value={values.coverPath}
            variant="cover"
          />
        </EditorField>
        <EditorField error={fieldError(state.fieldErrors, "techStack")} label="技术标签（使用逗号分隔）">
          <input onChange={update("techText")} value={values.techText} />
        </EditorField>
        <ScreenshotEditor
          disabledHint={mediaUploadState.disabledHint ?? undefined}
          ownerId={mediaUploadState.ownerId}
          onChange={(screenshots) =>
            setValues((current) => ({ ...current, screenshots }))
          }
          screenshots={values.screenshots}
        />
      </section>

      <aside className="work-editor-sidebar">
        <section className="plan-editor-settings glass">
          <p className="eyebrow">WORK SETTINGS</p>
          <h2>作品设置</h2>
          <div className="editor-field-grid">
            <EditorField error={fieldError(state.fieldErrors, "status")} label="状态">
              <ThemeSelect name="status" ariaLabel="状态" value={values.status} onChange={setField("status")} options={WORK_STATUSES.map((status) => ({ value: status, label: WORK_STATUS_LABELS[status] }))} />
            </EditorField>
            <EditorField error={fieldError(state.fieldErrors, "visibility")} label="可见性">
              <ThemeSelect name="visibility" ariaLabel="可见性" value={values.visibility} onChange={setField("visibility")} options={WORK_VISIBILITIES.map((visibility) => ({ value: visibility, label: WORK_VISIBILITY_LABELS[visibility] }))} />
            </EditorField>
            <EditorField error={fieldError(state.fieldErrors, "sortOrder")} label="排序">
              <input
                min={0}
                name="sortOrder"
                onChange={update("sortOrder")}
                type="number"
                value={values.sortOrder}
              />
            </EditorField>
            <EditorField error={fieldError(state.fieldErrors, "startedOn")} label="开始日期">
              <input
                name="startedOn"
                onChange={update("startedOn")}
                type="date"
                value={values.startedOn}
              />
            </EditorField>
            <EditorField error={fieldError(state.fieldErrors, "completedOn")} label="完成日期">
              <input
                name="completedOn"
                onChange={update("completedOn")}
                type="date"
                value={values.completedOn}
              />
            </EditorField>
            <EditorField error={fieldError(state.fieldErrors, "websiteUrl")} label="项目网站（HTTPS）">
              <input
                name="websiteUrl"
                onChange={update("websiteUrl")}
                value={values.websiteUrl}
              />
            </EditorField>
            <EditorField error={fieldError(state.fieldErrors, "githubUrl")} label="GitHub（HTTPS）">
              <input
                name="githubUrl"
                onChange={update("githubUrl")}
                value={values.githubUrl}
              />
            </EditorField>
            <label className="editor-check">
              <input
                checked={values.websiteAvailable}
                name="websiteAvailable"
                onChange={update("websiteAvailable")}
                type="checkbox"
              />
              项目网站当前可访问
            </label>
            <label className="editor-check">
              <input
                checked={values.featured}
                name="featured"
                onChange={update("featured")}
                type="checkbox"
              />
              标记为精选作品
            </label>
          </div>
        </section>
        <section className="plan-editor-settings glass">
          <p className="eyebrow">SEO</p>
          <h2>详情页元数据</h2>
          <EditorField error={fieldError(state.fieldErrors, "seoTitle")} label="SEO 标题">
            <input name="seoTitle" onChange={update("seoTitle")} value={values.seoTitle} />
          </EditorField>
          <EditorField error={fieldError(state.fieldErrors, "seoDescription")} label="SEO 描述">
            <textarea name="seoDescription" onChange={update("seoDescription")} rows={3} value={values.seoDescription} />
          </EditorField>
          <EditorField error={fieldError(state.fieldErrors, "seoImagePath")} label="SEO 图片">
            <input name="seoImagePath" onChange={update("seoImagePath")} value={values.seoImagePath} />
            <CompactMediaUpload
              disabledHint={mediaUploadState.disabledHint ?? undefined}
              label="Upload or replace SEO image"
              onClear={() =>
                setValues((current) => ({ ...current, seoImagePath: "" }))
              }
              onUploaded={({ path }) =>
                setValues((current) => ({ ...current, seoImagePath: path }))
              }
              ownerId={mediaUploadState.ownerId}
              preview={
                resolveMediaDisplayUrl(
                  values.seoImagePath,
                  publicMediaUrlForPath,
                ) ?? undefined
              }
              purpose="works"
              value={values.seoImagePath}
              variant="seo"
            />
          </EditorField>
        </section>
        <section className="plan-editor-save glass">
          <div>
            <strong>{dirty ? "有未保存修改" : "当前内容已保存"}</strong>
            <p className="muted">
              {values.visibility === "public"
                ? "公开作品必须填写 slug、摘要、详细介绍和 HTTPS 项目网站。"
                : "非公开作品可以先保存不完整内容。"}
            </p>
          </div>
          {state.message ? (
            <p
              className={`admin-notice ${state.ok ? "success brief" : "error"}`}
              role={state.ok ? "status" : "alert"}
            >
              {state.message}
            </p>
          ) : null}
          <button className="btn primary" disabled={pending} type="submit">
            {pending ? "正在保存…" : "保存作品"}
          </button>
          {work ? (
            <Link className="btn" href={`/admin/works/${work.id}/preview`}>
              预览作品
            </Link>
          ) : null}
          <Link className="btn" href="/admin/works" onClick={confirmLeave}>
            返回作品列表
          </Link>
        </section>
      </aside>
    </form>
  );
}

function EditorField({
  children,
  error,
  label,
}: {
  children: React.ReactNode;
  error: string;
  label: string;
}) {
  return (
    <label className="editor-field">
      <span>{label}</span>
      {children}
      {error ? <small className="editor-field-error">{error}</small> : null}
    </label>
  );
}
