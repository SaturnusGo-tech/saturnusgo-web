import { useRef, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useCatalogPage } from "../../state/catalog/useCatalogPage";
import { usePortfolioCommand } from "../../state/command/usePortfolioCommand";
import { editDiscussion, listDiscussion, postDiscussion } from "../data/discussion-api";
import { mergeDiscussionComments } from "../application/merge-comments";
import type { DiscussionScope, OrganizationComment } from "../model/discussion";

export function useDiscussion(scope: DiscussionScope, canPost: boolean) {
  const http = useTmsHttpClient();
  const key = `${scope.workspaceId}:${scope.targetType}:${scope.targetId}`;
  const latest = useRef(key); latest.current = key;
  const [confirmed, setConfirmed] = useState<{ scope: string; items: readonly OrganizationComment[] }>({ scope: key, items: [] });
  const page = useCatalogPage<OrganizationComment>(key, Boolean(scope.workspaceId && scope.targetId), (cursor, signal) => listDiscussion(http, scope, cursor, signal));
  const command = usePortfolioCommand(key);
  async function post(body: string) {
    if (!canPost || !body.trim() || body.trim().length > 20000) return false;
    const comment = await command.run(body.trim(), (operationKey, signal) => postDiscussion(http, scope, body, operationKey, signal));
    if (!comment || latest.current !== key) return false;
    setConfirmed((current) => ({ scope: key, items: [comment, ...(current.scope === key ? current.items : [])] }));
    page.reload();
    return true;
  }
  async function edit(item: OrganizationComment, body: string) {
    if (!canPost || !item.canEdit || !body.trim() || body.trim().length > 20000) return false;
    const comment = await command.run(JSON.stringify({ id: item.id, revision: item.revision ?? 1, body: body.trim() }),
      (operationKey, signal) => editDiscussion(http, scope, item, body, operationKey, signal));
    if (!comment || latest.current !== key) return false;
    setConfirmed((current) => ({ scope: key, items: [comment, ...(current.scope === key ? current.items.filter(value => value.id !== comment.id) : [])] }));
    page.reload();
    return true;
  }
  return { ...page, items: mergeDiscussionComments(page.items, confirmed.scope === key ? confirmed.items : []), command, post, edit };
}
