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
  useTransition,
} from "react";

import type {
  MusicTrack,
  MusicTrackActionResult,
  MusicTrackFieldErrors,
  MusicTrackInput,
} from "@/lib/music/types";
import type { MusicUploadResult } from "@/lib/music/upload";

type Action = (
  previousState: MusicTrackActionResult,
  formData: FormData,
) => Promise<MusicTrackActionResult>;
type Values = {
  title: string;
  artist: string;
  audioPath: string;
  coverPath: string;
  isActive: boolean;
  sortOrder: string;
};

const EMPTY_RESULT: MusicTrackActionResult = { ok: false, message: "" };

function valuesFromTrack(track: MusicTrack | null): Values {
  return {
    title: track?.title ?? "",
    artist: track?.artist ?? "",
    audioPath: track?.audioPath ?? "",
    coverPath: track?.coverPath ?? "",
    isActive: track?.isActive ?? false,
    sortOrder: String(track?.sortOrder ?? 0),
  };
}

function fieldError(
  errors: MusicTrackFieldErrors | undefined,
  field: keyof MusicTrackInput,
) {
  return errors?.[field]?.[0] ?? "";
}

export function MusicEditor({
  action,
  track = null,
}: {
  action: Action;
  track?: MusicTrack | null;
}) {
  const router = useRouter();
  const uploadOwnerId = useMemo(
    () => track?.id ?? crypto.randomUUID(),
    [track?.id],
  );
  const initialValues = useMemo(() => valuesFromTrack(track), [track]);
  const [values, setValues] = useState(initialValues);
  const [savedSnapshot, setSavedSnapshot] = useState(
    JSON.stringify(initialValues),
  );
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadPending, startUploadTransition] = useTransition();
  const dirty = JSON.stringify(values) !== savedSnapshot;

  const submit = async (
    previousState: MusicTrackActionResult,
    formData: FormData,
  ) => {
    const result = await action(previousState, formData);
    if (result.ok) {
      setSavedSnapshot(JSON.stringify(values));
      router.replace("/admin/music");
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
    (field: keyof Values) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value =
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value;
      setValues((current) => ({ ...current, [field]: value }));
    };

  const confirmLeave = (event: MouseEvent<HTMLAnchorElement>) => {
    if (dirty && !window.confirm("当前修改尚未保存，确定离开吗？")) {
      event.preventDefault();
    }
  };

  function uploadAudio(file: File | null) {
    if (!file) return;
    setUploadMessage("");
    startUploadTransition(async () => {
      const formData = new FormData();
      formData.set("trackId", uploadOwnerId);
      formData.set("file", file);
      const response = await fetch("/api/admin/music/upload", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as MusicUploadResult;
      setUploadMessage(result.message);
      if (result.ok && result.path) {
        setValues((current) => ({ ...current, audioPath: result.path ?? "" }));
      }
    });
  }

  return (
    <form action={formAction} className="work-editor">
      <section className="work-editor-main glass">
        <div className="plan-editor-section-head">
          <div>
            <p className="eyebrow">MUSIC CONTENT</p>
            <h2>音乐内容</h2>
          </div>
        </div>
        <EditorField error={fieldError(state.fieldErrors, "title")} label="标题">
          <input name="title" onChange={update("title")} value={values.title} />
        </EditorField>
        <EditorField error={fieldError(state.fieldErrors, "artist")} label="艺术家">
          <input name="artist" onChange={update("artist")} value={values.artist} />
        </EditorField>
        <EditorField error={fieldError(state.fieldErrors, "audioPath")} label="MP3 文件">
          <input name="audioPath" type="hidden" value={values.audioPath} />
          <input
            accept="audio/mpeg,.mp3"
            disabled={uploadPending}
            onChange={(event) => uploadAudio(event.target.files?.[0] ?? null)}
            type="file"
          />
          {values.audioPath ? <small>{values.audioPath}</small> : null}
          {uploadMessage ? <small>{uploadMessage}</small> : null}
        </EditorField>
        <EditorField error={fieldError(state.fieldErrors, "coverPath")} label="封面路径或 HTTPS URL（可选）">
          <input name="coverPath" onChange={update("coverPath")} value={values.coverPath} />
        </EditorField>
      </section>
      <aside className="work-editor-sidebar">
        <section className="plan-editor-settings glass">
          <p className="eyebrow">SETTINGS</p>
          <h2>播放设置</h2>
          <div className="editor-field-grid">
            <EditorField error={fieldError(state.fieldErrors, "sortOrder")} label="排序">
              <input min={0} name="sortOrder" onChange={update("sortOrder")} type="number" value={values.sortOrder} />
            </EditorField>
            <label className="editor-check">
              <input checked={values.isActive} name="isActive" onChange={update("isActive")} type="checkbox" />
              设为当前播放
            </label>
          </div>
        </section>
        <section className="plan-editor-save glass">
          <strong>{dirty ? "有未保存修改" : "当前内容已保存"}</strong>
          <p className="muted">同一时间只有一首音乐会作为首页当前播放。</p>
          {state.message ? (
            <p className={`admin-notice ${state.ok ? "success brief" : "error"}`} role={state.ok ? "status" : "alert"}>
              {state.message}
            </p>
          ) : null}
          <button className="btn primary" disabled={pending || uploadPending} type="submit">
            {pending ? "正在保存..." : "保存音乐"}
          </button>
          <Link className="btn" href="/admin/music" onClick={confirmLeave}>
            返回音乐列表
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
