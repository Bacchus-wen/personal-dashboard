import { MarkdownContent } from "@/components/plans/markdown-content";
import { WorkGallery } from "./work-gallery";
import { WORK_STATUS_LABELS } from "@/lib/works/constants";
import type { Work } from "@/lib/works/types";

export function WorkDetail({
  preview = false,
  work,
}: {
  preview?: boolean;
  work: Work;
}) {
  return (
    <article className="work-detail">
      {preview ? <p className="work-preview-banner">后台预览，不会向访客公开</p> : null}
      <header className="work-detail-hero glass">
        <div className="work-browser-frame">
          <div className="work-browser-bar"><span /><span /><span /></div>
          {work.coverPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={`${work.name} 封面`} src={work.coverPath} />
          ) : (
            <div className="work-cover-fallback"><span>{work.name.slice(0, 2).toUpperCase()}</span></div>
          )}
        </div>
        <div className="work-detail-intro">
          <div className="tag-row">
            <span className="pill">{WORK_STATUS_LABELS[work.status]}</span>
            {work.featured ? <span className="pill work-featured">精选作品</span> : null}
            <span className="pill">{work.startedOn ?? "未填写开始日期"}</span>
            {work.completedOn ? <span className="pill">完成于 {work.completedOn}</span> : null}
          </div>
          <p className="eyebrow">PORTFOLIO WORK</p>
          <h1>{work.name}</h1>
          <p className="work-detail-summary">{work.summary ?? "这项作品暂未填写摘要。"}</p>
          <div className="tag-row">
            {work.techStack.map((tag) => <span className="pill" key={tag}>{tag}</span>)}
          </div>
          <div className="work-detail-actions">
            {work.websiteUrl && work.websiteAvailable ? (
              <a className="btn primary" href={work.websiteUrl} rel="noreferrer noopener" target="_blank">访问项目网站</a>
            ) : (
              <span aria-disabled="true" className="btn disabled">网站暂不可访问</span>
            )}
            {work.githubUrl ? (
              <a className="btn" href={work.githubUrl} rel="noreferrer noopener" target="_blank">查看 GitHub</a>
            ) : null}
          </div>
        </div>
      </header>
      <section className="work-detail-copy glass">
        {work.description ? (
          <MarkdownContent content={work.description} />
        ) : (
          <p className="muted">这项作品暂未填写详细介绍。</p>
        )}
      </section>
      <WorkGallery screenshots={work.screenshots} />
    </article>
  );
}
