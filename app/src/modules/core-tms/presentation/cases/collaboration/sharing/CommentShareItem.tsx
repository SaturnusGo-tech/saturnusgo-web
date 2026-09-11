import { Check, Link2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import css from "./sharing.module.css";

export function CommentShareItem({ ru, link, compact = false }: { ru: boolean; link: () => string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState("");
  const container = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!compact || !fallback) return;
    const closeOutside = (event: PointerEvent) => { if (!container.current?.contains(event.target as Node)) setFallback(""); };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") { setFallback(""); container.current?.querySelector("button")?.focus(); } };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", closeOnEscape); };
  }, [compact, fallback]);
  const label = copied ? (ru ? "Ссылка скопирована" : "Link copied") : compact ? (ru ? "Скопировать ссылку" : "Copy comment link") : (ru ? "Поделиться" : "Share");
  async function share() {
    const value = link();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true); setFallback("");
    } catch {
      setFallback(value);
    }
  }
  return <span ref={container} className={compact ? css.compact : undefined}>
    <button type="button" role={compact ? undefined : "menuitem"} className={compact ? css.linkButton : undefined} aria-label={label} title={label} onClick={() => void share()}>
      {copied ? <Check size={compact ? 16 : 14} strokeWidth={1.6} /> : <Link2 size={compact ? 16 : 14} strokeWidth={1.6} />}
      <span role="status" className={compact ? css.srOnly : undefined}>{label}</span>
    </button>
    {fallback && <span className={`${css.fallback} ${compact ? css.popover : ""}`}>
      <label>{ru ? "Скопируйте ссылку вручную" : "Copy the link manually"}
        <input readOnly value={fallback} aria-label={ru ? "Ссылка на комментарий" : "Comment link"}
          onFocus={event => event.target.select()} onKeyDown={event => { if (event.key !== "Escape" && event.key !== "Tab") event.stopPropagation(); }} />
      </label>
    </span>}
  </span>;
}
