import { X } from "lucide-react";
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import styles from "../../../tms.module.css";

const FOCUSABLE = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
  drawer = false,
  sheet = false,
  adaptiveSheet = false,
  panelClassName = "",
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  drawer?: boolean;
  sheet?: boolean;
  adaptiveSheet?: boolean;
  panelClassName?: string;
}) {
  const { t } = useTmsLocale();
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  const returnFocusRef = useRef<HTMLElement | null>(
    typeof document !== "undefined" && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );
  const titleId = useId();
  const subtitleId = useId();
  const [sheetCompact, setSheetCompact] = useState(false);
  const [dragProgress, setDragProgress] = useState<number | null>(null);
  const dragActiveRef = useRef(false);
  const dragOriginRef = useRef(0);
  const dragStartProgressRef = useRef(0);
  const dragProgressRef = useRef(0);
  closeRef.current = onClose;

  const beginSheetDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (!sheet || !adaptiveSheet || event.button !== 0) return;
    const panel = panelRef.current;
    if (!panel || event.clientY - panel.getBoundingClientRect().top > 38) return;
    if ((event.target as Element).closest("button, a, input, textarea, select")) return;
    dragActiveRef.current = true;
    dragOriginRef.current = event.clientY;
    dragStartProgressRef.current = sheetCompact ? 1 : 0;
    dragProgressRef.current = dragStartProgressRef.current;
    setDragProgress(dragProgressRef.current);
    panel.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const adaptiveStyle = adaptiveSheet && dragProgress !== null ? {
    "--sheet-gutter": `${dragProgress * 48}px`,
    "--sheet-height-offset": `${dragProgress * 8}dvh`,
    "--sheet-radius": `${dragProgress * 18}px`,
    "--sheet-border": `${dragProgress}px`,
  } as CSSProperties : undefined;

  useEffect(() => {
    const moveSheetDrag = (event: PointerEvent) => {
      if (!dragActiveRef.current) return;
      const delta = event.clientY - dragOriginRef.current;
      const progress = Math.max(0, Math.min(1, dragStartProgressRef.current + delta / 180));
      dragProgressRef.current = progress;
      setDragProgress(progress);
    };
    const finishSheetDrag = (event: PointerEvent) => {
      if (!dragActiveRef.current) return;
      dragActiveRef.current = false;
      if (panelRef.current?.hasPointerCapture(event.pointerId)) panelRef.current.releasePointerCapture(event.pointerId);
      setSheetCompact(dragProgressRef.current >= .5);
      setDragProgress(null);
    };
    window.addEventListener("pointermove", moveSheetDrag);
    window.addEventListener("pointerup", finishSheetDrag);
    window.addEventListener("pointercancel", finishSheetDrag);
    return () => {
      window.removeEventListener("pointermove", moveSheetDrag);
      window.removeEventListener("pointerup", finishSheetDrag);
      window.removeEventListener("pointercancel", finishSheetDrag);
    };
  }, []);

  useEffect(() => {
    const bodyOverflow = document.body.style.overflow;
    const focusPanel = window.requestAnimationFrame(() => {
      const target =
        panelRef.current?.querySelector<HTMLElement>("[autofocus]") ??
        panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ??
        panelRef.current;
      target?.focus();
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((element) => !element.hidden && element.tabIndex !== -1);
      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!panelRef.current.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusPanel);
      document.body.style.overflow = bodyOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      returnFocusRef.current?.focus();
    };
  }, []);

  return (
    <div
      className={`${styles.modalBackdrop} ${drawer ? styles.modalBackdropDrawer : ""} ${sheet ? styles.modalBackdropSheet : ""}`}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeRef.current();
      }}
    >
      <section
        ref={panelRef}
        className={`${styles.modal} ${wide ? styles.modalWide : ""} ${drawer ? styles.modalDrawer : ""} ${sheet ? styles.modalSheet : ""} ${adaptiveSheet ? styles.modalSheetAdaptive : ""} ${panelClassName}`}
        data-sheet-state={adaptiveSheet ? (sheetCompact ? "compact" : "full") : undefined}
        data-sheet-dragging={dragProgress !== null || undefined}
        style={adaptiveStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        tabIndex={-1}
        onPointerDown={beginSheetDrag}
      >
        <header>
          <div>
            <h2 id={titleId}>{title}</h2>
            {subtitle && <p id={subtitleId}>{subtitle}</p>}
          </div>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onClose}
            aria-label={t("common.close")}
            title={t("common.close")}
          >
            <X size={18} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
