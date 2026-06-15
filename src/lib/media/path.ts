import type { MediaExtension, MediaTarget, MediaTargetInput } from "./types";

const UUID_PATTERN =
  "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const OWNER_PATTERN = "[A-Za-z0-9_-]+";
const OWNER_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const FAVICON_EXTENSIONS = ["ico", "png", "svg"] as const;

const SYSTEM_PATH_PATTERNS = [
  new RegExp(`^site/avatar/${UUID_PATTERN}\\.webp$`),
  new RegExp(`^site/favicon/${UUID_PATTERN}\\.(ico|png|svg)$`),
  new RegExp(`^works/${OWNER_PATTERN}/cover/${UUID_PATTERN}\\.webp$`),
  new RegExp(`^works/${OWNER_PATTERN}/seo/${UUID_PATTERN}\\.webp$`),
  new RegExp(`^works/${OWNER_PATTERN}/screenshots/${UUID_PATTERN}\\.webp$`),
  new RegExp(`^collections/${OWNER_PATTERN}/cover/${UUID_PATTERN}\\.webp$`),
  new RegExp(`^projects/${OWNER_PATTERN}/cover/${UUID_PATTERN}\\.webp$`),
  new RegExp(`^test/${UUID_PATTERN}\\.(webp|ico|png|svg)$`),
];

function cleanOwnerId(value: string | null | undefined) {
  const cleaned = value?.trim() ?? "";
  return OWNER_ID_PATTERN.test(cleaned) ? cleaned : "";
}

function isFaviconExtension(
  extension: MediaExtension,
): extension is (typeof FAVICON_EXTENSIONS)[number] {
  return FAVICON_EXTENSIONS.includes(
    extension as (typeof FAVICON_EXTENSIONS)[number],
  );
}

export function validateMediaTarget(
  input: MediaTargetInput,
): { ok: true; data: MediaTarget } | { ok: false; message: string } {
  const { purpose, variant } = input;
  const ownerId = cleanOwnerId(input.ownerId);

  if (purpose === "site" && (variant === "avatar" || variant === "favicon")) {
    return { ok: true, data: { purpose, variant, ownerId: null } };
  }

  if (
    purpose === "works" &&
    (variant === "cover" || variant === "seo" || variant === "screenshot") &&
    ownerId
  ) {
    return { ok: true, data: { purpose, variant, ownerId } };
  }

  if (
    (purpose === "collections" || purpose === "projects") &&
    variant === "cover" &&
    ownerId
  ) {
    return { ok: true, data: { purpose, variant, ownerId } };
  }

  if (purpose === "test" && (variant === "test" || variant === "favicon")) {
    return { ok: true, data: { purpose, variant, ownerId: null } };
  }

  return { ok: false, message: "Unsupported media upload target." };
}

export function buildMediaObjectPath({
  purpose,
  variant,
  ownerId,
  id,
  extension,
}: MediaTarget & { id: string; extension: MediaExtension }) {
  if (purpose === "site" && variant === "avatar") {
    return `site/avatar/${id}.webp`;
  }
  if (
    purpose === "site" &&
    variant === "favicon" &&
    isFaviconExtension(extension)
  ) {
    return `site/favicon/${id}.${extension}`;
  }
  if (purpose === "works" && variant === "cover" && ownerId) {
    return `works/${ownerId}/cover/${id}.webp`;
  }
  if (purpose === "works" && variant === "seo" && ownerId) {
    return `works/${ownerId}/seo/${id}.webp`;
  }
  if (purpose === "works" && variant === "screenshot" && ownerId) {
    return `works/${ownerId}/screenshots/${id}.webp`;
  }
  if (purpose === "collections" && variant === "cover" && ownerId) {
    return `collections/${ownerId}/cover/${id}.webp`;
  }
  if (purpose === "projects" && variant === "cover" && ownerId) {
    return `projects/${ownerId}/cover/${id}.webp`;
  }
  if (purpose === "test" && (variant === "test" || variant === "favicon")) {
    return `test/${id}.${extension}`;
  }

  throw new Error("Unsupported media object path.");
}

export function isSystemMediaPath(path: string) {
  return SYSTEM_PATH_PATTERNS.some((pattern) => pattern.test(path));
}
