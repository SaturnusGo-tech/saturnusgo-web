"use client";

import { Download, Laptop, Monitor, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { desktopDownloadsPosition } from "../model/position";
import release from "../model/release.json";
import css from "./desktop-downloads.module.css";

type Props = {
  readonly open: boolean;
  readonly anchor: RefObject<HTMLButtonElement | null>;
  readonly onClose: () => void;
};

export function DesktopDownloadsPanel({ open, anchor, onClose }: Props) {
  const { locale } = useTmsLocale(), ru = locale === "ru", id = useId();
  const panel = useRef<HTMLDivElement>(null), closeCallback = useRef(onClose);
  const [position, setPosition] = useState<ReturnType<typeof desktopDownloadsPosition> | null>(null);
  closeCallback.current = onClose;

  useEffect(() => {
    if (!open) { setPosition(null); return; }
    const place = () => {
      const rect = anchor.current?.getBoundingClientRect();
      if (!rect || !panel.current) return;
      setPosition(desktopDownloadsPosition(rect, { width: window.innerWidth, height: window.innerHeight }, panel.current.offsetHeight));
    };
    const dismiss = (event: Event) => {
      if (!panel.current?.contains(event.target as Node) && !anchor.current?.contains(event.target as Node)) closeCallback.current();
    };
    const otherOpened = (event: Event) => { if ((event as CustomEvent).detail !== id) closeCallback.current(); };
    // Account, notification and download popovers share one visible surface at a time.
    document.dispatchEvent(new CustomEvent("falcon:rail-popup-opened", { detail: id }));
    place();
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("focusin", dismiss);
    document.addEventListener("falcon:rail-popup-opened", otherOpened);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("focusin", dismiss);
      document.removeEventListener("falcon:rail-popup-opened", otherOpened);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchor, id]);

  const visible = open && position !== null;
  useEffect(() => {
    if (visible) panel.current?.querySelector<HTMLElement>("a[download]")?.focus({ preventScroll: true });
  }, [visible]);

  if (!open || typeof document === "undefined") return null;
  const close = () => { onClose(); anchor.current?.focus({ preventScroll: true }); };
  return createPortal(<div ref={panel} className={css.panel} role="dialog" aria-modal="false" aria-labelledby={`${id}-title`}
    style={position ?? { visibility: "hidden" }} onKeyDown={event => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); }
    }}>
    <header className={css.header}>
      <div><h2 id={`${id}-title`}>{ru ? "Скачать приложение" : "Download app"}</h2><span className={css.version}>Beta · {release.version}</span></div>
      <button type="button" className={css.close} onClick={close} aria-label={ru ? "Закрыть" : "Close"}><X size={18} strokeWidth={1.7} aria-hidden="true" /></button>
    </header>
    <div className={css.builds}>
      {release.artifacts.map(build => {
        const Platform = build.platform === "mac" ? Laptop : Monitor;
        return <a key={build.id} className={css.build} href={`${release.baseUrl}${build.file}`} download={build.file}>
          <Platform className={css.platform} size={22} strokeWidth={1.6} aria-hidden="true" />
          <span className={css.description}><strong>{build.label}</strong><span>{build.minimum} · {Math.round(build.bytes / 1024 / 1024)} MB</span></span>
          <Download className={css.download} size={18} strokeWidth={1.6} aria-hidden="true" />
        </a>;
      })}
    </div>
    <footer className={css.footer}>
      <p>{ru ? "macOS: локальная подпись, без нотариализации. Windows: без цифровой подписи." : "macOS: ad-hoc signed, not notarized. Windows: unsigned."}</p>
      <a href={`${release.baseUrl}${release.checksums}`} download={release.checksums}>{ru ? "Контрольные суммы SHA-256" : "SHA-256 checksums"}</a>
    </footer>
  </div>, document.body);
}
