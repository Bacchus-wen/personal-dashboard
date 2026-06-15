import { COLLECTION_CONTENT_TYPE_LABELS } from "@/lib/collections/constants";
import {
  publicMediaUrlForPath,
  resolveMediaDisplayUrl,
} from "@/lib/media/display";
import type { Collection } from "@/lib/collections/types";

export function CollectionCard({
  collection,
  preview = false,
}: {
  collection: Collection;
  preview?: boolean;
}) {
  const coverPath = resolveMediaDisplayUrl(
    collection.coverPath,
    publicMediaUrlForPath,
  );

  const content = (
    <>
      <div className="collection-card-cover">
        {coverPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" src={coverPath} />
        ) : (
          <span>{COLLECTION_CONTENT_TYPE_LABELS[collection.contentType]}</span>
        )}
      </div>
      <div className="collection-card-body">
        <p className="eyebrow">
          {COLLECTION_CONTENT_TYPE_LABELS[collection.contentType]}
          {collection.sourceName ? ` · ${collection.sourceName}` : ""}
        </p>
        <h2>{collection.title || "未填写标题"}</h2>
        <p className="muted">{collection.summary ?? "暂未填写摘要。"}</p>
        <div className="plan-meta-row">
          {collection.tags.slice(0, 3).map((tag) => (
            <span className="pill" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </>
  );

  if (preview || !collection.externalUrl) {
    return <article className="collection-card glass card">{content}</article>;
  }

  return (
    <a
      className="collection-card glass card lift"
      href={collection.externalUrl}
      rel="noreferrer noopener"
      target="_blank"
    >
      {content}
    </a>
  );
}
