import { useEffect, useRef, useState } from "react";
import { TmsApiError } from "../../../../../../../core/tms/transport/http";
import type { GuideHistoryApi } from "../../model/api";
import type { GuideChatSummary } from "../../model/history";

export function useChatManagement(api: GuideHistoryApi, chat: GuideChatSummary, changed: (archived: boolean) => void) {
  const [mode, setMode] = useState<"" | "menu" | "rename" | "archive">("");
  const [title, setTitle] = useState(chat.title), [version, setVersion] = useState(chat.version);
  const [busy, setBusy] = useState(false), [error, setError] = useState<"" | "manageFailure" | "manageConflict">("");
  const active = useRef<AbortController | null>(null), latest = useRef({ api, id: chat.id, changed }); latest.current = { api, id: chat.id, changed };
  useEffect(() => { setTitle(chat.title); setVersion(chat.version); }, [chat.id, chat.title, chat.version]);
  useEffect(() => () => { active.current?.abort(); active.current = null; }, [api, chat.id]);
  function close() { setMode(""); setError(""); setTitle(chat.title); }
  async function save(archive = false) {
    if (active.current || (!archive && !title.trim())) return;
    const controller = new AbortController(); active.current = controller; setBusy(true); setError("");
    const valid = () => active.current === controller && !controller.signal.aborted && latest.current.api === api && latest.current.id === chat.id;
    try {
      if (archive) await api.archive(chat.id, { expectedVersion: version }, controller.signal);
      else await api.rename(chat.id, { title: title.trim(), expectedVersion: version }, controller.signal);
      if (valid()) { setMode(""); latest.current.changed(archive); }
    } catch (problem) {
      if (!valid()) return;
      if (problem instanceof TmsApiError && [409, 412].includes(problem.status)) {
        setError("manageConflict");
        try { const current = await api.chat(chat.id, controller.signal); if (valid()) setVersion(current.version); }
        catch { if (valid()) setError("manageFailure"); }
      } else setError("manageFailure");
    } finally { if (valid()) { active.current = null; setBusy(false); } }
  }
  return { mode, setMode, title, setTitle, busy, error, close, save };
}
