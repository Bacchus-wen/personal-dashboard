import {
  publicMediaUrlForPath,
  resolveMediaDisplayUrl,
} from "@/lib/media/display";
import type { FeaturedProject } from "@/lib/featured-projects/types";

export function FeaturedProjectCard({ project, preview = false }: { project: FeaturedProject; preview?: boolean }) {
  const coverPath = resolveMediaDisplayUrl(project.coverPath, publicMediaUrlForPath);
  const content = (
    <div className="featured-project-card-body">
      {coverPath ? (
        <div className="featured-project-cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src={coverPath} />
        </div>
      ) : (
        <div className="featured-project-mark" aria-hidden="true">GH</div>
      )}
      <p className="eyebrow">{project.language ?? "GITHUB PROJECT"}</p>
      <h2>{project.name || "未填写项目名称"}</h2>
      <p className="muted">{project.summary ?? "暂未填写项目简介。"}</p>
      <p>{project.recommendation ?? "暂未填写推荐理由。"}</p>
      <div className="plan-meta-row">
        {project.tags.slice(0, 3).map((tag) => <span className="pill" key={tag}>{tag}</span>)}
        {project.starCount !== null && project.starRecordedOn ? <span className="pill">★ {project.starCount.toLocaleString()} · {project.starRecordedOn}</span> : null}
      </div>
    </div>
  );
  if (preview || !project.repositoryUrl) return <article className="featured-project-card glass card">{content}</article>;
  return <a className="featured-project-card glass card lift" href={project.repositoryUrl} rel="noreferrer noopener" target="_blank">{content}</a>;
}
