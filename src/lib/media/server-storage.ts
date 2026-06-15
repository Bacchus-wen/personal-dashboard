import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { MEDIA_BUCKET } from "./constants";
import {
  createMediaStorageService,
  type MediaCleanupClient,
  type MediaStorageClient,
} from "./storage";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";

type QueryResult = { error: unknown };
type QueryChain = PromiseLike<QueryResult> & {
  upsert(
    values: Record<string, unknown>,
    options: { onConflict: string },
  ): QueryChain;
};

function from(client: SupabaseClient, table: string) {
  return client.from(table) as unknown as QueryChain;
}

function createMediaCleanupClient(client: SupabaseClient): MediaCleanupClient {
  return {
    async upsertCleanupTask(input) {
      const { error } = await from(client, "storage_cleanup_tasks").upsert(
        {
          bucket_id: input.bucketId,
          object_path: input.objectPath,
          reason: input.reason,
          last_error: input.lastError,
        },
        { onConflict: "object_path" },
      );
      if (error) throw error;
    },
  };
}

export function getMediaStorageService() {
  const client = createSupabaseAdminClient();
  const bucket = client.storage.from(MEDIA_BUCKET);
  const storage: MediaStorageClient = {
    async upload(path, bytes, contentType) {
      const { error } = await bucket.upload(path, bytes, {
        contentType,
        upsert: false,
      });
      if (error) throw error;
    },
    async remove(path) {
      const { error } = await bucket.remove([path]);
      if (error) throw error;
    },
    getPublicUrl(path) {
      return bucket.getPublicUrl(path).data.publicUrl;
    },
  };

  return createMediaStorageService({
    storage,
    cleanup: createMediaCleanupClient(client),
  });
}

export function getMediaPublicUrl(path: string) {
  return createSupabaseAdminClient()
    .storage.from(MEDIA_BUCKET)
    .getPublicUrl(path).data.publicUrl;
}
