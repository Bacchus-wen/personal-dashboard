import { isSystemMediaPath } from "./path";

export function resolveMediaDisplayUrl(
  path: string | null,
  publicUrlForPath: (path: string) => string,
) {
  return path && isSystemMediaPath(path) ? publicUrlForPath(path) : path;
}
