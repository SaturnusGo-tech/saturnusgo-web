import type { TmsLocale } from "../../model/locale";

const defaultPersonalName = { en: "My workspace", ru: "Моё пространство" } as const;

export function workspaceDisplayName(workspace: { name: string; kind?: "personal" | "company" }, locale: TmsLocale) {
  const { kind, name } = workspace;
  if (kind === "personal" && (name === defaultPersonalName.en || name === defaultPersonalName.ru)) {
    return defaultPersonalName[locale];
  }
  return name;
}
