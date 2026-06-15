import type { PhotoVisibility } from "./constants";

export type Photo = {
  id: string;
  storagePath: string;
  originalFilename: string;
  visibility: PhotoVisibility;
  sortOrder: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicPhoto = {
  id: string;
  publicUrl: string;
  sortOrder: number;
  createdAt: string;
};

export type PhotoInput = {
  visibility: string;
  sortOrder: number | string;
};

export type ValidPhotoInput = {
  visibility: PhotoVisibility;
  sortOrder: number;
};

export type PhotoFieldErrors = Partial<Record<keyof PhotoInput, string[]>>;

export type PhotoValidationResult =
  | { ok: true; data: ValidPhotoInput; errors: PhotoFieldErrors }
  | { ok: false; data?: undefined; errors: PhotoFieldErrors };

export type PhotoActionResult = {
  ok: boolean;
  message: string;
  photoId?: string;
  fieldErrors?: PhotoFieldErrors;
};

export type CleanupReason =
  | "create_rollback"
  | "replace_old_file"
  | "delete_asset_file";

export type CleanupTaskInput = {
  bucketId: string;
  objectPath: string;
  reason: CleanupReason;
  lastError: string | null;
};

export type StorageCleanupTask = CleanupTaskInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type PhotoUploadResult = {
  ok: boolean;
  message: string;
  photoId?: string;
  publicUrl?: string;
};

export type PublicAlbumResult = {
  photos: PublicPhoto[];
  failed: boolean;
};
