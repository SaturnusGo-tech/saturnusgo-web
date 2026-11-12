"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { TmsLocaleContext } from "../../../localization/context/TmsLocaleProvider";
import type { TmsLocale } from "../../../localization/model/locale";
import { tmsMessages } from "../../../localization/catalog/messages";
import { interpolateMessage } from "../../../localization/model/message";
import { productDocsCopy } from "../../../product-docs/localization/copy";
import { MoveProductDoc } from "../../../product-docs/presentation/toolbar/MoveProductDoc";
import { createDocsMoveFixture, moveScope } from "./docs-move-fixture";
import styles from "../docs-reading-preview.module.css";

export function DocsMovePreview() {
  const [locale, setLocale] = useState<TmsLocale>(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("lang") === "en" ? "en" : "ru");
  const [open, setOpen] = useState(true), [revision, setRevision] = useState(0), [notice, setNotice] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const appliedQueryTheme = useRef(false);
  const { resolvedTheme, setTheme } = useTheme();
  const log = useCallback((message: string) => setEvents(previous => [...previous.slice(-7), message]), []);
  const fixture = useMemo(() => createDocsMoveFixture(locale === "ru", log), [locale, revision, log]);
  const context = useMemo(() => ({ locale, languageTag: locale === "ru" ? "ru-RU" as const : "en-US" as const, setLocale,
    t: (key: keyof typeof tmsMessages.en, variables?: Record<string, string | number>) => interpolateMessage(tmsMessages[locale][key], variables) }), [locale]);
  useEffect(() => {
    if (appliedQueryTheme.current) return;
    appliedQueryTheme.current = true;
    const theme = new URLSearchParams(window.location.search).get("theme");
    if (theme === "light" || theme === "dark") setTheme(theme);
  }, [setTheme]);
  if (process.env.NODE_ENV === "production") return null;
  return <TmsLocaleContext.Provider value={context}>
    <div className={styles.preview} data-falcon-workspace>
      <nav className={styles.controls} aria-label="Local move dialog controls">
        <span>{locale === "ru" ? "Локальный перенос · данные только в памяти" : "Local move dialog · memory only"}</span>
        <button onClick={() => setLocale(locale === "ru" ? "en" : "ru")}>{locale === "ru" ? "English" : "Русский"}</button>
        <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>{resolvedTheme === "dark" ? "Light" : "Dark"}</button>
        <button onClick={() => setOpen(true)}>{locale === "ru" ? "Открыть перенос" : "Open move"}</button>
        <button onClick={() => { setRevision(value => value + 1); setNotice(""); setEvents([]); setOpen(true); }}>{locale === "ru" ? "Сбросить" : "Reset"}</button>
      </nav>
      <main className={styles.workspace} style={{ padding: 32, overflow: "auto" }}>
        <h1>{fixture.source.title}</h1>
        <p>{locale === "ru" ? "Текущее расположение" : "Current location"}: {fixture.path.map(item => item.title).join(" › ") || productDocsCopy(locale).projectRoot}</p>
        <p>{locale === "ru" ? "Версия черновика" : "Draft version"}: {fixture.source.draftVersion}</p>
        {notice && <p role="status">{notice}</p>}
        <pre aria-label="Local preview requests">{events.join("\n")}</pre>
      </main>
      {open && <MoveProductDoc key={`${locale}:${revision}`} api={fixture.api} scope={moveScope} document={fixture.source}
        path={fixture.path} copy={productDocsCopy(locale)} onClose={() => setOpen(false)}
        onMoved={() => setNotice(locale === "ru" ? "Документ перемещён только в локальном примере." : "Document moved in local memory only.")} />}
    </div>
  </TmsLocaleContext.Provider>;
}
