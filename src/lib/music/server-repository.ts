import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import {
  MUSIC_TRACK_COLUMNS,
  createMusicTrackRepository,
  type MusicTrackDatabaseClient,
  type MusicTrackDatabaseFilter,
  type MusicTrackDatabaseRow,
} from "./repository";

type QueryResult = { data: unknown; error: unknown };
type QueryChain = PromiseLike<QueryResult> & {
  select(columns: string): QueryChain;
  insert(values: Record<string, unknown>): QueryChain;
  update(values: Record<string, unknown>): QueryChain;
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

function applyFilters(
  query: QueryChain,
  filters: MusicTrackDatabaseFilter[] = [],
) {
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

function createSupabaseMusicTrackDatabaseClient(
  client: SupabaseClient,
): MusicTrackDatabaseClient {
  return {
    async selectMany(request) {
      let query = from(client, request.table).select(request.columns ?? "*");
      query = applyFilters(query, request.filters);
      for (const order of request.orders ?? []) {
        query = query.order(order.column, { ascending: order.ascending });
      }
      const { data, error } = await query;
      if (error) throw error;
      return { rows: (data ?? []) as MusicTrackDatabaseRow[] };
    },

    async selectOne(request) {
      let query = from(client, request.table)
        .select(request.columns ?? "*")
        .limit(1);
      query = applyFilters(query, request.filters);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return { row: (data as MusicTrackDatabaseRow | null) ?? null };
    },

    async insert(request) {
      const { data, error } = await from(client, request.table)
        .insert(request.values ?? {})
        .select(request.columns ?? MUSIC_TRACK_COLUMNS)
        .single();
      if (error) throw error;
      return { row: data as MusicTrackDatabaseRow };
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
        .select(request.columns ?? MUSIC_TRACK_COLUMNS)
        .single();
      if (error) throw error;
      return { row: data as MusicTrackDatabaseRow };
    },

    async delete(request) {
      let query = from(client, request.table).delete();
      query = applyFilters(query, request.filters);
      const { error } = await query;
      if (error) throw error;
    },
  };
}

export function getMusicTrackRepository() {
  return createMusicTrackRepository(
    createSupabaseMusicTrackDatabaseClient(createSupabaseAdminClient()),
  );
}
