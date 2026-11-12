"use client";
import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { TmsLocaleContext } from "../../localization/context/TmsLocaleProvider";
import { TmsSessionProvider } from "../../auth/presentation/session/TmsSessionContext";
import { ConfigView } from "../../presentation/config/ConfigView";
import { NotificationPage } from "../../notifications/presentation/NotificationPage";
import { useNotifications } from "../../notifications/application/useNotifications";
import { createNotificationPreviewClient } from "./notification-preview-client";
import type { BrowserNotificationPort } from "../../notifications/domain/notifications";
import styles from "./notification-preview.module.css";
const browser: BrowserNotificationPort = { permission: () => "unsupported", fingerprint: async () => null,
  enable: async () => { throw new Error("Disabled in preview"); }, disable: async () => {} };
export function NotificationSettingsPreview() {
  const [locale, setLocale] = useState<"en" | "ru">("en"), [desktop, setDesktop] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const client = useMemo(createNotificationPreviewClient, []), model = useNotifications(client, locale, browser);
  if (process.env.NODE_ENV === "production") return null;
  return <TmsLocaleContext.Provider value={{ locale, languageTag: locale === "ru" ? "ru-RU" : "en-US", setLocale, t: key => key }}>
    <TmsSessionProvider value={{ kind: "cloud", subject: "preview", label: "QA", workspaceId: "preview", signOut: async () => {} }}><div className={styles.preview} data-falcon-workspace>
      <nav className={styles.tools} aria-label="Preview controls"><span>Local preview · sample data · no delivery</span>
        <button onClick={() => setLocale(locale === "en" ? "ru" : "en")}>{locale === "en" ? "Русский" : "English"}</button>
        <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>{resolvedTheme === "dark" ? "Light" : "Dark"}</button>
        <button aria-pressed={desktop} onClick={() => setDesktop(!desktop)}>{desktop ? "Browser view" : "Desktop view"}</button></nav>
      <ConfigView environments={[]} workspaceId="preview" offline canManageProject={false} onEnvironmentSaved={() => {}}
        onToggleEnvironment={() => {}} onProjectUpdated={() => {}} onToggleProject={() => {}} exchange={null}
        notifications={<NotificationPage model={model} ru={locale === "ru"} embedded desktop={desktop}/>}/>
    </div></TmsSessionProvider>
  </TmsLocaleContext.Provider>;
}
