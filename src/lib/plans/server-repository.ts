import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createPlanRepository,
  type DatabaseFilter,
  type DatabaseRow,
  type PlansDatabaseClient,
} from "./repository";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";

type QueryResult = {
  data: unknown;
  count: number | null;
  error: unknown;
};

type QueryChain = PromiseLike<QueryResult> & {
  select(columns: string, options?: { count?: "exact" }): QueryChain;
  insert(values: Record<string, unknown>): QueryChain;
  update(values: Record<string, unknown>): QueryChain;
  delete(): QueryChain;
  eq(column: string, value: unknown): QueryChain;
  is(column: string, value: unknown): QueryChain;
  not(column: string, operator: string, value: unknown): QueryChain;
  in(column: string, values: unknown[]): QueryChain;
  lt(column: string, value: unknown): QueryChain;
  ilike(column: string, value: string): QueryChain;
  or(filters: string): QueryChain;
  order(column: string, options: { ascending: boolean }): QueryChain;
  range(from: number, to: number): QueryChain;
  limit(count: number): QueryChain;
  single(): Promise<QueryResult>;
  maybeSingle(): Promise<QueryResult>;
};

function from(client: SupabaseClient, table: string) {
  return client.from(table) as unknown as QueryChain;
}

function applyFilters(
  query: QueryChain,
  filters: DatabaseFilter[] = [],
  prefix = "",
) {
  return filters.reduce((current, filter) => {
    const column = `${prefix}${filter.column}`;
    switch (filter.operator) {
      case "eq":
        return current.eq(column, filter.value);
      case "is":
        return current.is(column, filter.value);
      case "not_is":
        return current.not(column, "is", filter.value);
      case "in":
        return current.in(column, filter.value as unknown[]);
      case "lt":
        return current.lt(column, filter.value);
      case "ilike":
        return current.ilike(column, String(filter.value));
    }
  }, query);
}

function createSupabasePlansDatabaseClient(
  client: SupabaseClient,
): PlansDatabaseClient {
  return {
    async selectMany(request) {
      const relationColumns = request.relation
        ? `,${request.relation.table}!inner(id)`
        : "";
      let query = from(client, request.table).select(
        `${request.columns ?? "*"}${relationColumns}`,
        { count: "exact" },
      );
      query = applyFilters(query, request.filters);
      if (request.relation) {
        query = applyFilters(
          query,
          request.relation.filters,
          `${request.relation.table}.`,
        );
      }
      if (request.search) {
        const escaped = request.search.replaceAll(",", " ");
        query = query.or(`title.ilike.%${escaped}%,summary.ilike.%${escaped}%`);
      }
      for (const order of request.orders ?? []) {
        query = query.order(order.column, { ascending: order.ascending });
      }
      if (request.range) {
        query = query.range(request.range.from, request.range.to);
      }
      const { data, count, error } = await query;
      if (error) throw error;
      return { rows: (data ?? []) as DatabaseRow[], count: count ?? 0 };
    },

    async selectOne(request) {
      let query = from(client, request.table)
        .select(request.columns ?? "*")
        .limit(1);
      query = applyFilters(query, request.filters);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return { row: (data as DatabaseRow | null) ?? null };
    },

    async insert(request) {
      const { data, error } = await from(client, request.table)
        .insert(request.values ?? {})
        .select(request.columns ?? "*")
        .single();
      if (error) throw error;
      return { row: data as DatabaseRow };
    },

    async update(request) {
      let query = from(client, request.table).update(request.values ?? {});
      query = applyFilters(query, request.filters);
      const { data, error } = request.columns
        ? await query.select(request.columns).single()
        : await query;
      if (error) throw error;
      return { row: (data ?? {}) as DatabaseRow };
    },

    async delete(request) {
      let query = from(client, request.table).delete();
      query = applyFilters(query, request.filters);
      const { error } = await query;
      if (error) throw error;
    },
  };
}

export function getPlanRepository() {
  return createPlanRepository(
    createSupabasePlansDatabaseClient(createSupabaseAdminClient()),
  );
}
