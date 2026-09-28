import { useEffect, useRef, useState } from "react";
import type { GuideHistoryApi } from "../../history/model/api";
import type { GuideChatShare } from "../../history/model/history";
import { guideChatLink } from "../../navigation/chat-link";

export function useGuideShare(api: GuideHistoryApi, chatId: string, turnId: string, open: boolean) {
  const [share, setShare] = useState<GuideChatShare | null>(null), [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"" | "copied" | "revoked" | "shareFailure" | "copyFailed">("");
  const [link, setLink] = useState("");
  const attempt = useRef<string | null>(null), generation = useRef(0), scope = `${chatId}:${turnId}`;
  const latest = useRef({ api, scope, open }); latest.current = { api, scope, open };
  const valid = (token: number) => generation.current === token && latest.current.api === api && latest.current.scope === scope && latest.current.open;
  useEffect(() => {
    const token = ++generation.current;
    setShare(null); setLink(""); setStatus(""); attempt.current = null;
    if (!open) { setBusy(false); return; }
    const controller = new AbortController(); setBusy(true);
    void (async () => {
      let cursor: string | null = null;
      do {
        const page = await api.shares(chatId, cursor, controller.signal);
        if (controller.signal.aborted || !valid(token)) return;
        const active = page.items.find(item => item.turnId === turnId && !item.revokedAt);
        if (active) { setShare(active); return; }
        cursor = page.nextCursor;
      } while (cursor);
    })().catch(() => { if (!controller.signal.aborted && valid(token)) setStatus("shareFailure"); })
      .finally(() => { if (!controller.signal.aborted && valid(token)) setBusy(false); });
    return () => { controller.abort(); generation.current++; };
  }, [api, scope, open]);
  async function copy() {
    if (busy || !open) return;
    const token = generation.current, href = window.location.href;
    setBusy(true); setStatus("");
    try {
      let saved = share;
      if (!saved) {
        attempt.current ??= crypto.randomUUID();
        saved = await api.share(chatId, turnId, { shareId: attempt.current });
      }
      if (!valid(token)) return;
      setShare(saved);
      const url = new URL(guideChatLink(href, { shareId: saved.id }), href).href;
      setLink(url);
      try { await navigator.clipboard.writeText(url); if (valid(token)) setStatus("copied"); }
      catch { if (valid(token)) setStatus("copyFailed"); }
    } catch { if (valid(token)) setStatus("shareFailure"); }
    finally { if (valid(token)) setBusy(false); }
  }
  async function revoke() {
    if (!share || busy || !open) return;
    const token = generation.current;
    setBusy(true); setStatus("");
    try {
      await api.revoke(chatId, share.id);
      if (valid(token)) { setShare(null); setLink(""); attempt.current = null; setStatus("revoked"); }
    } catch { if (valid(token)) setStatus("shareFailure"); }
    finally { if (valid(token)) setBusy(false); }
  }
  return { share, busy, status, link, copy, revoke };
}
