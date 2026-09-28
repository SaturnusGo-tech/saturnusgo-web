import { useEffect, useId, useRef } from "react";
import { ArrowUp, LoaderCircle, Mic, Square } from "lucide-react";
import { useWritingDictation } from "../../../../writing-assistant/dictation/state/useWritingDictation";
import { RecordingStatus } from "../../../../writing-assistant/dictation/presentation/RecordingStatus";
import { maximumQuestionCharacters } from "../../model/conversation";
import type { useGuideConversation } from "../../state/useGuideConversation";
import { guideChatCopy } from "../../localization/copy";
import { shouldSendQuestion } from "./keyboard";
import css from "../guide-chat.module.css";

export function GuideComposer({ chat }: { chat: ReturnType<typeof useGuideConversation> }) {
  const copy = guideChatCopy[chat.locale], ru = chat.locale === "ru";
  const input = useRef<HTMLTextAreaElement>(null), statusId = useId();
  const dictation = useWritingDictation({ instruction: chat.draft, onChange: chat.setDraft, ru, workspaceId: chat.workspaceId,
    enabled: chat.enabled && !chat.busy, purpose: "documentation", maximumCharacters: maximumQuestionCharacters,
    contextKey: `${chat.scopeKey}:${chat.conversationId}` });
  const tooLong = chat.draft.length > maximumQuestionCharacters;
  const canSend = chat.enabled && Boolean(chat.draft.trim()) && !tooLong && !chat.busy && !dictation.active;
  const microphoneLabel = dictation.state === "starting" || dictation.state === "transcribing" ? copy.cancelDictation
    : dictation.active ? copy.stopDictation : copy.dictate;
  useEffect(() => {
    const element = input.current; if (!element) return;
    element.style.height = "auto"; element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
  }, [chat.draft]);
  useEffect(() => { input.current?.focus({ preventScroll: true }); }, [chat.scopeKey, chat.conversationId]);
  function send() { if (canSend) { void chat.send(); input.current?.focus({ preventScroll: true }); } }
  return <div className={css.composerArea}>
    <div className={css.composer} data-input-shell data-disabled={!chat.enabled || undefined}>
      <textarea ref={input} rows={1} aria-label={copy.question} placeholder={copy.placeholder} value={chat.draft}
        disabled={!chat.enabled || chat.busy} readOnly={dictation.active} aria-invalid={tooLong || undefined}
        aria-describedby={statusId} onChange={event => chat.setDraft(event.target.value)}
        onKeyDown={event => { if (shouldSendQuestion(event)) { event.preventDefault(); send(); } }} />
      <div className={css.composerActions}>
        <span className={css.composerHint}>{dictation.active ? copy.review : ""}</span>
        <button type="button" className={css.iconButton} aria-label={microphoneLabel} title={microphoneLabel}
          aria-pressed={dictation.active} disabled={!chat.enabled || chat.busy || tooLong}
          data-recording={dictation.state === "listening" || undefined} onClick={() => dictation.active ? dictation.stop() : dictation.start()}>
          {dictation.state === "starting" || dictation.state === "transcribing" ? <LoaderCircle size={17} className={css.spinner} />
            : dictation.active ? <Square size={13} fill="currentColor" /> : <Mic size={18} />}
        </button>
        <button type="button" className={css.send} aria-label={chat.busy ? copy.stop : copy.send}
          disabled={!chat.busy && !canSend} onClick={chat.busy ? chat.cancel : send}>
          {chat.busy ? <Square size={13} fill="currentColor" /> : <ArrowUp size={19} />}
        </button>
      </div>
    </div>
    <div id={statusId} className={css.composerStatus} role={dictation.error || tooLong ? "alert" : "status"}>
      {!chat.enabled ? copy.offline : dictation.error || dictation.notice || (tooLong ? copy.limit
        : dictation.state === "starting" ? copy.recording : dictation.state === "transcribing" ? copy.transcribing
        : dictation.state === "listening" ? <RecordingStatus elapsed={dictation.elapsed} level={dictation.level} ru={ru} /> : copy.footer)}
    </div>
  </div>;
}
