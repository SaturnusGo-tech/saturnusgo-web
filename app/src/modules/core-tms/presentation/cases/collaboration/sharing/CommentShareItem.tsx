import { Check, Link2 } from "lucide-react";
import { useState } from "react";
import css from "./sharing.module.css";

export function CommentShareItem({ ru, link }: { ru: boolean; link: () => string }) {
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState("");
  const label = copied ? (ru ? "Ссылка скопирована" : "Link copied") : (ru ? "Поделиться" : "Share");
  async function share() {
    const value = link();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true); setFallback("");
    } catch {
      setFallback(value);
    }
  }
  return <>
    <button type="button" role="menuitem" aria-label={label} onClick={() => void share()}>
      {copied ? <Check size={14} /> : <Link2 size={14} />}
      <span role="status">{label}</span>
    </button>
    {fallback && <div className={css.fallback}>
      <label>{ru ? "Скопируйте ссылку вручную" : "Copy the link manually"}
        <input readOnly value={fallback} aria-label={ru ? "Ссылка на комментарий" : "Comment link"}
          onFocus={event => event.target.select()} onKeyDown={event => { if (event.key !== "Escape" && event.key !== "Tab") event.stopPropagation(); }} />
      </label>
    </div>}
  </>;
}
