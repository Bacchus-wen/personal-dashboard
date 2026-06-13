import { describe, expect, it } from "vitest";

import {
  WorkRepositoryError,
  createWorkRepository,
  type WorkDatabaseClient,
  type WorkDatabaseRequest,
} from "./repository";
import type { ValidWorkInput } from "./types";

const workRow = {
  id: "work-id",
  name: "Dashboard",
  slug: "dashboard",
  summary: "摘要",
  description: "详情",
  cover_path: null,
  tech_stack: ["Next.js"],
  status: "maintained",
  visibility: "public",
  started_on: null,
  completed_on: null,
  website_url: "https://example.com/",
  github_url: null,
  website_available: true,
  featured: false,
  sort_order: 1,
  seo_title: null,
  seo_description: null,
  seo_image_path: null,
  deleted_at: null,
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-02T00:00:00.000Z",
  work_screenshots: [],
};

function input(): ValidWorkInput {
  return {
    name: "Dashboard",
    slug: "dashboard",
    summary: "摘要",
    description: "详情",
    coverPath: null,
    techStack: ["Next.js"],
    status: "maintained",
    visibility: "public",
    startedOn: null,
    completedOn: null,
    websiteUrl: "https://example.com/",
    githubUrl: null,
    websiteAvailable: true,
    featured: false,
    sortOrder: 1,
    seoTitle: null,
    seoDescription: null,
    seoImagePath: null,
    screenshots: [],
  };
}

function createClient(overrides: Partial<WorkDatabaseClient> = {}) {
  const requests: WorkDatabaseRequest[] = [];
  const saves: { id: string | null; input: ValidWorkInput }[] = [];
  const client: WorkDatabaseClient = {
    async selectMany(request) {
      requests.push(request);
      return { rows: [workRow] };
    },
    async selectOne(request) {
      requests.push(request);
      return { row: workRow };
    },
    async update(request) {
      requests.push(request);
    },
    async delete(request) {
      requests.push(request);
    },
    async saveWork(id, workInput) {
      saves.push({ id, input: workInput });
      return { row: workRow };
    },
    ...overrides,
  };
  return { client, requests, saves };
}

describe("createWorkRepository", () => {
  it("always protects the public listing and applies confirmed sorting", async () => {
    const { client, requests } = createClient();
    const repository = createWorkRepository(client);

    await repository.listPublicWorks({ status: null, tech: null });

    expect(requests[0]).toMatchObject({
      table: "works",
      filters: [
        { column: "visibility", operator: "eq", value: "public" },
        { column: "deleted_at", operator: "is", value: null },
        { column: "slug", operator: "not_is", value: null },
      ],
      orders: [
        { column: "sort_order", ascending: true },
        { column: "updated_at", ascending: false },
      ],
    });
  });

  it("applies public status and technology filters", async () => {
    const { client, requests } = createClient();
    const repository = createWorkRepository(client);

    await repository.listPublicWorks({ status: "maintained", tech: "Next.js" });

    expect(requests[0].filters).toContainEqual({
      column: "status",
      operator: "eq",
      value: "maintained",
    });
    expect(requests[0].filters).toContainEqual({
      column: "tech_stack",
      operator: "contains",
      value: ["Next.js"],
    });
  });

  it("saves a work and screenshots through one atomic client call", async () => {
    const { client, saves } = createClient();
    const repository = createWorkRepository(client);

    await repository.saveWork(null, input());

    expect(saves).toEqual([{ id: null, input: input() }]);
  });

  it("restores trashed works as drafts", async () => {
    const { client, requests } = createClient();
    const repository = createWorkRepository(client);

    await repository.restoreWork("work-id");

    expect(requests[0]).toMatchObject({
      table: "works",
      filters: [
        { column: "id", operator: "eq", value: "work-id" },
        { column: "deleted_at", operator: "not_is", value: null },
      ],
      values: { deleted_at: null, visibility: "draft" },
    });
  });

  it("wraps read failures without exposing database details", async () => {
    const { client } = createClient({
      async selectMany() {
        throw new Error("secret");
      },
    });
    const repository = createWorkRepository(client);

    await expect(
      repository.listPublicWorks({ status: null, tech: null }),
    ).rejects.toEqual(new WorkRepositoryError("READ_FAILED"));
  });
});
