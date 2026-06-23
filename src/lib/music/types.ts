export type MusicTrack = {
  id: string;
  title: string;
  artist: string | null;
  audioPath: string;
  coverPath: string | null;
  isActive: boolean;
  sortOrder: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MusicTrackInput = {
  title: string;
  artist: string | null;
  audioPath: string | null;
  coverPath: string | null;
  isActive: boolean;
  sortOrder: number | string;
};

export type ValidMusicTrackInput = Omit<
  MusicTrackInput,
  "audioPath" | "sortOrder"
> & {
  audioPath: string;
  sortOrder: number;
};

export type MusicTrackFieldErrors = Partial<
  Record<keyof MusicTrackInput, string[]>
>;

export type MusicTrackValidationResult =
  | {
      ok: true;
      data: ValidMusicTrackInput;
      errors: MusicTrackFieldErrors;
    }
  | {
      ok: false;
      data?: undefined;
      errors: MusicTrackFieldErrors;
    };

export type MusicTrackActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: MusicTrackFieldErrors;
  trackId?: string;
};
