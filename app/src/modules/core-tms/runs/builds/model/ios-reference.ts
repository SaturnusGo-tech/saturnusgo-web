export function iosReferenceError(value: string, ru: boolean): string {
  const reference = value.trim();
  const invalid = () => ru ? "Укажите версию iOS или полную ссылку HTTP(S)." : "Enter an iOS version or a complete HTTP(S) link.";
  if (/[\u0000-\u001f\u007f]/u.test(reference)) return invalid();
  if (/^[A-Za-z][A-Za-z0-9+.-]*:|^\/\/|^https?\b/i.test(reference)) {
    try {
      const url = new URL(reference);
      if (!/^https?:\/\//i.test(reference) || !["https:", "http:"].includes(url.protocol)
        || !url.hostname || url.username || url.password || /\s|\\/u.test(reference)) return invalid();
    } catch { return invalid(); }
  }
  return "";
}
