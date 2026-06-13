import Link from "next/link";

import { WORK_STATUS_LABELS } from "@/lib/works/constants";
import type { Work } from "@/lib/works/types";

export function WorkCard({ work }: { work: Work }) {
  return (
    <Link className="work-card glass lift" href={`/works/${work.slug}`}>
      <div className="work-card-preview">
        <div className="work-browser-bar"><span /><span /><span /></div>
        {work.coverPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" src={work.coverPath} />
        ) : (
          <div className="work-cover-fallback"><span>{work.name.slice(0, 2).toUpperCase()}</span></div>
        )}
      </div>
      <div className="work-card-body">
        <div className="work-card-heading">
          <h2>{work.name}</h2>
          <span className="pill">{WORK_STATUS_LABELS[work.status]}</span>
        </div>
        <p className="muted">{work.summary}</p>
        <div className="tag-row">
          {work.techStack.slice(0, 3).map((tag) => <span className="pill" key={tag}>{tag}</span>)}
        </div>
      </div>
    </Link>
  );
}
