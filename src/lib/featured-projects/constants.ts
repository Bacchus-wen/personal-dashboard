export const RECOMMENDATION_VISIBILITIES = [
  "draft",
  "public",
  "archived",
] as const;

export type RecommendationVisibility =
  (typeof RECOMMENDATION_VISIBILITIES)[number];

export const RECOMMENDATION_VISIBILITY_LABELS: Record<
  RecommendationVisibility,
  string
> = {
  draft: "草稿",
  public: "公开",
  archived: "已归档",
};
