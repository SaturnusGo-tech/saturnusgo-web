"use client";

import { useEffect, useRef, useState } from "react";
import { useColorMode } from "../../../../../shared/_hooks/useColorMode";
import css from "./emoji.module.css";

/** Local native emoji data: opening the picker never sends editor text to a service. */
export function EmojiPicker({ locale, onSelect, dynamicWidth = false }: {
  locale: "ru" | "en"; onSelect: (native: string) => void; dynamicWidth?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null), callback = useRef(onSelect);
  callback.current = onSelect;
  const { theme } = useColorMode();
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let disposed = false;
    const host = root.current;
    setReady(false); setFailed(false);
    void Promise.all([import("emoji-mart"), import("@emoji-mart/data"),
      locale === "ru" ? import("@emoji-mart/data/i18n/ru.json") : Promise.resolve({ default: undefined })])
      .then(([module, data, language]) => {
        if (disposed || !host) return;
        const picker = new module.Picker({ data: data.default, i18n: language.default, locale,
          theme: theme === "dark" ? "dark" : "light", set: "native", perLine: 8, emojiSize: 25, dynamicWidth,
          emojiButtonSize: 38, maxFrequentRows: 2, previewPosition: "none", skinTonePosition: "search",
          autoFocus: true, onEmojiSelect: (entry: {native: string}) => callback.current(entry.native) });
        host.replaceChildren(picker as unknown as Node);
        setReady(true);
      }).catch(() => { if (!disposed) setFailed(true); });
    return () => { disposed = true; host?.replaceChildren(); };
  }, [locale, theme, retry, dynamicWidth]);
  return <div className={css.picker}>
    <div ref={root} />
    {!ready && <div className={css.loading} role="status">{failed
      ? <button type="button" onClick={() => setRetry((n) => n + 1)}>{locale === "ru" ? "Повторить загрузку эмодзи" : "Retry loading emoji"}</button>
      : (locale === "ru" ? "Загрузка эмодзи…" : "Loading emoji…")}</div>}
  </div>;
}
