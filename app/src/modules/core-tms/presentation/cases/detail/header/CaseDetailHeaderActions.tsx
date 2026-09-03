import {
  Archive, Check, Copy, Files, Link2, Maximize2, Minimize2,
  MoreHorizontal, Play, RotateCcw, X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import type { TmsLocale } from "../../../../localization/model/locale";
import { buildCaseDeepLink } from "../../../../test-cases/navigation/case-deep-link";
import layout from "../../cases.module.css";
import inspector from "../../inspector/caseInspector.module.css";

type Props = {
  locale: TmsLocale;
  testCase?: TestCaseSummary;
  creating: boolean;
  editorOpen: boolean;
  fullscreen: boolean;
  onRunCase: () => void;
  onToggleFullscreen: () => void;
  onClone: () => void;
  onArchive: () => void;
  onClose?: () => void;
};

export function CaseDetailHeaderActions(props: Props) {
  const [copied, setCopied] = useState<"key" | "link" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRoot = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const ru = props.locale === "ru";
  const item = props.testCase;
  useEffect(() => {
    setCopied(null);
    setMenuOpen(false);
  }, [item?.id]);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!menuRoot.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [menuOpen]);

  async function copy(value: string, kind: "key" | "link") {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
    } catch {
      const field = document.createElement("textarea");
      field.value = value;
      field.setAttribute("readonly", "");
      field.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(kind);
    window.setTimeout(() => setCopied((current) => current === kind ? null : current), 1800);
  }

  return <div className={inspector.utilityRow}>
    <div className={inspector.caseIdentity}>
      <span className={inspector.caseKey}>{props.creating
        ? (ru ? "Новый тест-кейс" : "New test case")
        : (ru ? "Карточка тест-кейса" : "Test case")}</span>
    </div>
    <div className={inspector.headerActions}>
      {!props.creating && <button type="button" disabled={props.editorOpen}
        className={inspector.headerTextButton} onClick={props.onRunCase}>
        <Play size={14} />{ru ? "Запустить" : "Run"}</button>}
      {!props.creating && <button type="button" disabled={props.editorOpen}
        className={inspector.headerTextButton} onClick={props.onArchive}>
        {item?.archivedAt ? <RotateCcw size={14} /> : <Archive size={14} />}
        {item?.archivedAt ? (ru ? "Восстановить" : "Restore") : (ru ? "Архивировать" : "Archive")}
      </button>}
      {!props.creating && <div ref={menuRoot} className={inspector.headerActionMenuRoot}
        onKeyDown={(event) => {
          if (event.key !== "Escape" || !menuOpen) return;
          event.preventDefault();
          event.stopPropagation();
          setMenuOpen(false);
          menuButton.current?.focus();
        }}>
        <button ref={menuButton} type="button" disabled={props.editorOpen}
          className={inspector.iconButton} aria-haspopup="menu" aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={ru ? "Другие действия" : "More actions"}><MoreHorizontal size={15} /></button>
        {menuOpen && <div role="menu" className={inspector.headerActionMenu}>
          {item && <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); void copy(item.key, "key"); }}>
            {copied === "key" ? <Check size={14} /> : <Copy size={14} />}{ru ? "Копировать ID" : "Copy ID"}
          </button>}
          {item && <button type="button" role="menuitem" onClick={() => {
            setMenuOpen(false);
            void copy(buildCaseDeepLink(window.location.href, { caseId: item.id, projectId: item.projectId }), "link");
          }}>{copied === "link" ? <Check size={14} /> : <Link2 size={14} />}{ru ? "Копировать ссылку" : "Copy link"}</button>}
          <button type="button" role="menuitem" onClick={() => {
            setMenuOpen(false);
            props.onClone();
          }}><Files size={14} />{ru ? "Создать копию" : "Create a copy"}</button>
        </div>}
      </div>}
      <button type="button" className={inspector.iconButton} onClick={props.onToggleFullscreen}
        aria-label={props.fullscreen ? (ru ? "Выйти из полного экрана" : "Exit full screen") : (ru ? "На весь экран" : "Open full screen")}
        aria-pressed={props.fullscreen}>{props.fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}</button>
      {props.onClose && <button type="button" className={inspector.iconButton}
        onClick={props.onClose} aria-label={ru ? "Закрыть" : "Close"}><X size={15} /></button>}
    </div>
    <span className={layout.visuallyHidden} role="status" aria-live="polite">{copied === "key"
      ? (ru ? "ID тест-кейса скопирован" : "Test case ID copied")
      : copied === "link" ? (ru ? "Ссылка на тест-кейс скопирована" : "Test case link copied") : ""}</span>
  </div>;
}
