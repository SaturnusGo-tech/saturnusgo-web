export const defaultArticleId = "introduction";
export const safeArticleId = (value: string | null) => value && /^[a-z][a-z0-9-]{0,63}$/.test(value) ? value : defaultArticleId;

export function documentationLink(href: string, articleId: string, sectionId?: string) {
  const url = new URL(href);
  for (const key of [...url.searchParams.keys()]) {
    if (key !== "workspaceId" && key !== "projectId") url.searchParams.delete(key);
  }
  url.searchParams.set("view", "help");
  url.searchParams.set("article", safeArticleId(articleId));
  url.hash = sectionId ?? "";
  return `${url.pathname}${url.search}${url.hash}`;
}
