export const MEDIA_PURPOSES = [
  "site",
  "works",
  "collections",
  "projects",
  "test",
] as const;

export const MEDIA_VARIANTS = [
  "avatar",
  "favicon",
  "cover",
  "seo",
  "screenshot",
  "test",
] as const;

export const MEDIA_BUCKET = "public-media";
export const MEDIA_MAX_BYTES = 10 * 1024 * 1024;
export const MEDIA_MAX_EDGE = 2560;
export const MEDIA_WEBP_QUALITY = 0.85;
export const MEDIA_UPLOAD_CONCURRENCY = 2;
export const MEDIA_FAVICON_MIME_TYPES = [
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/png",
  "image/svg+xml",
] as const;
export const MEDIA_WEBP_MIME_TYPE = "image/webp";
