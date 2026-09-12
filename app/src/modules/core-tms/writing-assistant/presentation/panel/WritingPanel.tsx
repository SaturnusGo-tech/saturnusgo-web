import { useEffect, useId, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { motion, useIsPresent, useReducedMotion } from "framer-motion";
import { ArrowUp, Check, RotateCcw, X } from "lucide-react";
import { useColorMode } from "../../../../../shared/_hooks/useColorMode";
import { MarkdownField } from "../../../presentation/cases/inspector/markdown/MarkdownField";
import { stripRawHtml } from "../../../presentation/cases/inspector/markdown/code/stripRawHtml";
import type { WritingTarget } from "../../model/target";
import { useWritingRequest } from "../../state/useWritingRequest";
import { useWritingPopup } from "./useWritingPopup";
import sphere from "../writing.module.css";
import css from "./writing-panel.module.css";

export function WritingPanel({ target, workspaceId, ru, anchor, onClose }: {
  target: WritingTarget; workspaceId: string; ru: boolean; anchor: RefObject<HTMLButtonElement | null>;
  onClose: (restore?: boolean) => void;
}) {
  const [instruction, setInstruction] = useState("");
  const request = useWritingRequest(workspaceId, target, ru);
  const present = useIsPresent();
  const { panel, position } = useWritingPopup(anchor, () => { request.cancel(); onClose(false); });
  const { theme } = useColorMode();
  const reduced = useReducedMotion();
  const titleId = useId();
  const tooLong = target.text.length > 30000;
  const result = stripRawHtml(request.result);
  useEffect(() => { if (!present) { request.cancel(); panel.current?.setAttribute("inert", ""); } }, [present]);
  function close() { request.cancel(); onClose(); }
  function apply() {
    if (!target.apply(result)) {
      request.setError(ru ? "Не удалось применить ответ. Ваш текст сохранён. Закройте окно и отправьте новый запрос." : "Could not apply this response. Your text is unchanged. Close this window and start a new request.");
      return;
    }
    onClose(false);
  }
  return createPortal(<motion.div ref={panel} className={css.panel} style={{ ...position, pointerEvents: present ? undefined : "none" }} aria-hidden={!present || undefined}
    data-color-mode={theme === "dark" ? "dark" : "light"} data-writing-popup
    role="dialog" aria-label={ru ? "Спросить Falcon AI" : "Ask Falcon AI"} aria-labelledby={titleId}
    initial={{ opacity: 0, y: reduced ? 0 : -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : -4 }}
    transition={{ duration: reduced ? 0 : .18, ease: "easeOut" }}
    onClick={(event) => event.stopPropagation()} onKeyDown={(event) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); }
      if (event.key === "Tab") {
        const items = Array.from(panel.current?.querySelectorAll<HTMLElement>("button:not(:disabled), textarea:not(:disabled), [tabindex='0']") ?? []);
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        event.stopPropagation();
      }
    }}>
    <header className={css.header}><span className={sphere.sphere} aria-hidden="true" />
      <div><strong id={titleId}>{ru ? "Спросить Falcon AI" : "Ask Falcon AI"}</strong>
        <span className={css.scope}>{target.selected ? (ru ? "Выделенный текст" : "Selected text") : (ru ? "Весь текст поля" : "Entire field")}</span></div>
      <button type="button" className={css.close} onClick={close} aria-label={ru ? "Закрыть Falcon AI" : "Close Falcon AI"}><X size={16} /></button>
    </header>
    <div className={css.prompt}>
      <textarea aria-label={ru ? "Что нужно сделать с текстом?" : "What should change?"}
        placeholder={ru ? "Что нужно сделать? Например, оформить текст в Markdown…" : "What should change? For example, format this in Markdown…"}
        rows={2} value={instruction} maxLength={2000} disabled={request.busy} onChange={(event) => setInstruction(event.target.value)}
        onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && instruction.trim() && !request.busy && !tooLong) { event.preventDefault(); void request.run("custom", instruction); } }} />
      <button type="button" className={css.send} disabled={!instruction.trim() || request.busy || tooLong}
        aria-label={ru ? "Отправить запрос" : "Send request"} onClick={() => void request.run("custom", instruction)}><ArrowUp size={17} /></button>
    </div>
    <div className={css.shortcuts}>
      <button type="button" disabled={!target.text.trim() || request.busy || tooLong} onClick={() => void request.run("improve")}>{ru ? "Улучшить текст" : "Improve text"}</button>
      <button type="button" disabled={!target.text.trim() || request.busy || tooLong} onClick={() => void request.run("correct")}>{ru ? "Исправить ошибки" : "Fix mistakes"}</button>
    </div>
    {tooLong && <p className={css.error} role="alert">{ru ? "Выделите фрагмент до 30 000 символов." : "Select up to 30,000 characters."}</p>}
    {request.busy && <div className={css.loading} role="status" aria-label={ru ? "Falcon AI готовит текст" : "Falcon AI is writing"}>
      <span /><span /><span /><div className={css.loadingFooter}><small>{ru ? "Falcon AI готовит текст…" : "Falcon AI is writing…"}</small>
        <button type="button" onClick={request.cancel}>{ru ? "Остановить" : "Stop"}</button></div>
    </div>}
    {request.error && <p className={css.error} role="alert">{request.error}</p>}
    {result && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : .2 }}>
      <div className={css.result} tabIndex={0} aria-label={ru ? "Предложенный текст" : "Suggested text"}>
        <MarkdownField value={result} label={ru ? "Предложенный текст" : "Suggested text"} allowAttachments={false} />
      </div>
      <footer className={css.footer}><button type="button" onClick={request.retry}><RotateCcw size={14} />{ru ? "Иначе" : "Try again"}</button>
        <button type="button" className={css.apply} onClick={apply}><Check size={15} />{target.selected ? (ru ? "Заменить выделенное" : "Replace selection") : (ru ? "Заменить текст" : "Replace text")}</button></footer>
    </motion.div>}
  </motion.div>, document.body);
}
