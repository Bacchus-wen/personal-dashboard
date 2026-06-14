import type { Collection } from "../collections/types";
import type { FeaturedProject } from "../featured-projects/types";
import type { HomeRecommendation } from "./types";

export function collectionToHomeRecommendation(
  collection: Collection,
): HomeRecommendation | null {
  if (
    collection.visibility !== "public" ||
    collection.deletedAt !== null ||
    !collection.featured ||
    !collection.summary ||
    !collection.externalUrl
  ) {
    return null;
  }

  return {
    id: collection.id,
    type: collection.contentType,
    title: collection.title,
    reason: collection.summary,
    href: collection.externalUrl,
  };
}

export function projectToHomeRecommendation(
  project: FeaturedProject,
): HomeRecommendation | null {
  if (
    project.visibility !== "public" ||
    project.deletedAt !== null ||
    !project.featured ||
    !project.recommendation ||
    !project.repositoryUrl
  ) {
    return null;
  }

  return {
    id: project.id,
    type: "project",
    title: project.name,
    reason: project.recommendation,
    href: project.repositoryUrl,
  };
}

export function selectHomeRecommendation(
  candidates: HomeRecommendation[],
  random: () => number = Math.random,
) {
  if (!candidates.length) return null;
  return candidates[Math.floor(random() * candidates.length)] ?? candidates[0];
}
