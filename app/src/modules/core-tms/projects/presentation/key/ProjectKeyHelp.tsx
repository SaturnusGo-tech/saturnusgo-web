import { CircleHelp } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import css from "./projectKeyHelp.module.css";

export function ProjectKeyHelp({ id, value, locked = false }: { id: string; value: string; locked?: boolean }) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const show = () => { clearTimeout(timer.current); setOpen(true); };
  useEffect(() => () => clearTimeout(timer.current), []);
  useLayoutEffect(() => {
    const element = popup.current;
    if (!open || !element) return;
    element.showPopover?.();
    const place = () => {
      const anchor = button.current?.getBoundingClientRect();
      if (!anchor) return;
      const bounds = element.getBoundingClientRect();
      element.style.left = `${Math.max(12, Math.min(anchor.left, innerWidth - bounds.width - 12))}px`;
      element.style.top = `${Math.max(12, anchor.bottom + bounds.height + 18 > innerHeight
        ? anchor.top - bounds.height - 6 : anchor.bottom + 6)}px`;
    };
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setOpen(false); }
    };
    place();
    window.addEventListener("resize", place); window.addEventListener("scroll", place, true);
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape, true);
    return () => {
      window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true);
      document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape, true);
      if (element.matches(":popover-open")) element.hidePopover();
    };
  }, [open]);
  return <span className={css.root} ref={root}
    onMouseEnter={show} onMouseLeave={() => { timer.current = setTimeout(() => {
      if (!root.current?.contains(document.activeElement)) setOpen(false);
    }, 140); }}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button ref={button} type="button" className={css.trigger} aria-label={ru ? "О ключе проекта" : "About the project key"}
      aria-expanded={open} aria-describedby={id} aria-controls={id} onFocus={show} onClick={show}>
      <CircleHelp size={14} aria-hidden="true" />
    </button>
    <div ref={popup} id={id} role="tooltip" popover="manual" className={css.popup}>
      <p>{ru ? "Ключ входит в номера тест-кейсов и прогонов." : "The key is part of test case and run IDs."} <code>{value || "MOBILE"}-TC-1</code></p>
      <p>{locked ? (ru ? "После создания проекта ключ изменить нельзя." : "The key cannot be changed after the project is created.")
        : (ru ? "От 2 до 12 латинских букв или цифр. Начните с буквы." : "Use 2 to 12 Latin letters or digits, starting with a letter.")}</p>
    </div>
  </span>;
}
