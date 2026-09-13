import { CircleHelp, ArrowUpRight } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { documentationLink } from "../../../../documentation/navigation/documentation-link";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import css from "./help.module.css";

export function DefectRoutingHelp() {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const [open, setOpen] = useState(false);
  const [left, setLeft] = useState(0);
  const [href, setHref] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const id = useId();
  useEffect(() => {
    setHref(documentationLink(window.location.href, "create-defect", "routing"));
    return () => clearTimeout(timer.current);
  }, []);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = root.current?.getBoundingClientRect();
      if (rect) setLeft(Math.max(20, rect.right - Math.min(270, window.innerWidth - 60)) - rect.left);
    };
    place(); window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  return <div className={css.root} ref={root}
    onMouseEnter={() => { clearTimeout(timer.current); setOpen(true); }}
    onMouseLeave={() => { timer.current = setTimeout(() => {
      if (!root.current?.contains(document.activeElement)) setOpen(false);
    }, 140); }}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
    onKeyDown={(event) => {
      if (event.key === "Escape" && open) {
        event.preventDefault(); event.stopPropagation(); setOpen(false); button.current?.focus();
      }
    }}>
    <button type="button" ref={button} aria-label={ru ? "О передаче дефекта" : "About defect delivery"}
      aria-expanded={open} aria-controls={id} aria-haspopup="dialog"
      onClick={() => setOpen(true)}><CircleHelp size={15} /></button>
    {open && <aside id={id} role="dialog" aria-label={ru ? "Передача дефекта" : "Defect delivery"} className={css.popover} style={{ left, right: "auto" }}>
      <p>{ru ? "Свяжите баг-репорт с задачей в трекере команды. Автоматический выбор использует настройки проекта." : "Link this bug report to a task in your team’s issue tracker. Automatic selection uses the project settings."}</p>
      <a href={href} target="_blank" rel="noreferrer">{ru ? "Открыть руководство" : "Open the guide"}<ArrowUpRight size={14} /></a>
    </aside>}
  </div>;
}
