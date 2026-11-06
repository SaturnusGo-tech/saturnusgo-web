import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import css from "../../startup.module.css";
export function CompanyWizardFrame({ children, footer, stage, ru, locked, onClose }: { children: ReactNode; footer?: ReactNode; stage: string; ru: boolean; locked: boolean; onClose(): void }) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; previous?.focus?.(); };
  }, []);
  useEffect(() => { if (panel.current) { panel.current.scrollTop = 0; panel.current.focus({ preventScroll: true }); } }, [stage]);
  function trap(event: KeyboardEvent) {
    if (event.key === "Escape" && !locked) { event.preventDefault(); onClose(); }
    if (event.key !== "Tab") return;
    const focusable = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href], [tabindex="0"]') ?? []);
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  const content = <section ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={ru ? "Создание компании" : "Create company"} className={css.screen} data-company-wizard data-stage={stage} onKeyDown={trap}>
    <div className={css.art} aria-hidden="true"><img src="/falcon/startup/company-setup-tiles-20261106.webp" width="1024" height="1536" alt="" /></div>
    <header className={css.header}><button type="button" disabled={locked} onClick={onClose} className={css.close} aria-label={ru ? "Закрыть создание компании" : "Close company setup"}><X size={24} /></button><span>{ru ? "Создать компанию" : "Create company"}</span></header>
    <div className={css.body} key={stage}>{children}</div>
    {footer && <footer className={css.footer}>{footer}</footer>}
  </section>;
  return typeof document !== "undefined" ? createPortal(content, document.body) : content;
}
