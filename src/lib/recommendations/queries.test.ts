import { describe, expect, it } from "vitest";

import type { Collection } from "../collections/types";
import type { FeaturedProject } from "../featured-projects/types";
import {
  collectionToHomeRecommendation,
  projectToHomeRecommendation,
  selectHomeRecommendation,
} from "./queries";

function collection(overrides: Partial<Collection> = {}): Collection {
  return {
    id: "collection-id",
    title: "Reliable AI Notes",
    contentType: "article",
    sourceName: null,
    summary: "Worth revisiting.",
    externalUrl: "https://example.com/article",
    coverPath: null,
    tags: [],
    visibility: "public",
    featured: true,
    sortOrder: 0,
    deletedAt: null,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

function project(overrides: Partial<FeaturedProject> = {}): FeaturedProject {
  return {
    id: "project-id",
    name: "Focused Toolkit",
    repositoryUrl: "https://github.com/example/focused-toolkit",
    summary: "Small and focused.",
    recommendation: "A useful example.",
    language: null,
    tags: [],
    starCount: null,
    starRecordedOn: null,
    visibility: "public",
    featured: true,
    sortOrder: 0,
    deletedAt: null,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

describe("home recommendations", () => {
  it("maps public featured collections to article or video recommendations", () => {
    expect(collectionToHomeRecommendation(collection())).toEqual({
      id: "collection-id",
      type: "article",
      title: "Reliable AI Notes",
      reason: "Worth revisiting.",
      href: "https://example.com/article",
    });
    expect(
      collectionToHomeRecommendation(collection({ contentType: "video" }))?.type,
    ).toBe("video");
  });

  it("maps public featured projects to project recommendations", () => {
    expect(projectToHomeRecommendation(project())).toEqual({
      id: "project-id",
      type: "project",
      title: "Focused Toolkit",
      reason: "A useful example.",
      href: "https://github.com/example/focused-toolkit",
    });
  });

  it("drops incomplete or ineligible candidates", () => {
    expect(collectionToHomeRecommendation(collection({ featured: false }))).toBeNull();
    expect(projectToHomeRecommendation(project({ recommendation: null }))).toBeNull();
  });

  it("returns null when there are no candidates", () => {
    expect(selectHomeRecommendation([])).toBeNull();
  });

  it("uses the injected random function to select one candidate", () => {
    const candidates = [
      collectionToHomeRecommendation(collection())!,
      projectToHomeRecommendation(project())!,
    ];
    expect(selectHomeRecommendation(candidates, () => 0.99)).toEqual(candidates[1]);
  });
});
