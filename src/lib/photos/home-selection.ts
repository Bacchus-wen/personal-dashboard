import type { PublicPhoto } from "./types";

export function pickRandomHomePhotos(
  photos: PublicPhoto[],
  limit = 3,
  random: () => number = Math.random,
) {
  const candidates = [...photos];
  const count = Math.min(Math.max(0, limit), candidates.length);

  for (let index = 0; index < count; index += 1) {
    const remaining = candidates.length - index;
    const selected = index + Math.floor(random() * remaining);
    [candidates[index], candidates[selected]] = [
      candidates[selected],
      candidates[index],
    ];
  }

  return candidates.slice(0, count);
}
