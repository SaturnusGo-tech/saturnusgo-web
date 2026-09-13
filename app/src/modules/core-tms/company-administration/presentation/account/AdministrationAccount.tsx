"use client";
import { ChevronRight, LogOut, Moon, Sun, UserRound } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import type { SignedInCompanySession } from "../../../auth/managed/domain/managed-access";
import { ManagedAvatarImage } from "../../../auth/managed/presentation/avatar/ManagedAvatarImage";
import type { AdministrationPort } from "../../application/ports/administration-port";
import type { AdministrationRoute } from "../../application/navigation/useAdministrationNavigation";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { administrationCopy } from "../copy/administration-copy";
import styles from "./account.module.css";

export function AdministrationAccount({ session, client, logout, onNavigate }: {
  readonly session: SignedInCompanySession; readonly client: AdministrationPort; readonly logout: () => Promise<void>;
  readonly onNavigate: (route: AdministrationRoute) => void;
}) {
  const { locale, setLocale } = useTmsLocale();
  const { resolvedTheme, setTheme } = useTheme();
  const copy = administrationCopy(locale);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const load = useCallback((signal: AbortSignal) => client.avatar(null, signal), [client]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  return <div className={styles.root} ref={root} onKeyDown={(event) => {
    if (event.key === "Escape") { event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
  }}>
    <button ref={trigger} className={styles.trigger} aria-expanded={open} aria-label={`${copy.profile}: ${session.identity.name}`}
      onClick={() => setOpen(!open)}><ManagedAvatarImage className={styles.photo} name={session.identity.name}
        hasAvatar={session.identity.hasAvatar} version={session.identity.version} load={load} />
      <span>{session.identity.name}</span><ChevronRight size={16} /></button>
    {open && <div className={styles.menu}>
      <button onClick={() => { setOpen(false); onNavigate({ section: "profile", id: null, creating: false }); }}><UserRound size={16} />{copy.profile}</button>
      <button onClick={() => setLocale(locale === "ru" ? "en" : "ru")}>{locale === "ru" ? "English" : "Русский"}</button>
      <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
        {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        {locale === "ru" ? (resolvedTheme === "dark" ? "Светлая тема" : "Тёмная тема") : (resolvedTheme === "dark" ? "Light appearance" : "Dark appearance")}</button>
      <button onClick={() => { setFailed(false); void logout().catch(() => setFailed(true)); }}><LogOut size={16} />{copy.logout}</button>
      {failed && <p role="alert">{copy.requestFailed}</p>}
    </div>}
  </div>;
}
