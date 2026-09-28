import { useEffect, useRef, useState } from "react";
import type { GuideHistoryApi } from "../model/api";
import type { GuideChatSummary, GuideChatTurn } from "../model/history";
import { guideError } from "../../data/guide-error";
import { readPersistentGuideStream } from "../data/persistent-stream";
import { createTextBatch } from "../../state/stream/text-batch";
import { reconcileGuideTurn } from "./reconcile-turn";

type Input = { api: GuideHistoryApi | null; owner: string; enabled: boolean; locale: "ru" | "en"; chat: GuideChatSummary | null;
  apply(chat: GuideChatSummary, turn?: GuideChatTurn): void; created(chat: GuideChatSummary): void;
  restoreDraft(value: string): void; changed(): void };
type Job = { api: GuideHistoryApi; owner: string; chatId: string; turnId: string; question: string; controller: AbortController; stopPreview(): void };
export function useChatTurn(input: Input) {
  const [busy, setBusy] = useState(false), [partialText, setPartialText] = useState("");
  const [question, setQuestion] = useState<{ id: string; content: string } | null>(null);
  const [error, setError] = useState<ReturnType<typeof guideError> | "">("");
  const [notice, setNotice] = useState<"pending" | "cancelled" | "">("");
  const pending = useRef<Job | null>(null), recovery = useRef<Pick<Job, "chatId" | "turnId" | "question"> | null>(null);
  const latest = useRef(input); latest.current = input;
  function reset(clearRecovery = true) { if (clearRecovery) recovery.current = null; setPartialText(""); setQuestion(null); setError(""); setNotice(""); }
  async function cancel() {
    const job = pending.current; pending.current = null;
    job?.stopPreview(); job?.controller.abort(); setBusy(false); setPartialText(""); setQuestion(null);
    if (!job) return;
    if (latest.current.owner === job.owner && !latest.current.chat) latest.current.restoreDraft(job.question);
    try {
      const turn = await job.api.cancel(job.chatId, job.turnId), chat = await job.api.chat(job.chatId);
      if (latest.current.owner === job.owner && latest.current.chat?.id === job.chatId) {
        latest.current.apply(chat, turn);
        if (turn.state !== "completed") { latest.current.restoreDraft(job.question); setNotice("cancelled"); }
      }
    } catch {
      if (latest.current.owner === job.owner && latest.current.chat?.id === job.chatId) {
        recovery.current = job; latest.current.restoreDraft(job.question); setError("unavailable");
      }
    } finally { if (latest.current.owner === job.owner) latest.current.changed(); }
  }
  useEffect(() => () => {
    const job = pending.current; pending.current = null; job?.stopPreview(); job?.controller.abort();
    if (job) void job.api.cancel(job.chatId, job.turnId).catch(() => {});
  }, [input.owner]);
  useEffect(() => { reset(); recovery.current = null; setBusy(false); }, [input.owner]);
  useEffect(() => { if (!input.enabled && pending.current) void cancel(); }, [input.enabled]);
  async function send(content: string) {
    const current = latest.current, api = current.api;
    if (!api || !current.enabled || pending.current || !content.trim() || content.length > 8000) return;
    const job: Job = { api, owner: current.owner, chatId: current.chat?.id ?? crypto.randomUUID(), turnId: crypto.randomUUID(),
      question: content.trim(), controller: new AbortController(), stopPreview() {} };
    pending.current = job; setBusy(true); reset(false); setQuestion({ id: job.turnId, content: job.question });
    const valid = () => pending.current === job && latest.current.owner === job.owner && !job.controller.signal.aborted;
    const preview = createTextBatch(text => { if (valid()) setPartialText(text); }); job.stopPreview = preview.cancel;
    try {
      let knownChat = current.chat;
      if (recovery.current) {
        const previous = recovery.current, settled = await reconcileGuideTurn(api, previous.chatId, previous.turnId);
        if (!valid()) return;
        if (settled.chat) {
          knownChat = settled.chat; job.chatId = settled.chat.id;
          if (!current.chat) latest.current.created(settled.chat);
          latest.current.apply(settled.chat, settled.turn ?? undefined);
        }
        if (settled.turn?.state === "pending") { setNotice("pending"); current.restoreDraft(content); return; }
        recovery.current = null;
        if (settled.turn?.state === "completed" && content.trim() === previous.question) return;
      }
      const chat = knownChat ? await api.chat(job.chatId, job.controller.signal)
        : await api.create({ chatId: job.chatId, locale: current.locale }, job.controller.signal);
      if (!valid()) return;
      if (!current.chat) latest.current.created(chat); else latest.current.apply(chat);
      const response = await api.stream(job.chatId, { turnId: job.turnId, content: job.question, expectedVersion: chat.version }, job.controller.signal);
      const saved = await readPersistentGuideStream(response, job.controller.signal, {
        accepted(value) {
          if (value.chat.id !== job.chatId || value.turn.id !== job.turnId) throw new Error("Guide turn identity mismatch");
          if (valid()) { latest.current.apply(value.chat, value.turn); setQuestion(null); }
        },
        delta(value) { if (valid()) preview.append(value); },
      });
      if (valid()) { latest.current.apply(saved.chat, saved.turn); recovery.current = null; latest.current.changed(); }
    } catch (problem) {
      if (!valid()) return;
      try {
        const settled = await reconcileGuideTurn(api, job.chatId, job.turnId);
        if (!valid()) return;
        if (settled.chat) {
          if (!current.chat) latest.current.created(settled.chat);
          latest.current.apply(settled.chat, settled.turn ?? undefined);
        }
        latest.current.changed();
        if (settled.turn?.state === "completed") return;
        if (settled.turn?.state === "pending") { recovery.current = job; setNotice("pending"); }
        else { recovery.current = null; setError(guideError(problem)); }
      } catch { if (valid()) { recovery.current = job; setError(guideError(problem)); } }
      if (valid()) latest.current.restoreDraft(job.question);
    } finally {
      preview.cancel();
      if (valid()) { pending.current = null; setBusy(false); setPartialText(""); setQuestion(null); }
    }
  }
  return { busy, partialText, question, error, notice, send, cancel, reset,
    activeChatId: () => pending.current?.chatId ?? null, dismissError: () => { setError(""); setNotice(""); } };
}
