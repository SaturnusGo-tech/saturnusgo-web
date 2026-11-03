/** A short presentation label; unknown signatures never become user-facing copy. */
export function sessionDevice(userAgent: string | null | undefined): { label: string; mobile: boolean } {
  const ua = userAgent ?? "";
  const browser = ([
    [/\bEdg(?:A|iOS)?\//i, "Edge"], [/\b(?:OPR|OPiOS)\//i, "Opera"],
    [/\bSamsungBrowser\//i, "Samsung Internet"], [/\b(?:Firefox|FxiOS)\//i, "Firefox"],
    [/\b(?:Chrome|CriOS|Chromium)\//i, "Chrome"], [/Version\/[\d.]+.*Safari\//i, "Safari"],
  ] as const).find(([pattern]) => pattern.test(ua))?.[1];
  const system = ([
    [/iPhone|iPod/i, "iPhone"], [/iPad/i, "iPad"], [/Android/i, "Android"], [/Windows Phone/i, "Windows Phone"],
    [/Windows NT/i, "Windows"], [/CrOS/i, "ChromeOS"], [/Macintosh|Mac OS X/i, "macOS"], [/Linux/i, "Linux"],
  ] as const).find(([pattern]) => pattern.test(ua))?.[1];
  return { label: browser ? [browser, system].filter(Boolean).join(" · ") : "Falcon",
    mobile: /iPhone|iPod|iPad|Android|Windows Phone/i.test(ua) };
}
