import { HomeDashboard } from "@/components/home/home-dashboard";
import { getPlanRepository } from "@/lib/plans/server-repository";

async function loadHomePlans() {
  try {
    return await getPlanRepository().getHomePlanCandidates();
  } catch {
    return null;
  }
}

export default async function Home() {
  return <HomeDashboard planCandidates={await loadHomePlans()} />;
}
