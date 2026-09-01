"use client";

import { useEffect } from "react";
import falconFaviconOnDark from "../../../../src/modules/core-tms/assets/falcon/falcon-favicon-on-dark.png";
import falconFaviconOnLight from "../../../../src/modules/core-tms/assets/falcon/falcon-favicon-on-light.png";

const TMS_HOST = "tms.saturnusgo.com";

function isTmsHost(hostname: string) {
  return hostname === TMS_HOST || hostname === "localhost" || hostname === "127.0.0.1";
}

export function TmsFavicon() {
  useEffect(() => {
    if (!isTmsHost(window.location.hostname)) return;

    const icons = [
      { mark: falconFaviconOnLight, media: "(prefers-color-scheme: light)" },
      { mark: falconFaviconOnDark, media: "(prefers-color-scheme: dark)" },
    ].map(({ mark, media }) => {
      const icon = document.createElement("link");
      icon.rel = "icon";
      icon.type = "image/png";
      icon.sizes = `${mark.width}x${mark.height}`;
      icon.href = mark.src;
      icon.media = media;
      icon.dataset.falconFavicon = "true";
      document.head.append(icon);
      return icon;
    });

    return () => icons.forEach((icon) => icon.remove());
  }, []);

  return null;
}
