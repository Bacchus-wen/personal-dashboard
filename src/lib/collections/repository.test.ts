import { describe, expect, it } from "vitest";

import {
  createCollectionRepository,
  type CollectionDatabaseClient,
  type CollectionDatabaseRequest,
} from "./repository";
import type { ValidCollectionInput } from "./types";

const row = {
  id: "collection-id",
  title: "Reliable AI Notes",
  content_type: "article",
  source_name: "Example",
  summary: "Worth revisiting.",
  external_url: "https://example.com/article",
  cover_path: null,
  tags: ["AI"],
  visibility: "public",
  featured: true,
  sort_order: 1,
  deleted_at: null,
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-02T00:00:00.000Z",
};

function input(): ValidCollectionInput {
  return {
    title: "Reliable AI Notes",
    contentType: "article",
    sourceName: "Example",
    summary: "Worth revisiting.",
    externalUrl: "https://example.com/article",
    coverPath: null,
    tags: ["AI"],
    visibility: "public",
    featured: true,
    sortOrder: 1,
  };
}

function database() {
  const requests: CollectionDatabaseRequest[] = [];
  const client: CollectionDatabaseClient = {
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

describe("createCollectionRepository", () => {
  it("always filters public, active collections and limits to 100", async () => {
    const { client, requests } = database();
    const repository = createCollectionRepository(client);

    await repository.listPublic({ type: "article", search: null, tag: null });

    expect(requests[0]).toMatchObject({
      filters: [
        { column: "visibility", operator: "eq", value: "public" },
        { column: "deleted_at", operator: "is", value: null },
        { column: "content_type", operator: "eq", value: "article" },
      ],
      orders: [
        { column: "featured", ascending: false },
        { column: "sort_order", ascending: true },
        { column: "updated_at", ascending: false },
      ],
      limit: 100,
    });
  });

  it("applies type, search, and tag filters", async () => {
    const { client, requests } = database();
    const repository = createCollectionRepository(client);

    await repository.listPublic({
      type: "video",
      search: "systems",
      tag: "AI",
    });

    expect(requests[0].filters).toContainEqual({
      column: "content_type",
      operator: "eq",
      value: "video",
    });
    expect(requests[0].filters).toContainEqual({
      column: "tags",
      operator: "contains",
      value: ["AI"],
    });
    expect(requests[0].search).toBe("systems");
  });

  it("lists active admin collections separately from trash", async () => {
    const { client, requests } = database();
    const repository = createCollectionRepository(client);

    await repository.listAdmin({
      search: null,
      type: null,
      visibility: null,
    });
    await repository.listTrash();

    expect(requests[0].filters).toEqual([
      { column: "deleted_at", operator: "is", value: null },
    ]);
    expect(requests[1].filters).toEqual([
      { column: "deleted_at", operator: "not_is", value: null },
    ]);
  });

  it("saves normalized input with a direct insert", async () => {
    const { client, requests } = database();
    const repository = createCollectionRepository(client);

    await repository.save(null, input());

    expect(requests[0]).toMatchObject({
      table: "collections",
      values: {
        title: "Reliable AI Notes",
        content_type: "article",
        external_url: "https://example.com/article",
      },
      returning: true,
    });
  });

  it("restores trashed collections as drafts", async () => {
    const { client, requests } = database();
    const repository = createCollectionRepository(client);

    await repository.restore("collection-id");

    expect(requests[0]).toMatchObject({
      filters: [
        { column: "id", operator: "eq", value: "collection-id" },
        { column: "deleted_at", operator: "not_is", value: null },
      ],
      values: { deleted_at: null, visibility: "draft" },
    });
  });

  it("permanently deletes only trashed collections", async () => {
    const { client, requests } = database();
    const repository = createCollectionRepository(client);

    await repository.permanentlyDelete("collection-id");

    expect(requests[0].filters).toContainEqual({
      column: "deleted_at",
      operator: "not_is",
      value: null,
    });
  });
});
