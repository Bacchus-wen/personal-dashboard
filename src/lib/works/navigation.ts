export function getWorkSaveDestination(workId?: string) {
  return workId ? `/admin/works/${workId}/edit` : "/admin/works";
}
