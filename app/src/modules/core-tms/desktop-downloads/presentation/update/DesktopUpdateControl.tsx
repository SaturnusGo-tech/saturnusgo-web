"use client";

import { Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { getDesktopUpdate, type DesktopUpdate } from "../../model/update";
import { DesktopDownloadsPanel } from "../DesktopDownloadsPanel";
import css from "../desktop-downloads.module.css";

export function DesktopUpdateControl() {
  const { locale } = useTmsLocale();
  const [update, setUpdate] = useState<DesktopUpdate | null>(null);
  const [chooserOpen, setChooserOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let active = true;
    void getDesktopUpdate(navigator).then(value => { if (active) setUpdate(value); });
    return () => { active = false; };
  }, []);

  if (!update) return null;
  const label = locale === "ru" ? `Скачать обновление Falcon ${update.version}` : `Download Falcon ${update.version} update`;
  const icon = <Download size={19} strokeWidth={1.8} aria-hidden="true" />;
  const attributes = { className: css.update, "aria-label": label, "data-nav-label": label, "data-testid": "desktop-update", title: label };
  if (update.installer) {
    return <a {...attributes} href={update.installer.href} download={update.installer.file}>{icon}</a>;
  }
  return <>
    <button {...attributes} ref={trigger} type="button" aria-haspopup="dialog" aria-expanded={chooserOpen}
      onClick={() => setChooserOpen(true)}>{icon}</button>
    <DesktopDownloadsPanel open={chooserOpen} anchor={trigger} onClose={() => setChooserOpen(false)} installerFiles={update.macFiles} />
  </>;
}
