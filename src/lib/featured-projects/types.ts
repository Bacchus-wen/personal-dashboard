import type { RecommendationVisibility } from "./constants";

export type FeaturedProject = {
  id: string;
  name: string;
  repositoryUrl: string | null;
  summary: string | null;
  recommendation: string | null;
  language: string | null;
  tags: string[];
  starCount: number | null;
  starRecordedOn: string | null;
  visibility: RecommendationVisibility;
  featured: boolean;
  sortOrder: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FeaturedProjectInput = {
  name: string;
  repositoryUrl: string | null;
  summary: string | null;
  recommendation: string | null;
  language: string | null;
  tags: string[];
  starCount: number | string | null;
  starRecordedOn: string | null;
  visibility: string;
  featured: boolean;
  sortOrder: number | string;
};

export type ValidFeaturedProjectInput = Omit<
  FeaturedProjectInput,
  "starCount" | "visibility" | "sortOrder"
> & {
  starCount: number | null;
  visibility: RecommendationVisibility;
  sortOrder: number;
};

export type FeaturedProjectFieldErrors = Partial<
  Record<keyof FeaturedProjectInput, string[]>
>;

export type FeaturedProjectValidationResult =
  | {
      ok: true;
      data: ValidFeaturedProjectInput;
      errors: FeaturedProjectFieldErrors;
    }
  | {
      ok: false;
      data?: undefined;
      errors: FeaturedProjectFieldErrors;
    };

export type FeaturedProjectActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: FeaturedProjectFieldErrors;
  projectId?: string;
};

export type FeaturedProjectListResult = {
  projects: FeaturedProject[];
  availableLanguages: string[];
  availableTags: string[];
};
