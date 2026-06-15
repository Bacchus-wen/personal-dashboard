import { isSystemMediaPath } from "./path";
import { MEDIA_BUCKET } from "./constants";

export function publicMediaUrlForPath(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return baseUrl
    ? `${baseUrl}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`
    : path;
}

export function resolveMediaDisplayUrl(
  path: string | null,
  publicUrlForPath: (path: string) => string,
) {
  return path && isSystemMediaPath(path) ? publicUrlForPath(path) : path;
}
