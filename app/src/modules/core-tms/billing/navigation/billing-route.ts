import { settingsSectionLink } from "../../presentation/config/navigation/settings-section-route";

const workspacePath = "/work/";
const previewPath = "/testcases/umbrella-home/ui-preview/";
const safeScope = (value: string | null | undefined) => value && /^[A-Za-z0-9._:-]{1,128}$/.test(value) ? value : null;

export function workspaceBillingUrl(href: string, workspaceId?: string): string {
  const source = new URL(href);
  const url = new URL(source.pathname === previewPath ? previewPath : workspacePath, source.origin);
  for (const key of ["workspaceId", "projectId"]) {
    const value = safeScope(key === "workspaceId" && workspaceId !== undefined ? workspaceId : source.searchParams.get(key));
    if (value) url.searchParams.set(key, value);
  }
  const language = source.searchParams.get("lang");
  if (language === "ru" || language === "en") url.searchParams.set("lang", language);
  return settingsSectionLink(url.href, "billing");
}

export function isWorkspaceBillingNavigation(href: string): boolean {
  return [workspacePath, previewPath].includes(new URL(href).pathname);
}
