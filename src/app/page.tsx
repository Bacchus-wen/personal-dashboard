import { HomeDashboard } from "@/components/home/home-dashboard";
import { getMusicTrackRepository } from "@/lib/music/server-repository";
import { pickRandomHomePhotos } from "@/lib/photos/home-selection";
import { getPhotoRepository } from "@/lib/photos/server-repository";
import { getPlanRepository } from "@/lib/plans/server-repository";
import { loadHomeRecommendation } from "@/lib/recommendations/server-repository";
import { cloneDefaultSiteConfiguration } from "@/lib/site-settings/defaults";
import { getSiteSettingsRepository } from "@/lib/site-settings/server-repository";

async function loadHomePlans() {
  try {
    return await getPlanRepository().getHomePlanCandidates();
  } catch {
    return null;
  }
}

async function loadHomePhotos() {
  try {
    return pickRandomHomePhotos(await getPhotoRepository().listPublic(), 3);
  } catch {
    return null;
  }
}

async function loadHomeMusic() {
  try {
    return await getMusicTrackRepository().listActive();
  } catch {
    return null;
  }
}

export default async function Home() {
  const [planCandidates, configuration, recommendation, photos, musicTrack] = await Promise.all([
    loadHomePlans(),
    getSiteSettingsRepository()
      .getPublished()
      .catch(() => cloneDefaultSiteConfiguration()),
    loadHomeRecommendation(),
    loadHomePhotos(),
    loadHomeMusic(),
  ]);
  return (
    <HomeDashboard
      configuration={configuration}
      musicTrack={musicTrack}
      photos={photos}
      planCandidates={planCandidates}
      recommendation={recommendation}
    />
  );
}
