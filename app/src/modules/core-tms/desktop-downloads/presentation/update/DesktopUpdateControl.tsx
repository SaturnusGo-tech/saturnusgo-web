"use client";

import { LoadingOrb } from "../../../../../shared/components/loading/LoadingOrb";
import { Download } from "lucide-react";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { loadDesktopUpdate, type AvailableDesktopUpdate } from "../../model/update";
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
  const [update, setUpdate] = useState<AvailableDesktopUpdate | null>(null);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [handoff, setHandoff] = useState<"idle" | "opening" | "failed">("idle");
  const trigger = useRef<HTMLButtonElement>(null);
  const pending = useRef<DownloadHandoff | null>(null);
  const checking = useRef(false), mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const refresh = () => {
      if (pending.current || checking.current) return;
      void loadDesktopUpdate(navigator).then(value => { if (mounted.current) setUpdate(value); }).catch(() => {});
    };
    refresh();
    function acknowledge(event: Event) {
      const result = (event as CustomEvent<{ requestId: string; opened: boolean }>).detail;
      const attempt = pending.current;
      if (!attempt?.requestId || result?.requestId !== attempt.requestId || typeof result.opened !== "boolean") return;
      clearTimeout(attempt.timer);
      attempt.requestId = null;
      attempt.timer = setTimeout(() => attempt.finish(!result.opened), Math.max(0, 220 - (Date.now() - attempt.startedAt)));
    }
    window.addEventListener("falcon:desktop-update-handoff", acknowledge);
    window.addEventListener("focus", refresh);
    return () => {
      mounted.current = false;
      window.removeEventListener("falcon:desktop-update-handoff", acknowledge);
      window.removeEventListener("focus", refresh);
      if (pending.current) clearTimeout(pending.current.timer);
      pending.current = null;
    };
  }, []);

  if (!update) return null;
  async function openInstaller(href: string) {
    if (pending.current || checking.current) return;
    checking.current = true;
    function finish(failed: boolean) {
      if (pending.current) clearTimeout(pending.current.timer);
      pending.current = null;
      checking.current = false;
      if (mounted.current) setHandoff(failed ? "failed" : "idle");
    }
    setHandoff("opening");
    try {
      const chosen = update!.release.artifacts.find(build => `${update!.release.baseUrl}${build.file}` === href);
      if (!chosen) throw new Error("Unknown desktop installer");
      const current = await loadDesktopUpdate(navigator);
      if (!mounted.current) return;
      setUpdate(current);
      if (!current) { finish(false); return; }
      const build = current.release.artifacts.find(build => build.id === chosen.id);
      const eligible = current.installer ? [current.installer.file] : current.macFiles;
      if (!build || !eligible.includes(build.file)) throw new Error("Desktop installer unavailable");
      href = `${current.release.baseUrl}${build.file}`;
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
    } finally {
      checking.current = false;
    }
  }

  const busy = handoff === "opening";
  const openingLabel = ru ? "Открываем загрузку" : "Opening download";
  const label = busy ? openingLabel : ru ? `Скачать обновление Falcon ${update.version}` : `Download Falcon ${update.version} update`;
  const icon = <span className={css.updateBadge} aria-hidden="true">
    {busy ? <LoadingOrb size="md" /> : <Download size={15} strokeWidth={1.8} />}
  </span>;
  const attributes = { className: css.update, "aria-label": label, "aria-busy": busy || undefined,
    "aria-disabled": busy || undefined, "data-testid": "desktop-update", title: renderTooltip ? undefined : label };
  const installer = update.installer;
  const action = installer ? <a {...attributes} href={installer.href} onClick={event => {
    event.preventDefault();
    void openInstaller(installer.href);
  }}>{icon}</a> : <button {...attributes} ref={trigger} type="button" aria-haspopup="dialog" aria-expanded={chooserOpen}
    onClick={() => { if (!pending.current && !checking.current) setChooserOpen(true); }}>{icon}</button>;
  return <div className={css.updateControl}>
    {renderTooltip ? renderTooltip(label, action, !chooserOpen) : action}
    {!installer && <DesktopDownloadsPanel open={chooserOpen} anchor={trigger} onClose={() => setChooserOpen(false)} installerFiles={update.macFiles}
      release={update.release} onDownload={href => void openInstaller(href)} />}
    <span className={css.updateAnnouncement} role="status">{busy ? openingLabel : ""}</span>
    {handoff === "failed" && <span className={css.updateError} role="alert">{ru ? "Не удалось открыть загрузку. Повторите попытку." : "Could not open the download. Try again."}</span>}
  </div>;
}
