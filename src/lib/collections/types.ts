import type {
  CollectionContentType,
  RecommendationVisibility,
} from "./constants";

export type Collection = {
  id: string;
  title: string;
  contentType: CollectionContentType;
  sourceName: string | null;
  summary: string | null;
  externalUrl: string | null;
  coverPath: string | null;
  tags: string[];
  visibility: RecommendationVisibility;
  featured: boolean;
  sortOrder: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CollectionInput = {
  title: string;
  contentType: string;
  sourceName: string | null;
  summary: string | null;
  externalUrl: string | null;
  coverPath: string | null;
  tags: string[];
  visibility: string;
  featured: boolean;
  sortOrder: number | string;
};

export type ValidCollectionInput = Omit<
  CollectionInput,
  "contentType" | "visibility" | "sortOrder"
> & {
  contentType: CollectionContentType;
  visibility: RecommendationVisibility;
  sortOrder: number;
};

export type CollectionFieldErrors = Partial<
  Record<keyof CollectionInput, string[]>
>;

export type CollectionValidationResult =
  | {
      ok: true;
      data: ValidCollectionInput;
      errors: CollectionFieldErrors;
    }
  | {
      ok: false;
      data?: undefined;
      errors: CollectionFieldErrors;
    };

export type CollectionActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: CollectionFieldErrors;
  collectionId?: string;
};

export type CollectionListResult = {
  collections: Collection[];
  availableTags: string[];
};
