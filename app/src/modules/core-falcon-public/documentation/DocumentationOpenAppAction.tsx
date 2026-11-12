"use client";

import { useEffect, useState } from "react";
import { installedDesktopVersion } from "../../core-tms/desktop-downloads/model/update";
import { PublicDocsIcon } from "./PublicDocsIcon";
import styles from "./documentation.module.css";

export function DocumentationOpenAppAction({ href, label }: { href: string; label: string }) {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    // Resolve after hydration so Help never flashes an Open App action inside Falcon.
    if (typeof navigator !== "undefined") setAvailable(!installedDesktopVersion(navigator.userAgent));
  }, []);
  return available ? <a className={styles.openApp} href={href}>{label}<PublicDocsIcon name="arrow" /></a> : null;
}
