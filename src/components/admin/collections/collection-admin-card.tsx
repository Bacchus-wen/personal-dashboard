"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { moveCollectionToTrashAction } from "@/app/admin/(protected)/collections/actions";
import {
  COLLECTION_CONTENT_TYPE_LABELS,
  RECOMMENDATION_VISIBILITY_LABELS,
} from "@/lib/collections/constants";
import type { Collection } from "@/lib/collections/types";

export function CollectionAdminCard({ collection }: { collection: Collection }) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <article className="admin-plan-card glass card">
      <div className="admin-plan-card-head">
        <div>
          <p className="eyebrow">
            {collection.featured ? "FEATURED COLLECTION" : "COLLECTION"}
          </p>
          <h2>{collection.title}</h2>
        </div>
        <span className="pill mono">#{collection.sortOrder}</span>
      </div>
      <p className="muted">{collection.summary ?? "这条收藏暂未填写摘要。"}</p>
      <div className="plan-meta-row">
        <span className="pill">
          {COLLECTION_CONTENT_TYPE_LABELS[collection.contentType]}
        </span>
        <span className="pill">
          {RECOMMENDATION_VISIBILITY_LABELS[collection.visibility]}
        </span>
        <span className="pill">{collection.tags.length} 个标签</span>
      </div>
      <div className="admin-plan-actions">
        <Link
          className="btn primary"
          href={`/admin/collections/${collection.id}/edit`}
        >
          编辑
        </Link>
        <button
          className="btn danger"
          disabled={pending}
          onClick={() =>
            startTransition(async () =>
              setMessage((await moveCollectionToTrashAction(collection.id)).message),
            )
          }
          type="button"
        >
          {pending ? "处理中..." : "移入回收站"}
        </button>
      </div>
      {message ? <p className="admin-notice" role="status">{message}</p> : null}
    </article>
  );
}
