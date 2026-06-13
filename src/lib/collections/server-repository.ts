import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  COLLECTION_COLUMNS,
  createCollectionRepository,
  type CollectionDatabaseClient,
  type CollectionDatabaseFilter,
  type CollectionDatabaseRow,
} from "./repository";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";

type QueryResult = { data: unknown; error: unknown };
type QueryChain = PromiseLike<QueryResult> & {
  select(columns: string): QueryChain;
  insert(values: Record<string, unknown>): QueryChain;
  update(values: Record<string, unknown>): QueryChain;
  delete(): QueryChain;
  eq(column: string, value: unknown): QueryChain;
  is(column: string, value: unknown): QueryChain;
  not(column: string, operator: string, value: unknown): QueryChain;
  contains(column: string, value: unknown): QueryChain;
  or(filters: string): QueryChain;
  order(column: string, options: { ascending: boolean }): QueryChain;
  limit(count: number): QueryChain;
  single(): Promise<QueryResult>;
  maybeSingle(): Promise<QueryResult>;
};

function from(client: SupabaseClient, table: string) {
  return client.from(table) as unknown as QueryChain;
}

function applyFilters(
  query: QueryChain,
  filters: CollectionDatabaseFilter[] = [],
) {
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

function createSupabaseCollectionDatabaseClient(
  client: SupabaseClient,
): CollectionDatabaseClient {
  return {
    async selectMany(request) {
      let query = from(client, request.table).select(request.columns ?? "*");
      query = applyFilters(query, request.filters);
      if (request.search) {
        const escaped = request.search.replaceAll(",", " ");
        query = query.or(
          `title.ilike.%${escaped}%,source_name.ilike.%${escaped}%,summary.ilike.%${escaped}%`,
        );
      }
      for (const order of request.orders ?? []) {
        query = query.order(order.column, { ascending: order.ascending });
      }
      if (request.limit) query = query.limit(request.limit);
      const { data, error } = await query;
      if (error) throw error;
      return { rows: (data ?? []) as CollectionDatabaseRow[] };
    },

    async selectOne(request) {
      let query = from(client, request.table)
        .select(request.columns ?? "*")
        .limit(1);
      query = applyFilters(query, request.filters);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return { row: (data as CollectionDatabaseRow | null) ?? null };
    },

    async insert(request) {
      const { data, error } = await from(client, request.table)
        .insert(request.values ?? {})
        .select(request.columns ?? COLLECTION_COLUMNS)
        .single();
      if (error) throw error;
      return { row: data as CollectionDatabaseRow };
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
        .select(request.columns ?? COLLECTION_COLUMNS)
        .single();
      if (error) throw error;
      return { row: data as CollectionDatabaseRow };
    },

    async delete(request) {
      let query = from(client, request.table).delete();
      query = applyFilters(query, request.filters);
      const { error } = await query;
      if (error) throw error;
    },
  };
}

export function getCollectionRepository() {
  return createCollectionRepository(
    createSupabaseCollectionDatabaseClient(createSupabaseAdminClient()),
  );
}
