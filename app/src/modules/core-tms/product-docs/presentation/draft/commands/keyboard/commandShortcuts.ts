const shortcuts = {
  h1: { code: "Digit1", key: "1", mod: true, alt: true },
  h2: { code: "Digit2", key: "2", mod: true, alt: true },
  h3: { code: "Digit3", key: "3", mod: true, alt: true },
  checklist: { code: "Digit7", key: "7", mod: true, shift: true },
  bulleted: { code: "Digit8", key: "8", mod: true, shift: true },
  numbered: { code: "Digit9", key: "9", mod: true, shift: true },
  attachment: { code: "KeyU", key: "U", mod: true, shift: true },
  code: { code: "Backslash", key: "\\", mod: true, shift: true },
  collapse: { code: "Digit6", key: "6", mod: true, shift: true },
  quote: { code: "Period", key: ".", alt: true, shift: true },
} as const satisfies Record<string, { code: string; key: string; mod?: true; alt?: true; shift?: true }>;

type Shortcut = { code: string; key: string; mod?: true; alt?: true; shift?: true };
type ShortcutEvent = Pick<KeyboardEvent, "code" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey" | "repeat" | "isComposing" | "getModifierState">;

export function productDocMacShortcuts() {
  return typeof navigator !== "undefined" && /Mac/i.test(navigator.platform || navigator.userAgent);
}

export function productDocShortcut(id: string, mac: boolean) {
  const shortcut: Shortcut | undefined = Object.prototype.hasOwnProperty.call(shortcuts, id) ? shortcuts[id as keyof typeof shortcuts] : undefined;
  if (!shortcut) return null;
  const modifiers = [
    ...(shortcut.mod ? [mac ? "Meta" : "Control"] : []),
    ...(shortcut.alt ? ["Alt"] : []),
    ...(shortcut.shift ? ["Shift"] : []),
  ];
  return {
    aria: [...modifiers, shortcut.key].join("+"),
    display: [...modifiers.map((key) => key === "Meta" ? "⌘" : key === "Control" ? "Ctrl"
      : key === "Alt" && mac ? "⌥" : key === "Shift" && mac ? "⇧" : key), shortcut.key].join(mac ? " " : "+"),
  };
}

export function productDocShortcutCommand(event: ShortcutEvent, mac: boolean) {
  if (event.repeat || event.isComposing || event.getModifierState("AltGraph")) return undefined;
  return Object.entries<Shortcut>(shortcuts).find(([, shortcut]) => event.code === shortcut.code
    && event.metaKey === Boolean(mac && shortcut.mod) && event.ctrlKey === Boolean(!mac && shortcut.mod)
    && event.altKey === Boolean(shortcut.alt) && event.shiftKey === Boolean(shortcut.shift))?.[0];
}
