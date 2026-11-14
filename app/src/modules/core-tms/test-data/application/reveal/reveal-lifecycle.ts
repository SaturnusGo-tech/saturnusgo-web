type Events = Pick<EventTarget, "addEventListener" | "removeEventListener">;
type Visibility = Events & { readonly hidden: boolean };
export function watchSecretVisibility(windowEvents: Events, documentEvents: Visibility, hide: () => void) {
  const visibility = () => { if (documentEvents.hidden) hide(); };
  windowEvents.addEventListener("blur", hide);
  documentEvents.addEventListener("visibilitychange", visibility);
  return () => {
    windowEvents.removeEventListener("blur", hide);
    documentEvents.removeEventListener("visibilitychange", visibility);
  };
}
