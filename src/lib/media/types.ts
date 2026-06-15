import type { MEDIA_PURPOSES, MEDIA_VARIANTS } from "./constants";

export type MediaPurpose = (typeof MEDIA_PURPOSES)[number];
export type MediaVariant = (typeof MEDIA_VARIANTS)[number];
export type MediaExtension = "webp" | "ico" | "png" | "svg";
export type MediaCleanupReason =
  | "create_rollback"
  | "replace_old_file"
  | "delete_asset_file";

export type MediaTargetInput = {
  purpose: string;
  variant: string;
  ownerId?: string | null;
};

export type MediaTarget = {
  purpose: MediaPurpose;
  variant: MediaVariant;
  ownerId: string | null;
};

export type MediaUploadResult = {
  ok: boolean;
  message: string;
  path?: string;
  publicUrl?: string;
};

export type MediaDeleteResult = {
  ok: boolean;
  message: string;
};
