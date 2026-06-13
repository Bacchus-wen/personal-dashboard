import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createWorkRepository,
  WORK_COLUMNS,
  type WorkDatabaseClient,
  type WorkDatabaseFilter,
  type WorkDatabaseRow,
} from "./repository";
import type { ValidWorkInput } from "./types";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";

type QueryResult = { data: unknown; error: unknown };
type QueryChain = PromiseLike<QueryResult> & {
  select(columns: string): QueryChain;
  update(values: Record<string, unknown>): QueryChain;
  delete(): QueryChain;
  eq(column: string, value: unknown): QueryChain;
  is(column: string, value: unknown): QueryChain;
  not(column: string, operator: string, value: unknown): QueryChain;
  contains(column: string, value: unknown): QueryChain;
  or(filters: string): QueryChain;
  order(column: string, options: { ascending: boolean }): QueryChain;
  limit(count: number): QueryChain;
  maybeSingle(): Promise<QueryResult>;
};

function from(client: SupabaseClient, table: string) {
  return client.from(table) as unknown as QueryChain;
}

function applyFilters(query: QueryChain, filters: WorkDatabaseFilter[] = []) {
  return filters.reduce((current, filter) => {
    switch (filter.operator) {
      case "eq":
        return current.eq(filter.column, filter.value);
      case "is":
        return current.is(filter.column, filter.value);
      case "not_is":
        return current.not(filter.column, "is", filter.value);
      case "contains":
        return current.contains(filter.column, filter.value);
    }
  }, query);
}

function workPayload(input: ValidWorkInput) {
  return {
    name: input.name,
    slug: input.slug,
    summary: input.summary,
    description: input.description,
    cover_path: input.coverPath,
    tech_stack: input.techStack,
    status: input.status,
    visibility: input.visibility,
    started_on: input.startedOn,
    completed_on: input.completedOn,
    website_url: input.websiteUrl,
    github_url: input.githubUrl,
    website_available: input.websiteAvailable,
    featured: input.featured,
    sort_order: input.sortOrder,
    seo_title: input.seoTitle,
    seo_description: input.seoDescription,
    seo_image_path: input.seoImagePath,
  };
}

function screenshotPayload(input: ValidWorkInput) {
  return input.screenshots.map((screenshot) => ({
    image_path: screenshot.imagePath,
    caption: screenshot.caption,
    sort_order: screenshot.sortOrder,
  }));
}

function createSupabaseWorkDatabaseClient(
  client: SupabaseClient,
): WorkDatabaseClient {
  return {
    async selectMany(request) {
      let query = from(client, request.table).select(request.columns ?? "*");
      query = applyFilters(query, request.filters);
      if (request.search) {
        const escaped = request.search.replaceAll(",", " ");
        query = query.or(`name.ilike.%${escaped}%,summary.ilike.%${escaped}%`);
      }
      for (const order of request.orders ?? []) {
        query = query.order(order.column, { ascending: order.ascending });
      }
      const { data, error } = await query;
      if (error) throw error;
      return { rows: (data ?? []) as WorkDatabaseRow[] };
    },
    async selectOne(request) {
      let query = from(client, request.table)
        .select(request.columns ?? "*")
        .limit(1);
      query = applyFilters(query, request.filters);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return { row: (data as WorkDatabaseRow | null) ?? null };
    },
    async update(request) {
      let query = from(client, request.table).update(request.values ?? {});
      query = applyFilters(query, request.filters);
      const { error } = await query;
      if (error) throw error;
    },
    async delete(request) {
      let query = from(client, request.table).delete();
      query = applyFilters(query, request.filters);
      const { error } = await query;
      if (error) throw error;
    },
    async saveWork(id, input) {
      const { data: savedId, error } = await client.rpc(
        "save_work_with_screenshots",
        {
          work_id: id,
          work_payload: workPayload(input),
          screenshots_payload: screenshotPayload(input),
        },
      );
      if (error) throw error;
      const repositoryClient = createSupabaseWorkDatabaseClient(client);
      const { row } = await repositoryClient.selectOne({
        table: "works",
        columns: WORK_COLUMNS,
        filters: [{ column: "id", operator: "eq", value: String(savedId) }],
      });
      if (!row) throw new Error("Saved work not found");
      return { row };
    },
  };
}

export function getWorkRepository() {
  return createWorkRepository(
    createSupabaseWorkDatabaseClient(createSupabaseAdminClient()),
  );
}
