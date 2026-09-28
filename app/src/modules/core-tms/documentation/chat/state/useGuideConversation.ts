import { useEffect, useRef, useState } from "react";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { askGuide, guideError } from "../data/ask-guide";
import { conversationContext, maximumQuestionCharacters, type GuideMessage } from "../model/conversation";
import { createTextBatch } from "./stream/text-batch";
import type { DocArticle } from "../../model/article";

type Scope = { http: TmsHttpClient | null; workspaceId: string; subject: string; locale: "ru" | "en"; enabled: boolean; articles?: ReadonlyMap<string, DocArticle> };
export function useGuideConversation(scope: Scope) {
  const scopeKey = JSON.stringify([scope.workspaceId, scope.subject, scope.locale]);
  const [draft, updateDraft] = useState("");
  const [messages, updateMessages] = useState<GuideMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [partialText, setPartialText] = useState("");
  const [error, setError] = useState<ReturnType<typeof guideError> | "">("");
  const [conversationId, setConversationId] = useState(0);
  const latest = useRef({ draft, messages, scope, scopeKey }); latest.current = { draft, messages, scope, scopeKey };
  const pending = useRef<{ request: AbortController; question: string; messages: GuideMessage[]; scopeKey: string; stopPreview: () => void } | null>(null);
  function setDraft(value: string) { latest.current.draft = value; updateDraft(value); }
  function setMessages(value: GuideMessage[]) { latest.current.messages = value; updateMessages(value); }
  function cancel() {
    const job = pending.current; pending.current = null; job?.stopPreview(); job?.request.abort(); setBusy(false); setPartialText("");
    if (job && job.scopeKey === latest.current.scopeKey) {
      setMessages(job.messages); if (!latest.current.draft) setDraft(job.question);
    }
  }
  function newChat() { cancel(); setMessages([]); setDraft(""); setError(""); setConversationId(value => value + 1); }
  useEffect(() => {
    newChat();
    return () => { pending.current?.stopPreview(); pending.current?.request.abort(); pending.current = null; };
  }, [scopeKey]);
  useEffect(() => { if (!scope.enabled) cancel(); }, [scope.enabled]);

  async function send(questionOverride?: string) {
    const current = latest.current, { http, enabled, workspaceId, locale } = current.scope;
    const question = (questionOverride ?? current.draft).trim();
    if (!http || !enabled || pending.current || !question || question.length > maximumQuestionCharacters) return;
    const job = { request: new AbortController(), question, messages: current.messages, scopeKey: current.scopeKey, stopPreview: () => {} };
    pending.current = job; setError(""); setBusy(true); setDraft(""); setPartialText("");
    setMessages([...job.messages, { role: "user", content: question }]);
    const valid = () => pending.current === job && !job.request.signal.aborted && latest.current.scopeKey === job.scopeKey;
    const preview = createTextBatch(text => { if (valid()) setPartialText(text); }); job.stopPreview = preview.cancel;
    try {
      const result = await askGuide(http, workspaceId, locale, conversationContext(job.messages, question, current.scope.articles), job.request.signal,
        delta => { if (valid()) preview.append(delta); });
      if (valid()) setMessages([...job.messages, { role: "user", content: question },
        { role: "assistant", content: result.answer, citations: result.citations, ...(result.visuals ? { visuals: result.visuals } : {}) }]);
    } catch (problem) {
      if (valid()) {
        setMessages(job.messages); if (!latest.current.draft) setDraft(question);
        setError(guideError(problem));
      }
    } finally {
      preview.cancel();
      if (valid()) { pending.current = null; setBusy(false); setPartialText(""); }
    }
  }
  return { draft, setDraft, messages, partialText, busy, error, dismissError: () => setError(""), send, cancel, newChat,
    conversationId, scopeKey, enabled: scope.enabled && Boolean(scope.http), locale: scope.locale,
    workspaceId: scope.workspaceId, retry: () => void send() };
}
