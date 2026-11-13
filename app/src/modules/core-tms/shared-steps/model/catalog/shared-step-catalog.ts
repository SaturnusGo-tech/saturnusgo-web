import type { SharedStepSummary } from "../shared-step";

export function filterSharedSteps(items: readonly SharedStepSummary[], query: string, section: string) {
  const search = query.trim().toLocaleLowerCase();
  return items.filter(item => {
    const path = item.folderPath ?? "/";
    const inSection = section === "all" || path === section || (section !== "/" && path.startsWith(`${section}/`));
    return inSection && `${item.title} ${path}`.toLocaleLowerCase().includes(search);
  });
}

export function sharedStepSections(items: readonly SharedStepSummary[]) {
  const paths = new Set<string>();
  for (const item of items) {
    const parts = (item.folderPath ?? "/").split("/").filter(Boolean);
    if (!parts.length) paths.add("/");
    parts.forEach((_, index) => paths.add(`/${parts.slice(0, index + 1).join("/")}`));
  }
  return [...paths].sort((a, b) => a.localeCompare(b));
}
