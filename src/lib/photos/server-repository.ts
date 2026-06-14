import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  CLEANUP_TASK_COLUMNS,
  createPhotoRepository,
  PHOTO_COLUMNS,
  type PhotoDatabaseClient,
  type PhotoDatabaseFilter,
  type PhotoDatabaseRow,
} from "./repository";
import { PUBLIC_MEDIA_BUCKET } from "./constants";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";

type QueryResult = { data: unknown; error: unknown };
type QueryChain = PromiseLike<QueryResult> & {
  select(columns: string): QueryChain;
  insert(values: Record<string, unknown>): QueryChain;
  update(values: Record<string, unknown>): QueryChain;
  upsert(
    values: Record<string, unknown>,
    options: { onConflict: string },
  ): QueryChain;
  delete(): QueryChain;
  eq(column: string, value: unknown): QueryChain;
  is(column: string, value: unknown): QueryChain;
  not(column: string, operator: string, value: unknown): QueryChain;
  order(column: string, options: { ascending: boolean }): QueryChain;
  limit(count: number): QueryChain;
  single(): Promise<QueryResult>;
  maybeSingle(): Promise<QueryResult>;
};

function from(client: SupabaseClient, table: string) {
  return client.from(table) as unknown as QueryChain;
}

function applyFilters(query: QueryChain, filters: PhotoDatabaseFilter[] = []) {
  return filters.reduce((current, filter) => {
    switch (filter.operator) {
      case "eq":
        return current.eq(filter.column, filter.value);
      case "is":
        return current.is(filter.column, filter.value);
      case "not_is":
        return current.not(filter.column, "is", filter.value);
    }
  }, query);
}

function columnsForTable(table: "photos" | "storage_cleanup_tasks") {
  return table === "photos" ? PHOTO_COLUMNS : CLEANUP_TASK_COLUMNS;
}

function createSupabasePhotoDatabaseClient(
  client: SupabaseClient,
): PhotoDatabaseClient {
  return {
    async selectMany(request) {
      let query = from(client, request.table).select(
        request.columns ?? columnsForTable(request.table),
      );
      query = applyFilters(query, request.filters);
      for (const order of request.orders ?? []) {
        query = query.order(order.column, { ascending: order.ascending });
      }
      const { data, error } = await query;
      if (error) throw error;
      return { rows: (data ?? []) as PhotoDatabaseRow[] };
    },

    async selectOne(request) {
      let query = from(client, request.table)
        .select(request.columns ?? columnsForTable(request.table))
        .limit(1);
      query = applyFilters(query, request.filters);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return { row: (data as PhotoDatabaseRow | null) ?? null };
    },

    async insert(request) {
      const { data, error } = await from(client, request.table)
        .insert(request.values ?? {})
        .select(request.columns ?? columnsForTable(request.table))
        .single();
      if (error) throw error;
      return { row: data as PhotoDatabaseRow };
    },

    async update(request) {
      let query = from(client, request.table).update(request.values ?? {});
      query = applyFilters(query, request.filters);
      if (!request.returning) {
        const { error } = await query;
        if (error) throw error;
        return;
      }
      const { data, error } = await query
        .select(request.columns ?? columnsForTable(request.table))
        .single();
      if (error) throw error;
      return { row: data as PhotoDatabaseRow };
    },

    async delete(request) {
      let query = from(client, request.table).delete();
      query = applyFilters(query, request.filters);
      if (request.returning) {
        const { data, error } = await query
          .select(request.columns ?? columnsForTable(request.table))
          .single();
        if (error) throw error;
        return { row: data as PhotoDatabaseRow };
      }
      const { error } = await query;
      if (error) throw error;
    },

    async upsert(request) {
      const { error } = await from(client, request.table).upsert(
        request.values ?? {},
        { onConflict: request.conflictColumn ?? "id" },
      );
      if (error) throw error;
    },
  };
}

export function getPhotoRepository() {
  const client = createSupabaseAdminClient();
  return createPhotoRepository(
    createSupabasePhotoDatabaseClient(client),
    (path) =>
      client.storage.from(PUBLIC_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl,
  );
}
