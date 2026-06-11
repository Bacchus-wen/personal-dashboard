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

import { MarkdownContent } from "@/components/plans/markdown-content";
import {
  PLAN_PRIORITIES,
  PLAN_PRIORITY_LABELS,
  PLAN_STATUSES,
  PLAN_STATUS_LABELS,
  PLAN_VISIBILITIES,
  PLAN_VISIBILITY_LABELS,
} from "@/lib/plans/constants";
import type {
  Plan,
  PlanActionResult,
  PlanCategory,
  PlanInput,
} from "@/lib/plans/types";

type PlanEditorAction = (
  previousState: PlanActionResult,
  formData: FormData,
) => Promise<PlanActionResult>;

type EditorValues = {
  title: string;
  summary: string;
  description: string;
  status: string;
  visibility: string;
  priority: string;
  progress: string;
  deadline: string;
  relatedUrl: string;
  categoryId: string;
};

const EMPTY_RESULT: PlanActionResult = { ok: false, message: "" };

function valuesFromPlan(plan: Plan | null): EditorValues {
  return {
    title: plan?.title ?? "",
    summary: plan?.summary ?? "",
    description: plan?.description ?? "",
    status: plan?.status ?? "not_started",
    visibility: plan?.visibility ?? "draft",
    priority: plan?.priority ?? "medium",
    progress: String(plan?.progress ?? 0),
    deadline: plan?.deadline ?? "",
    relatedUrl: plan?.relatedUrl ?? "",
    categoryId: plan?.categoryId ?? "",
  };
}

function valuesFromFormData(formData: FormData): EditorValues {
  const value = (name: keyof EditorValues) => String(formData.get(name) ?? "");
  return {
    title: value("title"),
    summary: value("summary"),
    description: value("description"),
    status: value("status"),
    visibility: value("visibility"),
    priority: value("priority"),
    progress: value("progress"),
    deadline: value("deadline"),
    relatedUrl: value("relatedUrl"),
    categoryId: value("categoryId"),
  };
}

function fieldError(
  errors: Partial<Record<keyof PlanInput, string[]>> | undefined,
  field: keyof PlanInput,
) {
  return errors?.[field]?.[0] ?? "";
}

export function PlanEditor({
  action,
  categories,
  plan = null,
}: {
  action: PlanEditorAction;
  categories: PlanCategory[];
  plan?: Plan | null;
}) {
  const router = useRouter();
  const initialValues = useMemo(() => valuesFromPlan(plan), [plan]);
  const [values, setValues] = useState(initialValues);
  const [savedSnapshot, setSavedSnapshot] = useState(
    JSON.stringify(initialValues),
  );
  const [preview, setPreview] = useState(false);
  const snapshot = JSON.stringify(values);
  const dirty = snapshot !== savedSnapshot;
  const submit = async (previousState: PlanActionResult, formData: FormData) => {
    const result = await action(previousState, formData);
    if (result.ok) {
      setSavedSnapshot(JSON.stringify(valuesFromFormData(formData)));
      if (!plan && result.planId) {
        router.replace(`/admin/plans/${result.planId}/edit`);
      }
    }
    return result;
  };
  const [state, formAction, pending] = useActionState(submit, EMPTY_RESULT);

  useEffect(() => {
    if (!dirty) {
      return;
    }

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update =
    (field: keyof EditorValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setValues((current) => {
        if (field === "status" && value === "not_started") {
          return { ...current, status: value, progress: "0" };
        }
        if (field === "status" && value === "completed") {
          return { ...current, status: value, progress: "100" };
        }
        return { ...current, [field]: value };
      });
    };

  const confirmLeave = (event: MouseEvent<HTMLAnchorElement>) => {
    if (dirty && !window.confirm("当前修改尚未保存，确定离开吗？")) {
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="plan-editor">
      <section className="plan-editor-main glass">
        <div className="plan-editor-section-head">
          <div>
            <p className="eyebrow">PLAN CONTENT</p>
            <h2>规划内容</h2>
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
              预览
            </button>
          </div>
        </div>

        <EditorField error={fieldError(state.fieldErrors, "title")} label="标题">
          <input
            name="title"
            onChange={update("title")}
            placeholder="例如：完成个人作品集"
            value={values.title}
          />
        </EditorField>
        <EditorField error={fieldError(state.fieldErrors, "summary")} label="简短描述">
          <textarea
            name="summary"
            onChange={update("summary")}
            placeholder="用一两句话说明目标和当前重点"
            rows={3}
            value={values.summary}
          />
        </EditorField>
        <EditorField error={fieldError(state.fieldErrors, "description")} label="详细说明（Markdown）">
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
              placeholder={"## 下一步\n- 整理内容\n- 完成开发\n- 发布上线"}
              rows={16}
              value={values.description}
            />
          )}
          {preview ? (
            <input name="description" type="hidden" value={values.description} />
          ) : null}
        </EditorField>
      </section>

      <aside className="plan-editor-sidebar">
        <section className="plan-editor-settings glass">
          <p className="eyebrow">PLAN SETTINGS</p>
          <h2>规划设置</h2>
          <div className="editor-field-grid">
            <EditorField error={fieldError(state.fieldErrors, "status")} label="状态">
              <select name="status" onChange={update("status")} value={values.status}>
                {PLAN_STATUSES.map((status) => <option key={status} value={status}>{PLAN_STATUS_LABELS[status]}</option>)}
              </select>
            </EditorField>
            <EditorField error={fieldError(state.fieldErrors, "visibility")} label="可见性">
              <select name="visibility" onChange={update("visibility")} value={values.visibility}>
                {PLAN_VISIBILITIES.map((visibility) => <option key={visibility} value={visibility}>{PLAN_VISIBILITY_LABELS[visibility]}</option>)}
              </select>
            </EditorField>
            <EditorField error={fieldError(state.fieldErrors, "priority")} label="优先级">
              <select name="priority" onChange={update("priority")} value={values.priority}>
                {PLAN_PRIORITIES.map((priority) => <option key={priority} value={priority}>{PLAN_PRIORITY_LABELS[priority]}</option>)}
              </select>
            </EditorField>
            <EditorField error={fieldError(state.fieldErrors, "progress")} label="进度">
              <div className="editor-progress-input">
                <input
                  max={100}
                  min={0}
                  name="progress"
                  onChange={update("progress")}
                  type="range"
                  value={values.progress}
                />
                <output>{values.progress}%</output>
              </div>
            </EditorField>
            <EditorField error={fieldError(state.fieldErrors, "deadline")} label="截止日期">
              <input name="deadline" onChange={update("deadline")} type="date" value={values.deadline} />
            </EditorField>
            <EditorField error={fieldError(state.fieldErrors, "categoryId")} label="分类">
              <select name="categoryId" onChange={update("categoryId")} value={values.categoryId}>
                <option value="">未分类</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </EditorField>
            <EditorField error={fieldError(state.fieldErrors, "relatedUrl")} label="相关链接">
              <input name="relatedUrl" onChange={update("relatedUrl")} placeholder="/projects 或 https://..." value={values.relatedUrl} />
            </EditorField>
          </div>
        </section>

        <section className="plan-editor-save glass">
          <div>
            <strong>{dirty ? "有未保存修改" : "当前内容已保存"}</strong>
            <p className="muted">{values.visibility === "draft" ? "草稿允许暂时缺少标题和描述。" : "私密与公开规划需要标题和简短描述。"}</p>
          </div>
          {state.message ? <p className={`admin-notice ${state.ok ? "success brief" : "error"}`} role={state.ok ? "status" : "alert"}>{state.message}</p> : null}
          <button className="btn primary" disabled={pending} type="submit">
            {pending ? "正在保存…" : "保存规划"}
          </button>
          <Link className="btn" href="/admin/plans" onClick={confirmLeave}>返回规划列表</Link>
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
