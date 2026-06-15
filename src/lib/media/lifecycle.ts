import { isSystemMediaPath } from "./path";

export function obsoleteSystemMediaPaths(
  previousPaths: (string | null | undefined)[],
  nextPaths: (string | null | undefined)[],
) {
  const retained = new Set(nextPaths.filter((path): path is string => Boolean(path)));

  return [...new Set(previousPaths)]
    .filter((path): path is string => Boolean(path))
    .filter((path) => isSystemMediaPath(path) && !retained.has(path));
}

export async function cleanupObsoleteMedia(
  paths: string[],
  deleteObject: (path: string) => Promise<void>,
) {
  await Promise.allSettled(paths.map((path) => deleteObject(path)));
}
