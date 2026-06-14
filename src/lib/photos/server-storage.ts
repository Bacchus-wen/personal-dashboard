import "server-only";

import { PUBLIC_MEDIA_BUCKET } from "./constants";
import { getPhotoRepository } from "./server-repository";
import {
  createPhotoStorageService,
  type PhotoStorageClient,
} from "./storage";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";

export function getPhotoStorageService() {
  const client = createSupabaseAdminClient();
  const bucket = client.storage.from(PUBLIC_MEDIA_BUCKET);
  const storage: PhotoStorageClient = {
    async upload(path, bytes) {
      const { error } = await bucket.upload(path, bytes, {
        contentType: "image/webp",
        upsert: false,
      });
      if (error) throw error;
    },
    async remove(path) {
      const { error } = await bucket.remove([path]);
      if (error) throw error;
    },
    publicUrl(path) {
      return bucket.getPublicUrl(path).data.publicUrl;
    },
  };

  return createPhotoStorageService({
    repository: getPhotoRepository(),
    storage,
  });
}

export function getPhotoPublicUrl(path: string) {
  return createSupabaseAdminClient()
    .storage.from(PUBLIC_MEDIA_BUCKET)
    .getPublicUrl(path).data.publicUrl;
}
