"use client";

import { useEffect } from "react";
import tessiqMark from "../../../../src/modules/core-tms/assets/tessiq/tessiq-mark-dark.png";

const TMS_HOST = "tms.saturnusgo.com";

function isTmsHost(hostname: string) {
  return hostname === TMS_HOST || hostname === "localhost" || hostname === "127.0.0.1";
}

export function TmsFavicon() {
  useEffect(() => {
    if (!isTmsHost(window.location.hostname)) return;

    const icon = document.createElement("link");
    icon.rel = "icon";
    icon.type = "image/png";
    icon.sizes = "512x512";
    icon.href = tessiqMark.src;
    icon.dataset.tessiqFavicon = "true";
    document.head.append(icon);

    return () => icon.remove();
  }, []);

  return null;
}
