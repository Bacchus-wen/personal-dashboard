export const PHOTO_VISIBILITIES = ["draft", "public", "archived"] as const;

export type PhotoVisibility = (typeof PHOTO_VISIBILITIES)[number];

export const PHOTO_VISIBILITY_LABELS: Record<PhotoVisibility, string> = {
  draft: "草稿",
  public: "公开",
  archived: "归档",
};

export const PHOTO_GROUP_SIZE = 12;
export const PHOTO_BATCH_LIMIT = 10;
export const PHOTO_UPLOAD_CONCURRENCY = 2;
export const PHOTO_MAX_BYTES = 10 * 1024 * 1024;
export const PHOTO_MAX_EDGE = 2560;
export const PHOTO_WEBP_QUALITY = 0.85;
export const PUBLIC_MEDIA_BUCKET = "public-media";
