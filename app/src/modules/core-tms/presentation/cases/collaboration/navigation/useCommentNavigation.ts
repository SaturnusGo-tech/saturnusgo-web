import { useEffect, useRef, useState } from "react";
import type { CaseCollaborationViewModel } from "../model";

const validId = (id: string) => /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(id);
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

export function useCommentNavigation(caseId: string, model: CaseCollaborationViewModel, expand: () => void) {
  const latest = useRef({ model, expand }); latest.current = { model, expand };
  const scope = `${model.commentProjectId ?? ""}:${caseId}`;
  const owner = useRef({ scope, request: 0 });
  if (owner.current.scope !== scope) owner.current = { scope, request: 0 };
  const [failedId, setFailedId] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const requested = useRef("");
  useEffect(() => {
    const changed = () => setLocation(window.location.href);
    changed();
    window.addEventListener("popstate", changed);
    window.addEventListener("falcon:navigation", changed);
    return () => {
      owner.current = { scope: "", request: 0 };
      window.removeEventListener("popstate", changed);
      window.removeEventListener("falcon:navigation", changed);
    };
  }, []);
  useEffect(() => { requested.current = ""; setFailedId(null); }, [scope]);

  async function reveal(id: string) {
    if (!validId(id)) return;
    const active = owner.current;
    const request = ++active.request;
    const current = () => owner.current === active && active.request === request;
    setFailedId(null);
    // Fetch the target and all ancestors before scrolling, so pagination cannot move it afterwards.
    let next: string | null = id;
    const visited = new Set<string>();
    while (next && !visited.has(next)) {
      visited.add(next);
      let item = latest.current.model.comments.items.find(comment => comment.id === next);
      if (!item) {
        const found = await latest.current.model.revealComment?.(next);
        if (!current()) return;
        if (!found) { setFailedId(id); return; }
        await frame();
        item = latest.current.model.comments.items.find(comment => comment.id === next);
      }
      if (!current()) return;
      if (!item) { setFailedId(id); return; }
      next = item.parentId ?? null;
    }
    latest.current.expand();
    await frame(); await frame();
    if (!current()) return;
    const element = document.getElementById(`comment-${id}`);
    if (!element) { setFailedId(id); return; }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollIntoView({ block: "center", behavior: reduced ? "instant" : "smooth" });
    element.focus({ preventScroll: true });
    element.animate([{ backgroundColor: "var(--cases-hover)" }, { backgroundColor: "transparent" }],
      { duration: reduced ? 0 : 1800, easing: "ease-out" });
  }
  useEffect(() => {
    if (!location || model.comments.status !== "ready") return;
    const url = new URL(location);
    const id = url.searchParams.get("commentId");
    if (url.searchParams.get("caseId") !== caseId || !id || !validId(id)
      || (url.searchParams.get("projectId") && model.commentProjectId && url.searchParams.get("projectId") !== model.commentProjectId)) {
      requested.current = ""; owner.current.request++; setFailedId(null); return;
    }
    const key = `${scope}:${id}`;
    if (requested.current === key) return;
    requested.current = key; void reveal(id);
  }, [scope, location, model.comments.status]);
  return { failedId, reveal };
}
