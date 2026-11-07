"use client";

import { useEffect, useState } from "react";
import { installedDesktopVersion } from "../model/update";

const MOBILE_USER_AGENT = /\b(?:Android|iPhone|iPad|iPod|IEMobile|Opera Mini|BlackBerry|Windows Phone|webOS|Mobile)\b/i;

export function useDesktopDownloadsAvailable(): boolean {
  // Keep downloads hidden until the browser environment is known.
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    const { userAgent, maxTouchPoints } = navigator;
    // Safari on iPad can send the same user agent as macOS Safari.
    const isAppleMobileInDesktopMode = /\bMacintosh\b/i.test(userAgent) && maxTouchPoints > 1;
    setAvailable(!installedDesktopVersion(userAgent) && !MOBILE_USER_AGENT.test(userAgent) && !isAppleMobileInDesktopMode);
  }, []);
  return available;
}
