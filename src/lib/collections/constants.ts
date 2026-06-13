export const COLLECTION_CONTENT_TYPES = ["article", "video"] as const;

export const RECOMMENDATION_VISIBILITIES = [
  "draft",
  "public",
  "archived",
] as const;

export type CollectionContentType = (typeof COLLECTION_CONTENT_TYPES)[number];
export type RecommendationVisibility =
  (typeof RECOMMENDATION_VISIBILITIES)[number];

export const COLLECTION_CONTENT_TYPE_LABELS: Record<
  CollectionContentType,
  string
> = {
  article: "文章",
  video: "视频",
};

export const RECOMMENDATION_VISIBILITY_LABELS: Record<
  RecommendationVisibility,
  string
> = {
  draft: "草稿",
  public: "公开",
  archived: "已归档",
};
