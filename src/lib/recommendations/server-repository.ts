import "server-only";

import { getCollectionRepository } from "../collections/server-repository";
import { getFeaturedProjectRepository } from "../featured-projects/server-repository";
import {
  collectionToHomeRecommendation,
  projectToHomeRecommendation,
  selectHomeRecommendation,
} from "./queries";

export async function loadHomeRecommendation() {
  try {
    const [collections, projects] = await Promise.all([
      getCollectionRepository().listFeatured(),
      getFeaturedProjectRepository().listFeatured(),
    ]);
    const candidates = [
      ...collections.map(collectionToHomeRecommendation),
      ...projects.map(projectToHomeRecommendation),
    ].filter((candidate) => candidate !== null);
    return selectHomeRecommendation(candidates);
  } catch {
    return null;
  }
}
