import { PHOTO_GROUP_SIZE } from "./constants";

export function totalPhotoGroups(total: number) {
  return Math.max(1, Math.ceil(Math.max(0, total) / PHOTO_GROUP_SIZE));
}

export function groupPhotos<T>(photos: T[], group: number) {
  const normalized = Math.max(1, Math.min(group, totalPhotoGroups(photos.length)));
  const start = (normalized - 1) * PHOTO_GROUP_SIZE;
  return photos.slice(start, start + PHOTO_GROUP_SIZE);
}

function hashString(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function bounded(seed: number, min: number, max: number) {
  return min + (seed % (max - min + 1));
}

export function polaroidTransform(id: string) {
  const hash = hashString(id);
  return {
    x: bounded(hash, -96, 96),
    y: bounded(hash >>> 8, -28, 42),
    rotate: bounded(hash >>> 16, -10, 10),
  };
}
