export function PublicDocsIcon({ name }: { name: "search" | "menu" | "close" | "arrow" | "theme" | "copy" | "check" | "external" }) {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "search" ? <><circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 4 4" /></>
      : name === "menu" ? <path d="M3 5h14M3 10h14M3 15h14" />
      : name === "close" ? <path d="m5 5 10 10M15 5 5 15" />
      : name === "arrow" ? <path d="M4 10h12m-5-5 5 5-5 5" />
      : name === "theme" ? <><circle cx="10" cy="10" r="3.5" /><path d="M10 2v1M10 17v1M2 10h1M17 10h1m-12.7-5.7.7.7m10 10 .7.7m0-11.4-.7.7m-10 10-.7.7" /></>
      : name === "copy" ? <><rect x="7" y="7" width="10" height="10" rx="2" /><path d="M12 4V3H3v9h1" /></>
      : name === "check" ? <path d="m4 10 4 4 8-8" />
      : <path d="M11 3h6v6m0-6-9 9m0-8H3v13h13v-5" />}
  </svg>;
}
