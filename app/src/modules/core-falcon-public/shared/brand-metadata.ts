import type { Metadata } from "next";

export const FALCON_ICON = "/falcon/falcon-icon.png";

export const falconBrandIcons: Metadata["icons"] = {
  icon: [
    { url: "/falcon/favicon.ico", type: "image/x-icon" },
    { url: "/falcon/falcon-mark-dark.png?v=20261109", type: "image/png", sizes: "256x256", media: "(prefers-color-scheme: light)" },
    { url: "/falcon/falcon-mark-light.png?v=20261109", type: "image/png", sizes: "256x256", media: "(prefers-color-scheme: dark)" },
  ],
  apple: { url: FALCON_ICON, type: "image/png", sizes: "256x256" },
};

export const falconBrandPreview = {
  url: FALCON_ICON,
  width: 256,
  height: 256,
  alt: "Falcon",
};
