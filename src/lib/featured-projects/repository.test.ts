import { describe, expect, it } from "vitest";

import {
  createFeaturedProjectRepository,
  type FeaturedProjectDatabaseClient,
  type FeaturedProjectDatabaseRequest,
} from "./repository";
import type { ValidFeaturedProjectInput } from "./types";

const row = {
  id: "project-id",
  name: "Focused Toolkit",
  repository_url: "https://github.com/example/focused-toolkit",
  summary: "Small and focused.",
  recommendation: "A useful example.",
  cover_path:
    "projects/project-id/cover/00000000-0000-4000-8000-000000000001.webp",
  language: "TypeScript",
  tags: ["Tools"],
  star_count: 12400,
  star_recorded_on: "2026-06-14",
  visibility: "public",
  featured: true,
  sort_order: 1,
  deleted_at: null,
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-02T00:00:00.000Z",
};

function input(): ValidFeaturedProjectInput {
  return {
    name: "Focused Toolkit",
    repositoryUrl: "https://github.com/example/focused-toolkit",
    summary: "Small and focused.",
    recommendation: "A useful example.",
    coverPath:
      "projects/project-id/cover/00000000-0000-4000-8000-000000000001.webp",
    language: "TypeScript",
    tags: ["Tools"],
    starCount: 12400,
    starRecordedOn: "2026-06-14",
    visibility: "public",
    featured: true,
    sortOrder: 1,
  };
}

function database() {
  const requests: FeaturedProjectDatabaseRequest[] = [];
  const client: FeaturedProjectDatabaseClient = {
    async selectMany(request) {
      requests.push(request);
      return { rows: [row] };
    },
    async selectOne(request) {
      requests.push(request);
      return { row };
    },
    async insert(request) {
      requests.push(request);
      return { row };
    },
    async update(request) {
      requests.push(request);
      return request.returning ? { row } : undefined;
    },
    async delete(request) {
      requests.push(request);
    },
  };
  return { client, requests };
}

describe("createFeaturedProjectRepository", () => {
  it("protects, sorts, and limits public projects", async () => {
    const { client, requests } = database();
    const repository = createFeaturedProjectRepository(client);

    const result = await repository.listPublic({
      search: null,
      language: null,
      tag: null,
    });

    expect(result.projects[0]).toMatchObject({
      starCount: 12400,
      starRecordedOn: "2026-06-14",
    });
    expect(requests[0]).toMatchObject({
      filters: [
        { column: "visibility", operator: "eq", value: "public" },
        { column: "deleted_at", operator: "is", value: null },
      ],
      orders: [
        { column: "featured", ascending: false },
        { column: "sort_order", ascending: true },
        { column: "updated_at", ascending: false },
      ],
      limit: 100,
    });
  });

  it("applies language, tag, and search filters", async () => {
    const { client, requests } = database();
    const repository = createFeaturedProjectRepository(client);

    await repository.listPublic({
      search: "focused",
      language: "TypeScript",
      tag: "Tools",
    });

    expect(requests[0].filters).toContainEqual({
      column: "language",
      operator: "eq",
      value: "TypeScript",
    });
    expect(requests[0].filters).toContainEqual({
      column: "tags",
      operator: "contains",
      value: ["Tools"],
    });
    expect(requests[0].search).toBe("focused");
  });

  it("lists only featured public candidates", async () => {
    const { client, requests } = database();
    const repository = createFeaturedProjectRepository(client);

    await repository.listFeatured();

    expect(requests[0].filters).toContainEqual({
      column: "featured",
      operator: "eq",
      value: true,
    });
  });

  it("saves Star snapshot fields with a direct insert", async () => {
    const { client, requests } = database();
    const repository = createFeaturedProjectRepository(client);

    await repository.save(null, input());

    expect(requests[0].values).toMatchObject({
      cover_path:
        "projects/project-id/cover/00000000-0000-4000-8000-000000000001.webp",
      star_count: 12400,
      star_recorded_on: "2026-06-14",
    });
  });

  it("restores trashed projects as drafts and only deletes trash", async () => {
    const { client, requests } = database();
    const repository = createFeaturedProjectRepository(client);

    await repository.restore("project-id");
    await repository.permanentlyDelete("project-id");

    expect(requests[0].values).toEqual({
      deleted_at: null,
      visibility: "draft",
    });
    expect(requests[1].filters).toContainEqual({
      column: "deleted_at",
      operator: "not_is",
      value: null,
    });
  });
});
