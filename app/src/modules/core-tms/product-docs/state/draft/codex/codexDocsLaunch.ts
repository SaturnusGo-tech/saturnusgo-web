import type { PersonalCodexConnection } from "../../../../codex-employee/domain/model/codex-employee";
import type { TmsLocale } from "../../../../localization/model/locale";
import { buildWorkspaceDeepLink } from "../../../../state/navigation/workspace-deep-link";
import type { ProductDocScope } from "../../../domain/product-docs";

const prompts: Record<TmsLocale, string> = {
  en: "Use the manage-product-docs skill and Falcon MCP to work on project documentation. I’ll tell you which project, pages, folders, or source materials to use. If an operation is unavailable, explain why. Publish a draft when I ask you to.",
  ru: "Используй скилл manage-product-docs и Falcon MCP для работы с документацией проекта. Я укажу проект, страницы, папки или исходные материалы. Если операция недоступна, объясни причину. Опубликуй черновик, когда я попрошу.",
};

export function projectCodexStatus(connections: readonly PersonalCodexConnection[], projectId: string, now = Date.now()) {
  const grants = connections.filter((connection) => !connection.revokedAt
    && Date.parse(connection.expiresAt) > now && connection.projectIds.includes(projectId)
    && connection.scopes.includes("falcon:read"));
  if (!grants.length) return "available";
  return grants.some((grant) => grant.scopes.includes("falcon:product-docs:write")) ? "connected" : "read-only";
}

export function codexBrowserAddress(locale: TmsLocale) {
  return "codex://threads/new?prompt=" + encodeURIComponent(prompts[locale]);
}

export function codexDesktopCommandAddress(origin: string, locale: TmsLocale, requestId: string) {
  const target = new URL("/desktop-open-codex/", origin);
  target.search = new URLSearchParams({ lang: locale, requestId }).toString();
  return target.href;
}

export function codexSetupAddress(href: string, scope: ProductDocScope, locale: TmsLocale) {
  const source = new URL(href);
  source.searchParams.set("integration", "codex");
  const url = new URL(buildWorkspaceDeepLink(source.href, { ...scope, view: "hooks", runId: null }));
  url.searchParams.set("lang", locale);
  return url.href;
}
