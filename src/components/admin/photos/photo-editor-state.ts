import type { PhotoVisibility } from "@/lib/photos/constants";

export type PhotoEditorFormState = {
  visibility: PhotoVisibility;
  sortOrder: number;
};

export function photoEditorFormKey({ visibility, sortOrder }: PhotoEditorFormState) {
  return `${visibility}:${sortOrder}`;
}
