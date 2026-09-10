import { ProfileLink } from "../../profile/presentation/ProfileLink";
import { useOptionalTmsSession } from "../../auth/presentation/session/TmsSessionContext";
import { ManagedAvatarImage } from "../../auth/managed/presentation/avatar/ManagedAvatarImage";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import styles from "./navigation-profile.module.css";

export function NavigationProfile({ collapsed }: { readonly collapsed: boolean }) {
  const session = useOptionalTmsSession();
  const { locale } = useTmsLocale();
  if (!session?.profilePath) return null;
  const label = locale === "ru" ? "Мой профиль" : "My profile";
  return <ProfileLink className={styles.profile} data-collapsed={collapsed}
    aria-label={`${label}: ${session.label}`} title={collapsed ? `${session.label} · ${label}` : label}>
    <ManagedAvatarImage className={styles.avatar} name={session.label} hasAvatar={Boolean(session.hasAvatar)} load={session.avatarLoader} version={session.avatarVersion} />
    <span className={styles.name}>{session.label}</span>
  </ProfileLink>;
}
