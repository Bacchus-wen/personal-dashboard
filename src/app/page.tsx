import { HomeDashboard } from "@/components/home/home-dashboard";
import { getPlanRepository } from "@/lib/plans/server-repository";
import { cloneDefaultSiteConfiguration } from "@/lib/site-settings/defaults";
import { getSiteSettingsRepository } from "@/lib/site-settings/server-repository";

async function loadHomePlans() {
  try {
    return await getPlanRepository().getHomePlanCandidates();
  } catch {
    return null;
  }
}

export default async function Home() {
  const [planCandidates, configuration] = await Promise.all([
    loadHomePlans(),
    getSiteSettingsRepository()
      .getPublished()
      .catch(() => cloneDefaultSiteConfiguration()),
  ]);
  return (
    <HomeDashboard
      configuration={configuration}
      planCandidates={planCandidates}
    />
  );
}
