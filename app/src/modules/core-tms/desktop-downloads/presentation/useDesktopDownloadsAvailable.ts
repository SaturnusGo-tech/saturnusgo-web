"use client";

import { useEffect, useState } from "react";
import { isFalconDesktop } from "../../auth/sign-in/domain/desktop-mode";

export function useDesktopDownloadsAvailable(): boolean {
  // Keep server and initial client output aligned without flashing downloads in the desktop app.
  const [available, setAvailable] = useState(false);
  useEffect(() => { setAvailable(!isFalconDesktop()); }, []);
  return available;
}
