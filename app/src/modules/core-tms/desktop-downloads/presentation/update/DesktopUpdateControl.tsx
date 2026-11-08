"use client";

import { Download } from "lucide-react";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { getDesktopUpdate, type DesktopUpdate } from "../../model/update";
import { DesktopDownloadsPanel } from "../DesktopDownloadsPanel";
import css from "../desktop-downloads.module.css";

type DownloadHandoff = {
  requestId: string | null;
  startedAt: number;
  timer: ReturnType<typeof setTimeout>;
  finish: (failed: boolean) => void;
};

export function DesktopUpdateControl({ renderTooltip }: {
  renderTooltip?: (label: string, action: ReactElement, enabled: boolean) => ReactElement;
} = {}) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const [update, setUpdate] = useState<DesktopUpdate | null>(null);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [handoff, setHandoff] = useState<"idle" | "opening" | "failed">("idle");
  const trigger = useRef<HTMLButtonElement>(null);
  const pending = useRef<DownloadHandoff | null>(null);

  useEffect(() => {
    let active = true;
    void getDesktopUpdate(navigator).then(value => { if (active) setUpdate(value); });
    function acknowledge(event: Event) {
      const result = (event as CustomEvent<{ requestId: string; opened: boolean }>).detail;
      const attempt = pending.current;
      if (!attempt?.requestId || result?.requestId !== attempt.requestId || typeof result.opened !== "boolean") return;
      clearTimeout(attempt.timer);
      attempt.requestId = null;
      attempt.timer = setTimeout(() => attempt.finish(!result.opened), Math.max(0, 220 - (Date.now() - attempt.startedAt)));
    }
    window.addEventListener("falcon:desktop-update-handoff", acknowledge);
    return () => {
      active = false;
      window.removeEventListener("falcon:desktop-update-handoff", acknowledge);
      if (pending.current) clearTimeout(pending.current.timer);
      pending.current = null;
    };
  }, []);

  if (!update) return null;
  function openInstaller(href: string) {
    if (pending.current) return;
    function finish(failed: boolean) {
      if (pending.current) clearTimeout(pending.current.timer);
      pending.current = null;
      setHandoff(failed ? "failed" : "idle");
    }
    setHandoff("opening");
    try {
      const requestId = navigator.userAgent.split(" ").includes("FalconUpdateHandoff/1") ? crypto.randomUUID() : null;
      pending.current = {
        requestId,
        startedAt: Date.now(),
        finish,
        // Older shells open the browser without reporting its response.
        timer: setTimeout(() => finish(Boolean(requestId)), requestId ? 10_000 : 700),
      };
      const address = requestId ? `${href}#falcon-update=${requestId}` : href;
      window.open(address, "_blank", "noopener,noreferrer");
    } catch {
      finish(true);
    }
  }

  const busy = handoff === "opening";
  const openingLabel = ru ? "Открываем загрузку" : "Opening download";
  const label = busy ? openingLabel : ru ? `Скачать обновление Falcon ${update.version}` : `Download Falcon ${update.version} update`;
  const icon = <span className={css.updateBadge} aria-hidden="true">
    <Download size={15} strokeWidth={1.8} />
    <span className={css.updateRing} data-active={busy || undefined} />
  </span>;
  const attributes = { className: css.update, "aria-label": label, "aria-busy": busy || undefined,
    "aria-disabled": busy || undefined, "data-testid": "desktop-update", title: renderTooltip ? undefined : label };
  const installer = update.installer;
  const action = installer ? <a {...attributes} href={installer.href} onClick={event => {
    event.preventDefault();
    openInstaller(installer.href);
  }}>{icon}</a> : <button {...attributes} ref={trigger} type="button" aria-haspopup="dialog" aria-expanded={chooserOpen}
    onClick={() => { if (!pending.current) setChooserOpen(true); }}>{icon}</button>;
  return <div className={css.updateControl}>
    {renderTooltip ? renderTooltip(label, action, !chooserOpen) : action}
    {!installer && <DesktopDownloadsPanel open={chooserOpen} anchor={trigger} onClose={() => setChooserOpen(false)} installerFiles={update.macFiles}
      onDownload={openInstaller} />}
    <span className={css.updateAnnouncement} role="status">{busy ? openingLabel : ""}</span>
    {handoff === "failed" && <span className={css.updateError} role="alert">{ru ? "Не удалось открыть загрузку. Повторите попытку." : "Could not open the download. Try again."}</span>}
  </div>;
}
