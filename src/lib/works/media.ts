import {
  resolveMediaDisplayUrl,
  type publicMediaUrlForPath,
} from "../media/display";
import type { Work } from "./types";

export function getWorkMediaUploadState(work: Work | null) {
  if (!work) {
    return {
      ownerId: null,
      disabledHint:
        "Save the work once before uploading cover, SEO, or screenshots.",
    };
  }

  return {
    ownerId: work.id,
    disabledHint: null,
  };
}

export function resolveWorkDisplayMedia(
  work: Work,
  publicUrlForPath: typeof publicMediaUrlForPath,
): Work {
  return {
    ...work,
    coverPath: resolveMediaDisplayUrl(work.coverPath, publicUrlForPath),
    seoImagePath: resolveMediaDisplayUrl(work.seoImagePath, publicUrlForPath),
    screenshots: work.screenshots.map((screenshot) => ({
      ...screenshot,
      imagePath:
        resolveMediaDisplayUrl(screenshot.imagePath, publicUrlForPath) ?? "",
    })),
  };
}
